/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { dbInstance } from './db';

/**
 * =========================================================================
 * PAYSTATION (Bangladesh) — hosted-checkout integration
 * https://www.paystation.com.bd/documentation
 * =========================================================================
 *
 * Flow (all live-verified):
 *   1. POST {base}/grant-token       headers: merchantId, password           -> { token }
 *   2. POST {base}/create-payment    header: token   (form-urlencoded body)  -> { payment_url }
 *   3. POST {base}/retrive-transaction header: token (form body)             -> { data.trx_status }
 *
 * Packages are priced in USD; PayStation charges in BDT, so amounts are
 * converted with `paystationUsdToBdt` (falls back to the ZiniPay rate).
 * Credentials live in the DB (Admin -> Payment Settings), never hardcoded.
 */

export interface PayStationCreateResult {
  ok: boolean;
  paymentUrl?: string;
  invoiceNumber?: string;
  message?: string;
}

export interface PayStationVerifyResult {
  ok: boolean;
  completed: boolean;
  trxStatus?: string;
  trxId?: string;
  message?: string;
}

export class PayStationService {
  private static getConfig() {
    const s = dbInstance.getPaymentSettings();
    const baseUrl = (s.paystationBaseUrl || 'https://api.paystation.com.bd').replace(/\/+$/, '');
    const merchantId = (s.paystationMerchantId || '').trim();
    const password = (s.paystationPassword || '').trim();
    const usdToBdt = s.paystationUsdToBdt && s.paystationUsdToBdt > 0
      ? s.paystationUsdToBdt
      : (s.zinipayUsdToBdt && s.zinipayUsdToBdt > 0 ? s.zinipayUsdToBdt : 120);
    return { baseUrl, merchantId, password, usdToBdt };
  }

  public static isConfigured(): boolean {
    const { merchantId, password } = this.getConfig();
    return !!(merchantId && password);
  }

  /** Convert a USD amount to the integer BDT amount PayStation expects. */
  public static usdToBdt(amountUsd: number): number {
    const { usdToBdt } = this.getConfig();
    return Math.max(1, Math.round(amountUsd * usdToBdt));
  }

  /** Exchange merchantId + password for a short-lived bearer token. */
  private static async getToken(): Promise<string | null> {
    const { baseUrl, merchantId, password } = this.getConfig();
    if (!merchantId || !password) return null;
    try {
      const res = await fetch(`${baseUrl}/grant-token`, {
        method: 'POST',
        headers: { merchantId, password },
        signal: AbortSignal.timeout(15000)
      });
      const data = (await res.json()) as any;
      if (data?.status === 'success' && data?.token) return String(data.token);
      dbInstance.log('warning', 'payment', `PayStation grant-token failed: ${data?.message || `HTTP ${res.status}`}`);
      return null;
    } catch (err: any) {
      dbInstance.log('error', 'payment', `PayStation grant-token error: ${err.message}`);
      return null;
    }
  }

  /** Create a hosted-checkout invoice; returns the payment_url to redirect to. */
  public static async createInvoice(params: {
    invoiceNumber: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    amountBdt: number;
    reference: string;
    callbackUrl: string;
  }): Promise<PayStationCreateResult> {
    const { baseUrl } = this.getConfig();
    const token = await this.getToken();
    if (!token) return { ok: false, message: 'PayStation authentication failed. Check Store ID / password.' };

    const body = new URLSearchParams({
      invoice_number: params.invoiceNumber,
      currency: 'BDT',
      payment_amount: String(params.amountBdt),
      reference: params.reference,
      cust_name: params.name,
      cust_phone: params.phone,
      cust_email: params.email,
      cust_address: params.address,
      callback_url: params.callbackUrl
    });

    try {
      const res = await fetch(`${baseUrl}/create-payment`, {
        method: 'POST',
        headers: { token, 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(20000)
      });
      const data = (await res.json()) as any;
      if (String(data?.status_code) === '200' && data?.status === 'success' && data?.payment_url) {
        return { ok: true, paymentUrl: String(data.payment_url), invoiceNumber: params.invoiceNumber };
      }
      dbInstance.log('warning', 'payment', `PayStation create-payment failed: ${data?.message || `HTTP ${res.status}`}`);
      return { ok: false, message: data?.message || 'PayStation could not create the payment.' };
    } catch (err: any) {
      dbInstance.log('error', 'payment', `PayStation create-payment error: ${err.message}`);
      return { ok: false, message: err.message };
    }
  }

  /** Authoritative status check for an invoice via /retrive-transaction. */
  public static async verifyInvoice(invoiceNumber: string, trxId?: string): Promise<PayStationVerifyResult> {
    const { baseUrl } = this.getConfig();
    const token = await this.getToken();
    if (!token) return { ok: false, completed: false, message: 'PayStation authentication failed.' };

    const body = new URLSearchParams({ invoice_number: invoiceNumber, trx_id: trxId || '' });
    try {
      const res = await fetch(`${baseUrl}/retrive-transaction`, {
        method: 'POST',
        headers: { token, 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(20000)
      });
      const data = (await res.json()) as any;
      if (data?.status !== 'success' || !data?.data) {
        return { ok: false, completed: false, message: data?.message || 'Transaction not found.' };
      }
      const d = data.data;
      const trxStatus = String(d.trx_status || '').toLowerCase();
      // Paid transactions report a success-type trx_status and/or a success timestamp.
      const completed =
        ['success', 'completed', 'paid', 'successful'].includes(trxStatus) ||
        (!!d.success_date_time && String(d.success_date_time).trim() !== '');
      return { ok: true, completed, trxStatus, trxId: d.trx_id || trxId, message: data.message };
    } catch (err: any) {
      dbInstance.log('error', 'payment', `PayStation verify error: ${err.message}`);
      return { ok: false, completed: false, message: err.message };
    }
  }
}
