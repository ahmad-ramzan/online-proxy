/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { dbInstance } from './db';

/**
 * =========================================================================
 * ZINIPAY PAYMENT GATEWAY (Bangladesh) — https://zinipay.com/docs
 * =========================================================================
 * Hosted checkout: create an invoice, redirect the buyer to `payment_url`
 * where they pay via Bangla QR / bKash / Nagad / card, then confirm via the
 * webhook + verify endpoint.
 *
 *   POST {base}/v1/payment/create   (header: zini-api-key)
 *   POST {base}/v1/payment/verify   (header: zini-api-key)
 */

export interface ZiniCreateResult {
  ok: boolean;
  paymentUrl?: string;
  invoiceId?: string;
  message?: string;
}

export interface ZiniVerifyResult {
  ok: boolean;
  completed: boolean;
  status?: string;
  transactionId?: string;
  paymentMethod?: string;
  amount?: number;
  message?: string;
}

export class ZiniPayService {
  private static getConfig() {
    const s = dbInstance.getPaymentSettings();
    const baseUrl = (s.zinipayBaseUrl || 'https://api.zinipay.com').replace(/\/+$/, '');
    const apiKey = (s.zinipayApiKey || '').trim();
    const usdToBdt = s.zinipayUsdToBdt && s.zinipayUsdToBdt > 0 ? s.zinipayUsdToBdt : 120;
    return { baseUrl, apiKey, usdToBdt };
  }

  public static isConfigured(): boolean {
    return !!this.getConfig().apiKey;
  }

  /** Convert a USD amount to the BDT integer amount ZiniPay expects. */
  public static usdToBdt(amountUsd: number): number {
    const { usdToBdt } = this.getConfig();
    return Math.max(1, Math.round(amountUsd * usdToBdt));
  }

  /** POST /v1/payment/create — returns the hosted payment URL + invoice id. */
  public static async createInvoice(params: {
    name: string;
    email: string;
    amountBdt: number;
    redirectUrl: string;
    cancelUrl: string;
    webhookUrl: string;
    metadata?: Record<string, unknown>;
  }): Promise<ZiniCreateResult> {
    const { baseUrl, apiKey } = this.getConfig();
    if (!apiKey) return { ok: false, message: 'ZiniPay API key not configured.' };

    try {
      const res = await fetch(`${baseUrl}/v1/payment/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'zini-api-key': apiKey },
        body: JSON.stringify({
          cus_name: params.name,
          cus_email: params.email,
          amount: params.amountBdt,
          metadata: params.metadata || {},
          redirect_url: params.redirectUrl,
          cancel_url: params.cancelUrl,
          webhook_url: params.webhookUrl
        })
      });
      const data = (await res.json()) as any;
      if (data?.status === true && data?.payment_url) {
        // Invoice id is the last path segment of the hosted payment URL.
        const invoiceId = String(data.payment_url).split('/').filter(Boolean).pop();
        dbInstance.log('info', 'payment', `ZiniPay invoice created: ${invoiceId} | redirect=${params.redirectUrl} | webhook=${params.webhookUrl}`);
        return { ok: true, paymentUrl: data.payment_url, invoiceId };
      }
      dbInstance.log('warning', 'payment', `ZiniPay create failed: ${data?.message || JSON.stringify(data).slice(0, 150)}`);
      return { ok: false, message: data?.message || 'ZiniPay did not return a payment URL.' };
    } catch (err: any) {
      dbInstance.log('error', 'payment', `ZiniPay create error: ${err.message}`);
      return { ok: false, message: err.message };
    }
  }

  /** POST /v1/payment/verify — authoritative confirmation of a payment. */
  public static async verifyInvoice(invoiceId: string): Promise<ZiniVerifyResult> {
    const { baseUrl, apiKey } = this.getConfig();
    if (!apiKey) return { ok: false, completed: false, message: 'ZiniPay API key not configured.' };

    try {
      const res = await fetch(`${baseUrl}/v1/payment/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'zini-api-key': apiKey },
        body: JSON.stringify({ invoice_id: invoiceId })
      });
      const data = (await res.json()) as any;
      const status = String(data?.status || '').toUpperCase();
      const completed = status === 'COMPLETED' || status === 'SUCCESS' || status === 'PAID';
      return {
        ok: true,
        completed,
        status,
        transactionId: data?.transaction_id,
        paymentMethod: data?.payment_method,
        amount: typeof data?.amount === 'number' ? data.amount : undefined
      };
    } catch (err: any) {
      dbInstance.log('error', 'payment', `ZiniPay verify error: ${err.message}`);
      return { ok: false, completed: false, message: err.message };
    }
  }
}
