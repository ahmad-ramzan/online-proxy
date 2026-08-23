/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PaymentTransaction, ProxyOrder } from '../src/types';
import { dbInstance } from './db';
import { ResidentialService } from './residentialService';
import { ZiniPayService } from './zinipayService';
import { PayStationService } from './paystationService';
import { CryptomusService } from './cryptomusService';

/**
 * =========================================================================
 * PROXIBITY ONLINE - INDEPENDENT PAYMENT GATEWAY INTEGRATION LAYER
 * =========================================================================
 * 
 * Instructions for Future Integration:
 * 1. Open this file (/server/paymentService.ts).
 * 2. Configure your Payment SDKs (e.g. `import Stripe from 'stripe'`).
 * 3. Inside `createCheckoutSession`, replace the simulation with your stripe/paypal session builder.
 * 4. Configure webhooks in your merchant dashboard to point to `/api/payment/webhook`.
 * 5. Feed the webhook data directly into `completePaymentTransaction` below to automatically
 *    activate orders and generate proxies!
 */

export class PaymentService {
  /**
   * Generates a checkout link or session configuration depending on merchant selection.
   */
  /**
   * Evaluates a coupon against a base USD amount. Returns the discounted total.
   * `error` is set (and no discount applied) when the coupon is invalid/expired.
   */
  public static evaluateCoupon(baseUsd: number, code?: string): {
    finalUsd: number; discountUsd: number; couponCode?: string; error?: string;
  } {
    const trimmed = (code || '').trim();
    if (!trimmed) return { finalUsd: baseUsd, discountUsd: 0 };

    const coupon = dbInstance.findCouponByCode(trimmed);
    if (!coupon) return { finalUsd: baseUsd, discountUsd: 0, error: 'Invalid coupon code.' };
    if (!coupon.isActive) return { finalUsd: baseUsd, discountUsd: 0, error: 'This coupon is no longer active.' };
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return { finalUsd: baseUsd, discountUsd: 0, error: 'This coupon has reached its usage limit.' };
    }

    let discount = coupon.type === 'percent' ? baseUsd * (coupon.value / 100) : coupon.value;
    discount = Math.min(discount, baseUsd);
    discount = Math.round(discount * 100) / 100;
    const finalUsd = Math.max(0, Math.round((baseUsd - discount) * 100) / 100);
    return { finalUsd, discountUsd: discount, couponCode: coupon.code };
  }

  public static async createCheckoutSession(params: {
    userId: string;
    userEmail: string;
    packageId: string;
    amountUsd: number;
    gateway: 'stripe' | 'crypto' | 'paypal' | 'credit_card' | 'paystation' | 'cryptomus';
    couponCode?: string;
    appUrl?: string;
    custPhone?: string;
  }): Promise<{
    checkoutUrl: string;
    transactionId: string;
    message: string;
    external?: boolean;
  }> {
    const settings = dbInstance.getPaymentSettings();
    const packages = dbInstance.getPackages();
    const pkg = packages.find(p => p.id === params.packageId);

    if (!pkg) {
      throw new Error(`Invalid pricing package selected: ${params.packageId}`);
    }

    // Server-authoritative pricing: base is the package price; apply the coupon here.
    const couponEval = this.evaluateCoupon(pkg.priceUsd, params.couponCode);
    if (couponEval.error) {
      throw new Error(couponEval.error);
    }
    const finalUsd = couponEval.finalUsd;

    // Stock guard: block the order if the Proxy-Seller residential balance can
    // no longer cover this plan. Only enforced when the upstream snapshot is
    // live (fail open on a transient API outage so we don't lose every sale).
    const stock = await ResidentialService.getAvailableStockGb();
    if (stock.live && stock.availableGb < pkg.bandwidthGb) {
      dbInstance.log(
        'warning',
        'payment',
        `Order blocked — insufficient residential stock. Requested ${pkg.bandwidthGb} GB, available (traffic_left) ${stock.trafficLeftGb.toFixed(2)} GB.`
      );
      throw new Error(
        stock.availableGb <= 0
          ? 'Sorry, our residential proxy stock is currently sold out. Please check back later.'
          : `Sorry, only ${stock.availableGb.toFixed(1)} GB of residential stock is available right now — not enough for this ${pkg.bandwidthGb} GB plan. Please choose a smaller plan or check back later.`
      );
    }

    dbInstance.log(
      'info',
      'payment',
      `Initiating checkout intent for package '${pkg.name}' via ${params.gateway.toUpperCase()}`
    );

    // ==========================================
    // PLACEHOLDER FOR STRIPE SESSIONS:
    // ==========================================
    /*
    if (params.gateway === 'stripe') {
      const stripe = new Stripe(settings.stripeSecretKey, { apiVersion: '2023-10-16' });
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: pkg.name, description: `${pkg.bandwidthGb} GB Premium Bandwidth` },
            unit_amount: pkg.priceUsd * 100,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.APP_URL}/dashboard?status=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL}/pricing?status=cancelled`,
      });
      return { checkoutUrl: session.url, transactionId: session.id, message: 'Stripe Session created.' };
    }
    */
    // ==========================================

    // SIMULATE CHECKOUT CREATION
    const txnId = `txn_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Create pre-allocated Order (pending payment status)
    const newOrder: ProxyOrder = {
      id: `ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId: params.userId,
      packageId: pkg.id,
      packageName: pkg.name,
      bandwidthGb: pkg.bandwidthGb,
      bandwidthUsedGb: 0,
      priceUsd: finalUsd,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 day validity
    };

    dbInstance.insertOrder(newOrder);

    // Create Payment transaction log
    const transaction: PaymentTransaction = {
      id: txnId,
      userId: params.userId,
      userEmail: params.userEmail,
      orderId: newOrder.id,
      amountUsd: finalUsd,
      gateway: params.gateway,
      status: 'pending',
      createdAt: new Date().toISOString(),
      couponCode: couponEval.couponCode,
      discountUsd: couponEval.discountUsd || undefined
    };

    dbInstance.insertTransaction(transaction);

    // Coupon covers the full amount (100% off): complete for free, no gateway.
    if (finalUsd <= 0) {
      await this.completePaymentTransaction(txnId);
      dbInstance.log('info', 'payment', `Free order via coupon ${couponEval.couponCode}: ${newOrder.id} activated.`);
      return {
        checkoutUrl: `${params.appUrl || ''}/?checkout=success`,
        transactionId: txnId,
        message: 'Coupon covers the full amount — order activated.',
        external: true
      };
    }

    // --- ZiniPay hosted checkout (Bangla QR / bKash / Nagad / card) ---
    if (params.gateway === 'credit_card' && ZiniPayService.isConfigured() && params.appUrl) {
      const amountBdt = ZiniPayService.usdToBdt(finalUsd);
      const invoice = await ZiniPayService.createInvoice({
        name: params.userEmail.split('@')[0] || 'Customer',
        email: params.userEmail,
        amountBdt,
        // No query string on these URLs: ZiniPay appends ?invoice_id=&status= itself.
        redirectUrl: `${params.appUrl}/api/payment/zinipay/return/${txnId}`,
        cancelUrl: `${params.appUrl}/api/payment/zinipay/cancel/${txnId}`,
        webhookUrl: `${params.appUrl}/api/payment/zinipay/webhook`,
        metadata: { txnId, orderId: newOrder.id, packageId: pkg.id, userId: params.userId }
      });

      if (invoice.ok && invoice.paymentUrl) {
        dbInstance.updateTransaction(txnId, { providerInvoiceId: invoice.invoiceId });
        dbInstance.log('info', 'payment', `ZiniPay checkout ready: txn ${txnId}, invoice ${invoice.invoiceId}, amount BDT ${amountBdt}`);
        return {
          checkoutUrl: invoice.paymentUrl,
          transactionId: txnId,
          message: 'Redirecting to ZiniPay secure checkout.',
          external: true
        };
      }
      throw new Error(invoice.message || 'ZiniPay checkout could not be created.');
    }

    // --- PayStation hosted checkout (bKash / Nagad / Rocket / card) ---
    if (params.gateway === 'paystation' && PayStationService.isConfigured() && params.appUrl) {
      const amountBdt = PayStationService.usdToBdt(finalUsd);
      const invoiceNumber = txnId; // our txn id doubles as PayStation's invoice_number
      const invoice = await PayStationService.createInvoice({
        invoiceNumber,
        name: params.userEmail.split('@')[0] || 'Customer',
        phone: (params.custPhone || '').trim() || '01700000000',
        email: params.userEmail,
        address: 'Bangladesh',
        amountBdt,
        reference: newOrder.id,
        callbackUrl: `${params.appUrl}/api/payment/paystation/callback`
      });

      if (invoice.ok && invoice.paymentUrl) {
        // Store the invoice number so the callback can look this txn up.
        dbInstance.updateTransaction(txnId, { providerInvoiceId: invoiceNumber });
        dbInstance.log('info', 'payment', `PayStation checkout ready: txn ${txnId}, amount BDT ${amountBdt}`);
        return {
          checkoutUrl: invoice.paymentUrl,
          transactionId: txnId,
          message: 'Redirecting to PayStation secure checkout.',
          external: true
        };
      }
      throw new Error(invoice.message || 'PayStation checkout could not be created.');
    }

    // --- Cryptomus hosted checkout (USDT / BTC / ETH …), charged in USD ---
    if (params.gateway === 'cryptomus' && CryptomusService.isConfigured() && params.appUrl) {
      const invoice = await CryptomusService.createInvoice({
        orderId: txnId, // our txn id doubles as Cryptomus order_id
        amountUsd: finalUsd,
        callbackUrl: `${params.appUrl}/api/payment/cryptomus/callback`,
        returnUrl: `${params.appUrl}/api/payment/cryptomus/return/${txnId}`,
        successUrl: `${params.appUrl}/api/payment/cryptomus/return/${txnId}`
      });

      if (invoice.ok && invoice.url) {
        dbInstance.updateTransaction(txnId, { providerInvoiceId: txnId, providerTxnId: invoice.uuid });
        dbInstance.log('info', 'payment', `Cryptomus checkout ready: txn ${txnId}, $${finalUsd}`);
        return {
          checkoutUrl: invoice.url,
          transactionId: txnId,
          message: 'Redirecting to Cryptomus secure crypto checkout.',
          external: true
        };
      }
      throw new Error(invoice.message || 'Cryptomus checkout could not be created.');
    }

    // Return dummy URL that automatically allows testing completions in UI
    const checkoutUrl = `/checkout-simulation?transactionId=${txnId}&orderId=${newOrder.id}&amount=${finalUsd}&gateway=${params.gateway}`;

    dbInstance.log(
      'info', 
      'payment', 
      `Checkout session pre-allocated: TransID: ${txnId}, OrderID: ${newOrder.id} for $${finalUsd}`
    );

    return {
      checkoutUrl,
      transactionId: txnId,
      message: 'Pending ledger transaction generated. Proceed to checkout URL to complete payment.'
    };
  }

  /**
   * Starts a WALLET TOP-UP: creates a `purpose: 'wallet'` transaction (no order)
   * and routes it to the chosen gateway. On payment completion the shared
   * callbacks credit the user's wallet balance (see completePaymentTransaction).
   */
  public static async createWalletTopupSession(params: {
    userId: string;
    userEmail: string;
    amountUsd: number;
    gateway: 'credit_card' | 'paystation' | 'cryptomus';
    appUrl: string;
    custPhone?: string;
  }): Promise<{ checkoutUrl: string; transactionId: string; external?: boolean }> {
    const amountUsd = Math.round((params.amountUsd || 0) * 100) / 100;
    if (!amountUsd || amountUsd < 1) throw new Error('Minimum top-up amount is $1.');
    if (amountUsd > 10000) throw new Error('Top-up amount is too large.');

    const txnId = `txn_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const transaction: PaymentTransaction = {
      id: txnId,
      userId: params.userId,
      userEmail: params.userEmail,
      orderId: '',
      amountUsd,
      gateway: params.gateway,
      status: 'pending',
      createdAt: new Date().toISOString(),
      purpose: 'wallet'
    };
    dbInstance.insertTransaction(transaction);

    // --- ZiniPay ---
    if (params.gateway === 'credit_card' && ZiniPayService.isConfigured()) {
      const amountBdt = ZiniPayService.usdToBdt(amountUsd);
      const invoice = await ZiniPayService.createInvoice({
        name: params.userEmail.split('@')[0] || 'Customer', email: params.userEmail, amountBdt,
        redirectUrl: `${params.appUrl}/api/payment/zinipay/return/${txnId}`,
        cancelUrl: `${params.appUrl}/api/payment/zinipay/cancel/${txnId}`,
        webhookUrl: `${params.appUrl}/api/payment/zinipay/webhook`,
        metadata: { txnId, purpose: 'wallet', userId: params.userId }
      });
      if (invoice.ok && invoice.paymentUrl) {
        dbInstance.updateTransaction(txnId, { providerInvoiceId: invoice.invoiceId });
        return { checkoutUrl: invoice.paymentUrl, transactionId: txnId, external: true };
      }
      throw new Error(invoice.message || 'ZiniPay top-up could not be created.');
    }

    // --- PayStation ---
    if (params.gateway === 'paystation' && PayStationService.isConfigured()) {
      const invoice = await PayStationService.createInvoice({
        invoiceNumber: txnId, name: params.userEmail.split('@')[0] || 'Customer',
        phone: (params.custPhone || '').trim() || '01700000000', email: params.userEmail,
        address: 'Bangladesh', amountBdt: PayStationService.usdToBdt(amountUsd),
        reference: 'wallet-topup', callbackUrl: `${params.appUrl}/api/payment/paystation/callback`
      });
      if (invoice.ok && invoice.paymentUrl) {
        dbInstance.updateTransaction(txnId, { providerInvoiceId: txnId });
        return { checkoutUrl: invoice.paymentUrl, transactionId: txnId, external: true };
      }
      throw new Error(invoice.message || 'PayStation top-up could not be created.');
    }

    // --- Cryptomus ---
    if (params.gateway === 'cryptomus' && CryptomusService.isConfigured()) {
      const invoice = await CryptomusService.createInvoice({
        orderId: txnId, amountUsd,
        callbackUrl: `${params.appUrl}/api/payment/cryptomus/callback`,
        returnUrl: `${params.appUrl}/api/payment/cryptomus/return/${txnId}`,
        successUrl: `${params.appUrl}/api/payment/cryptomus/return/${txnId}`
      });
      if (invoice.ok && invoice.url) {
        dbInstance.updateTransaction(txnId, { providerInvoiceId: txnId, providerTxnId: invoice.uuid });
        return { checkoutUrl: invoice.url, transactionId: txnId, external: true };
      }
      throw new Error(invoice.message || 'Cryptomus top-up could not be created.');
    }

    throw new Error('This payment method is not available for top-up right now.');
  }

  /**
   * Pays for a package straight from the user's wallet balance: debits the
   * wallet, creates an active order, and reserves the Proxy-Seller allocation.
   */
  public static async payFromWallet(params: { userId: string; userEmail: string; packageId: string; couponCode?: string }): Promise<{ ok: boolean; orderId: string }> {
    const pkg = dbInstance.getPackages().find(p => p.id === params.packageId);
    if (!pkg) throw new Error(`Invalid pricing package selected: ${params.packageId}`);

    const couponEval = this.evaluateCoupon(pkg.priceUsd, params.couponCode);
    if (couponEval.error) throw new Error(couponEval.error);
    const finalUsd = couponEval.finalUsd;

    // Stock guard (same as gateway checkout).
    const stock = await ResidentialService.getAvailableStockGb();
    if (stock.live && stock.availableGb < pkg.bandwidthGb) {
      throw new Error(stock.availableGb <= 0
        ? 'Sorry, our residential proxy stock is currently sold out. Please check back later.'
        : `Sorry, only ${stock.availableGb.toFixed(1)} GB of residential stock is available right now.`);
    }

    const debit = dbInstance.debitWallet(params.userId, finalUsd, `Purchase: ${pkg.name} (${pkg.bandwidthGb} GB)`);
    if (!debit.ok) throw new Error('Insufficient wallet balance. Please top up your wallet first.');

    const newOrder: ProxyOrder = {
      id: `ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId: params.userId, packageId: pkg.id, packageName: pkg.name,
      bandwidthGb: pkg.bandwidthGb, bandwidthUsedGb: 0, priceUsd: finalUsd,
      status: 'active', createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
    dbInstance.insertOrder(newOrder);

    const txnId = `txn_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    dbInstance.insertTransaction({
      id: txnId, userId: params.userId, userEmail: params.userEmail, orderId: newOrder.id,
      amountUsd: finalUsd, gateway: 'crypto', status: 'completed', createdAt: new Date().toISOString(),
      paymentMethod: 'wallet', couponCode: couponEval.couponCode, discountUsd: couponEval.discountUsd || undefined
    });
    if (couponEval.couponCode) {
      const coupon = dbInstance.findCouponByCode(couponEval.couponCode);
      if (coupon) dbInstance.updateCoupon(coupon.id, { usedCount: coupon.usedCount + 1 });
    }

    // Reserve the customer's traffic on Proxy-Seller (decimal GB).
    try {
      const trafficBytes = Math.round(newOrder.bandwidthGb * 1000 * 1000 * 1000);
      const sub = await ResidentialService.createSubUserPackage({ trafficBytes });
      dbInstance.updateOrder(newOrder.id, { subUserPackageKey: sub.packageKey });
    } catch (e) {
      console.error('Failed to reserve sub-user allocation (wallet pay): ', e);
    }
    dbInstance.log('info', 'payment', `Order ${newOrder.id} paid from wallet ($${finalUsd}).`);
    return { ok: true, orderId: newOrder.id };
  }

  /**
   * Confirms a ZiniPay payment by invoice id: verifies with ZiniPay (authoritative),
   * then activates the order. Called from the webhook and the redirect-return route.
   */
  public static async completePaymentByInvoiceId(invoiceId: string): Promise<{ ok: boolean; orderId?: string }> {
    const txn = dbInstance.getTransactions().find(t => t.providerInvoiceId === invoiceId);
    if (!txn) {
      dbInstance.log('warning', 'payment', `ZiniPay callback: no transaction for invoice ${invoiceId}`);
      return { ok: false };
    }
    if (txn.status === 'completed') return { ok: true, orderId: txn.orderId };

    const verify = await ZiniPayService.verifyInvoice(invoiceId);
    if (!verify.completed) {
      dbInstance.log('warning', 'payment', `ZiniPay invoice ${invoiceId} not completed (status=${verify.status ?? 'unknown'}).`);
      return { ok: false, orderId: txn.orderId };
    }

    dbInstance.updateTransaction(txn.id, { paymentMethod: verify.paymentMethod, providerTxnId: verify.transactionId });
    const done = await this.completePaymentTransaction(txn.id);
    return { ok: done, orderId: txn.orderId };
  }

  /**
   * Confirms a PayStation payment by invoice number: verifies via
   * /retrive-transaction (authoritative), then activates the order. Called from
   * the callback route.
   */
  public static async completePayStationByInvoice(invoiceNumber: string, trxId?: string): Promise<{ ok: boolean; orderId?: string; trxStatus?: string }> {
    const txn = dbInstance.getTransactions().find(t => t.providerInvoiceId === invoiceNumber);
    if (!txn) {
      dbInstance.log('warning', 'payment', `PayStation callback: no transaction for invoice ${invoiceNumber}`);
      return { ok: false };
    }
    if (txn.status === 'completed') return { ok: true, orderId: txn.orderId, trxStatus: 'success' };

    const verify = await PayStationService.verifyInvoice(invoiceNumber, trxId);
    if (!verify.completed) {
      dbInstance.log('warning', 'payment', `PayStation invoice ${invoiceNumber} not completed (trx_status=${verify.trxStatus ?? 'unknown'}).`);
      return { ok: false, orderId: txn.orderId, trxStatus: verify.trxStatus };
    }

    dbInstance.updateTransaction(txn.id, { paymentMethod: 'paystation', providerTxnId: verify.trxId });
    const done = await this.completePaymentTransaction(txn.id);
    return { ok: done, orderId: txn.orderId, trxStatus: verify.trxStatus };
  }

  /**
   * Confirms a Cryptomus payment by order id: verifies via /v1/payment/info
   * (authoritative), then activates the order. Called from the callback route.
   */
  public static async completeCryptomusByOrder(orderId: string): Promise<{ ok: boolean; orderId?: string; status?: string }> {
    const txn = dbInstance.getTransactions().find(t => t.providerInvoiceId === orderId);
    if (!txn) {
      dbInstance.log('warning', 'payment', `Cryptomus callback: no transaction for order ${orderId}`);
      return { ok: false };
    }
    if (txn.status === 'completed') return { ok: true, orderId: txn.orderId, status: 'paid' };

    const verify = await CryptomusService.verifyInvoice(orderId);
    if (!verify.completed) {
      dbInstance.log('warning', 'payment', `Cryptomus order ${orderId} not completed (status=${verify.status ?? 'unknown'}).`);
      return { ok: false, orderId: txn.orderId, status: verify.status };
    }

    dbInstance.updateTransaction(txn.id, { paymentMethod: 'cryptomus' });
    const done = await this.completePaymentTransaction(txn.id);
    return { ok: done, orderId: txn.orderId, status: verify.status };
  }

  /**
   * Finalizes pending transaction. Triggered either by simulation or real webhooks.
   */
  public static async completePaymentTransaction(transactionId: string): Promise<boolean> {
    const db = dbInstance;
    const txns = db.getTransactions();
    const txnIdx = txns.findIndex(t => t.id === transactionId);

    if (txnIdx === -1) {
      db.log('error', 'payment', `Completed transaction request failed: Transaction ID ${transactionId} not found.`);
      return false;
    }

    const txn = txns[txnIdx];
    if (txn.status === 'completed') return true;

    // Update Transaction State
    txn.status = 'completed';
    db.log('info', 'payment', `Payment verified successfully for Transaction: ${transactionId} via ${txn.gateway.toUpperCase()}`);

    // Wallet top-up: credit the user's balance instead of activating an order.
    if (txn.purpose === 'wallet') {
      db.updateTransaction(txn.id, { status: 'completed' });
      db.creditWallet(txn.userId, txn.amountUsd, `Wallet top-up via ${txn.gateway}`);
      return true;
    }

    // Update corresponding Order State to 'active'
    db.updateOrder(txn.orderId, { status: 'active' });
    db.log('info', 'payment', `Proxy allocation unlocked. Package is now active on order: ${txn.orderId}`);

    // Count coupon usage on successful completion.
    if (txn.couponCode) {
      const coupon = db.findCouponByCode(txn.couponCode);
      if (coupon) db.updateCoupon(coupon.id, { usedCount: coupon.usedCount + 1 });
    }

    // Reserve this customer's purchased traffic on Proxy-Seller as a dedicated
    // sub-user (per-customer isolated allocation). We do NOT auto-create a proxy —
    // the customer creates their own proxies (choosing geo/rotation) from the
    // Create Proxy page. This avoids unwanted auto-added proxies.
    try {
      const order = db.getOrders().find(o => o.id === txn.orderId);
      if (order && !order.subUserPackageKey) {
        // Reserve in decimal GB (1 GB = 1000 MB) to match what the customer buys.
        const trafficBytes = Math.round(order.bandwidthGb * 1000 * 1000 * 1000);
        const sub = await ResidentialService.createSubUserPackage({ trafficBytes });
        db.updateOrder(order.id, { subUserPackageKey: sub.packageKey });
        db.log(
          'info',
          'proxy',
          `Reserved ${order.bandwidthGb}GB for order ${order.id} as sub-user ${sub.packageKey} (${sub.live ? 'live' : 'simulated'})`
        );
      }
    } catch (e) {
      console.error('Failed to reserve sub-user allocation: ', e);
    }

    return true;
  }
}
