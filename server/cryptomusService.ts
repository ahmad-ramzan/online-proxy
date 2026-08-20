/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'node:crypto';
import { dbInstance } from './db';

/**
 * =========================================================================
 * CRYPTOMUS — crypto hosted-checkout integration
 * https://doc.cryptomus.com
 * =========================================================================
 *
 * Flow (all live-verified):
 *   1. POST {base}/v1/payment       -> { result.url } (hosted pay page)
 *   2. POST {base}/v1/payment/info  -> { result.payment_status }
 *
 * Auth: headers `merchant: <UUID>` and
 *   `sign = md5( base64(json_body) + api_key )`.
 *
 * Amounts are charged in USD (Cryptomus converts to the crypto the customer
 * picks), so no BDT conversion is needed. Credentials live in the DB
 * (Admin -> Payment Settings), never hardcoded.
 */

export interface CryptomusCreateResult {
  ok: boolean;
  url?: string;
  uuid?: string;
  message?: string;
}

export interface CryptomusVerifyResult {
  ok: boolean;
  completed: boolean;
  status?: string;
  message?: string;
}

// Cryptomus payment_status values that mean the money has arrived.
const PAID_STATUSES = ['paid', 'paid_over'];
const FAILED_STATUSES = ['fail', 'cancel', 'system_fail', 'wrong_amount', 'refund_process', 'refund_paid'];

export class CryptomusService {
  private static getConfig() {
    const s = dbInstance.getPaymentSettings();
    const baseUrl = (s.cryptomusBaseUrl || 'https://api.cryptomus.com').replace(/\/+$/, '');
    const merchantId = (s.cryptomusMerchantId || '').trim();
    const apiKey = (s.cryptomusApiKey || '').trim();
    return { baseUrl, merchantId, apiKey };
  }

  public static isConfigured(): boolean {
    const { merchantId, apiKey } = this.getConfig();
    return !!(merchantId && apiKey);
  }

  /** Cryptomus request signature: md5( base64(json) + api_key ). */
  private static sign(payload: string, apiKey: string): string {
    const b64 = Buffer.from(payload).toString('base64');
    return crypto.createHash('md5').update(b64 + apiKey).digest('hex');
  }

  private static async post(path: string, body: Record<string, unknown>): Promise<any | null> {
    const { baseUrl, merchantId, apiKey } = this.getConfig();
    if (!merchantId || !apiKey) return null;
    const payload = JSON.stringify(body);
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: {
          merchant: merchantId,
          sign: this.sign(payload, apiKey),
          'Content-Type': 'application/json'
        },
        body: payload,
        signal: AbortSignal.timeout(20000)
      });
      return (await res.json()) as any;
    } catch (err: any) {
      dbInstance.log('error', 'payment', `Cryptomus ${path} error: ${err.message}`);
      return null;
    }
  }

  /** Create a hosted crypto invoice; returns the pay-page URL to redirect to. */
  public static async createInvoice(params: {
    orderId: string;
    amountUsd: number;
    callbackUrl: string;
    returnUrl: string;
    successUrl: string;
  }): Promise<CryptomusCreateResult> {
    const data = await this.post('/v1/payment', {
      amount: params.amountUsd.toFixed(2),
      currency: 'USD',
      order_id: params.orderId,
      url_callback: params.callbackUrl,
      url_return: params.returnUrl,
      url_success: params.successUrl
    });
    if (data?.state === 0 && data?.result?.url) {
      return { ok: true, url: String(data.result.url), uuid: data.result.uuid };
    }
    dbInstance.log('warning', 'payment', `Cryptomus create failed: ${data?.message || JSON.stringify(data?.errors || data).slice(0, 150)}`);
    return { ok: false, message: data?.message || 'Cryptomus could not create the payment.' };
  }

  /** Authoritative status check for an order via /v1/payment/info. */
  public static async verifyInvoice(orderId: string): Promise<CryptomusVerifyResult> {
    const data = await this.post('/v1/payment/info', { order_id: orderId });
    if (data?.state !== 0 || !data?.result) {
      return { ok: false, completed: false, message: data?.message || 'Payment not found.' };
    }
    const status = String(data.result.payment_status || '').toLowerCase();
    return { ok: true, completed: PAID_STATUSES.includes(status), status };
  }

  /** Is a payment_status a terminal failure (vs. still pending)? */
  public static isFailedStatus(status?: string): boolean {
    return FAILED_STATUSES.includes(String(status || '').toLowerCase());
  }
}
