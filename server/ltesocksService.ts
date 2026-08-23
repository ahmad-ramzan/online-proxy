/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { dbInstance } from './db';

/**
 * =========================================================================
 * LTESOCKS — mobile (5G/LTE) proxy provider
 * https://api.ltesocks.io/docs/redoc.html   (Swagger 2.0 at /docs/swagger.yml)
 * =========================================================================
 *
 * Base:  https://api.ltesocks.io/v2
 * Auth:  header `Authorization: <token>` (token already includes "Bearer …").
 *
 * A mobile proxy is a "port" ordered from a "plan". Plans expose several
 * `tarifications` (time + traffic + price). We resell at the plan's own price
 * (pass-through), converting the integer price to USD with a divisor (cents by
 * default). The reseller's LTESocks account balance funds the orders.
 */

export interface LteTarification { time: number; traffic: number; price: number }

export interface LtePlan {
  id: string;
  name: string;
  countryCode: string;
  available: boolean;
  availablePorts: number;
  vpnAccess: boolean;
  tarifications: { time: number; trafficMb: number; priceRaw: number; priceUsd: number }[];
}

export interface LteOrderedPort {
  portId: string;
  ip: string;
  port: string;
  username: string;
  password: string;
  status: string;
  resetToken?: string;
  raw: any;
}

export class LTESocksService {
  private static getConfig() {
    const s = dbInstance.getPaymentSettings();
    const baseUrl = (s.ltesocksBaseUrl || 'https://api.ltesocks.io/v2').replace(/\/+$/, '');
    let apiKey = (s.ltesocksApiKey || '').trim();
    // Accept the token with or without a leading "Bearer ".
    if (apiKey && !/^bearer\s/i.test(apiKey)) apiKey = `Bearer ${apiKey}`;
    const divisor = s.ltesocksPriceDivisor && s.ltesocksPriceDivisor > 0 ? s.ltesocksPriceDivisor : 100;
    return { baseUrl, apiKey, divisor };
  }

  public static isConfigured(): boolean {
    return !!this.getConfig().apiKey.replace(/^bearer\s*/i, '').trim();
  }

  private static async req(method: string, path: string, body?: unknown): Promise<any> {
    const { baseUrl, apiKey } = this.getConfig();
    if (!apiKey) throw new Error('LTESocks API key is not configured.');
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { Authorization: apiKey, 'Content-Type': 'application/json', 'Accept-Language': 'en' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20000)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.error) {
      throw new Error(data?.error || `LTESocks ${path} failed (HTTP ${res.status}).`);
    }
    return data;
  }

  /** Reseller account info (includes LTESocks balance). */
  public static async getUser(): Promise<{ login: string; balance: number; portsCount: number; portsLimit: number }> {
    const d = await this.req('GET', '/user');
    return { login: d.login, balance: d.balance, portsCount: d.portsCount, portsLimit: d.portsLimit };
  }

  /** Parse the admin "days:usd" price overrides into a { days: price } map. */
  private static priceOverrides(): Record<number, number> {
    const raw = (dbInstance.getPaymentSettings() as any).ltesocksPrices || '';
    const map: Record<number, number> = {};
    String(raw).split(',').forEach((pair: string) => {
      const [d, p] = pair.split(':').map(s => s.trim());
      const days = parseInt(d, 10), price = parseFloat(p);
      if (Number.isFinite(days) && Number.isFinite(price)) map[days] = price;
    });
    return map;
  }

  /** Available mobile plans, priced in USD (custom overrides, else pass-through). */
  public static async getPlans(): Promise<LtePlan[]> {
    const { divisor } = this.getConfig();
    const overrides = this.priceOverrides();
    const raw = await this.req('GET', '/plans');
    const list: any[] = Array.isArray(raw) ? raw : (raw.data || raw.plans || []);
    return list
      .filter(p => p && p.available !== false)
      .map(p => ({
        id: p.id,
        name: p.name,
        countryCode: p.countryCode || '',
        available: p.available !== false,
        availablePorts: p.availablePorts || 0,
        vpnAccess: !!p.vpnAccess,
        tarifications: (p.tarifications || []).map((t: LteTarification) => {
          const days = Math.round(t.time / 86400);
          const override = overrides[days];
          return {
            time: t.time,
            trafficMb: t.traffic,
            priceRaw: t.price,
            priceUsd: override !== undefined ? override : Math.round((t.price / divisor) * 100) / 100
          };
        })
      }));
  }

  /** Map a raw LTESocks port into normalized connection details. */
  private static mapPort(p: any): LteOrderedPort {
    const creds = p.credentials || {};
    const ipEntry = Array.isArray(creds.ip) ? creds.ip[0] : (creds.ip || p.ip);
    const password = Array.isArray(creds.password) ? creds.password[0] : (creds.password || '');
    // ipEntry may be "host:port" or just an ip; fall back to the port's own fields.
    let host = p.ip, portNum = p.port;
    if (typeof ipEntry === 'string' && ipEntry.includes(':')) {
      const [h, pt] = ipEntry.split(':');
      host = h || host; portNum = pt || portNum;
    } else if (ipEntry && typeof ipEntry === 'object') {
      host = ipEntry.ip || ipEntry.host || host;
      portNum = ipEntry.port || portNum;
    }
    return {
      portId: String(p.id || p.portId || p.port || ''),
      ip: String(host || ''),
      port: String(portNum || ''),
      username: String((creds.login || p.login || '') || ''),
      password: String(password || ''),
      status: String(p.status || 'active'),
      resetToken: p.resetToken,
      raw: p
    };
  }

  /** Order a new port from a plan + tarification. Costs the LTESocks balance. */
  public static async orderPort(planId: string, tarification: LteTarification): Promise<LteOrderedPort> {
    const d = await this.req('POST', '/ports/order', { plan: planId, tarification });
    const port = d?.data || d?.port || d;
    return this.mapPort(port);
  }

  public static async getPort(portId: string): Promise<LteOrderedPort> {
    const d = await this.req('GET', `/ports/${portId}`);
    return this.mapPort(d?.data || d);
  }

  /** Rotate the mobile IP for a port. */
  public static async resetPort(portId: string): Promise<boolean> {
    await this.req('POST', `/ports/${portId}/reset`, {});
    return true;
  }

  public static async deletePort(portId: string): Promise<boolean> {
    try {
      await this.req('POST', `/ports/${portId}/delete`, {});
    } catch {
      await this.req('DELETE', `/ports/${portId}`);
    }
    return true;
  }
}
