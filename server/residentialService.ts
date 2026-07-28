/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { unzipSync, strFromU8 } from 'fflate';
import { ResidentialInfo, ResidentialGeoCountry, ResidentialProxyOptions } from '../src/types';
import { dbInstance } from './db';

/** Normalised result of creating a residential list (real or simulated). */
export interface ResidentialListResult {
  id: string; // Proxy-Seller list id
  login: string;
  password: string;
  host: string; // residential gateway host
  port: number; // gateway port (10000)
  country: string; // ISO-2 code
  region: string;
  city: string;
  isp: string;
  ports: number;
  live: boolean;
}

/**
 * =========================================================================
 * PROXY-SELLER RESIDENTIAL PROXY API INTEGRATION
 * https://docs.proxy-seller.com/api-v1/residential-proxy
 * =========================================================================
 *
 * The landing-page pricing cards render live residential-package data pulled
 * straight from Proxy-Seller. Two endpoints back the cards:
 *
 *   GET  {base}/{apiKey}/resident/package       -> rotation, traffic limits, expiry, status
 *   POST {base}/{apiKey}/resident/consumption   -> price_per_gb, orders/used bytes
 *
 * Auth is the personal API key embedded in the URL path. When no key is
 * configured (or the upstream errors) we fall back to a high-fidelity local
 * simulation so the site keeps working out of the box. Configure a real key in
 * Admin -> API Settings (or data/db.json -> apiSettings.residentialApiKey).
 */

interface ProxySellerEnvelope<T> {
  status: 'success' | 'error';
  data: T | null;
  errors: { message: string; code: number; customData: unknown }[];
}

interface ResidentPackage {
  rotation: number;
  traffic_limit: string;
  expired_at: string;
  is_link_date: boolean;
  is_active: boolean;
  package_key: string;
  traffic_usage: string;
  traffic_left: string;
  tarif_id: number;
  auto_renew: boolean;
}

interface ResidentConsumption {
  package_key: string;
  orders_amount: string;
  orders_bytes: string;
  orders_bytes_formated: string;
  price_per_gb: string;
  used_bytes: string;
  used_bytes_formated: string;
  used_orders_amount: string;
  lists: unknown[];
}

export class ResidentialService {
  private static getConfig() {
    const settings = dbInstance.getApiSettings();
    const baseUrl = (settings.residentialApiUrl || 'https://proxy-seller.com/personal/api/v1').replace(/\/+$/, '');
    const apiKey = (settings.residentialApiKey || '').trim();
    return { baseUrl, apiKey };
  }

  /** Parse strings like "$2.20" or "2.20" into a number. */
  private static parseMoney(value?: string | null): number | null {
    if (!value) return null;
    const num = parseFloat(String(value).replace(/[^0-9.]/g, ''));
    return Number.isFinite(num) ? num : null;
  }

  private static parseBytes(value?: string | null): number | null {
    if (value === undefined || value === null || value === '') return null;
    const num = parseInt(String(value), 10);
    return Number.isFinite(num) ? num : null;
  }

  // Cache the package/consumption snapshot to stay well under Proxy-Seller's
  // 60 requests/minute limit — the public landing page can be hit frequently.
  private static infoCache: { at: number; data: ResidentialInfo } | null = null;
  private static readonly INFO_TTL_MS = 5 * 60 * 1000;      // live data: 5 min
  private static readonly FALLBACK_TTL_MS = 15 * 60 * 1000; // after an error: retry after 15 min
  // ^ Long fallback avoids hammering Proxy-Seller during an outage or a rate-limit
  //   block (exceeding 60/min triggers a multi-hour restriction).

  /**
   * Fetches and normalises the residential package + consumption snapshot (cached).
   * Always resolves (never throws) so the public landing page stays resilient.
   */
  public static async getInfo(): Promise<ResidentialInfo> {
    if (this.infoCache) {
      const ttl = this.infoCache.data.live ? this.INFO_TTL_MS : this.FALLBACK_TTL_MS;
      if (Date.now() - this.infoCache.at < ttl) return this.infoCache.data;
    }
    const data = await this.computeInfo();
    this.infoCache = { at: Date.now(), data };
    return data;
  }

  private static async computeInfo(): Promise<ResidentialInfo> {
    const { baseUrl, apiKey } = this.getConfig();

    // No key configured -> steady-state local simulation. Intentionally silent:
    // this runs on every landing-page load, so logging here would spam the audit trail.
    if (!apiKey) {
      return this.simulatedInfo();
    }

    try {
      const [pkgRes, consRes] = await Promise.all([
        fetch(`${baseUrl}/${apiKey}/resident/package`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }),
        fetch(`${baseUrl}/${apiKey}/resident/consumption`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        })
      ]);

      const pkgBody = (await pkgRes.json()) as ProxySellerEnvelope<ResidentPackage>;
      const consBody = (await consRes.json()) as ProxySellerEnvelope<ResidentConsumption>;

      if (pkgBody.status !== 'success' || !pkgBody.data) {
        const msg = pkgBody.errors?.[0]?.message || `HTTP ${pkgRes.status}`;
        throw new Error(`/resident/package error: ${msg}`);
      }

      const pkg = pkgBody.data;
      const cons = consBody.status === 'success' ? consBody.data : null;

      dbInstance.log(
        'info',
        'proxy',
        `Live residential data loaded. Package: ${pkg.package_key}, price/GB: ${cons?.price_per_gb ?? 'n/a'}`
      );

      return {
        live: true,
        pricePerGb: this.parseMoney(cons?.price_per_gb),
        rotationSeconds: Number.isFinite(pkg.rotation) ? pkg.rotation : null,
        trafficLimitBytes: this.parseBytes(pkg.traffic_limit),
        trafficLeftBytes: this.parseBytes(pkg.traffic_left),
        trafficUsageBytes: this.parseBytes(pkg.traffic_usage),
        ordersBytesFormatted: cons?.orders_bytes_formated ?? null,
        usedBytesFormatted: cons?.used_bytes_formated ?? null,
        expiresAt: pkg.expired_at ?? null,
        isActive: typeof pkg.is_active === 'boolean' ? pkg.is_active : null,
        autoRenew: typeof pkg.auto_renew === 'boolean' ? pkg.auto_renew : null,
        packageKey: pkg.package_key ?? null
      };
    } catch (err: any) {
      dbInstance.log(
        'warning',
        'proxy',
        `Residential API call failed, using local simulation: ${err.message}`
      );
      return this.simulatedInfo();
    }
  }

  /**
   * How much residential bandwidth (GB) is still sellable right now.
   *
   * This is the Proxy-Seller main package's live `traffic_left` — the single
   * source of truth for remaining stock. When a customer order completes we
   * reserve a sub-user package, and Proxy-Seller deducts that reservation from
   * the main balance, so `traffic_left` already reflects everything sold. We do
   * NOT subtract our local order records on top of it (that would double-count).
   *
   * When the upstream snapshot is not live (no API key / API down) we return
   * `live: false` so the caller can fail open rather than blocking every sale
   * during a transient outage.
   */
  public static async getAvailableStockGb(): Promise<{ live: boolean; availableGb: number; trafficLeftGb: number }> {
    const info = await this.getInfo();
    if (!info.live || info.trafficLeftBytes == null) {
      return { live: false, availableGb: Infinity, trafficLeftGb: Infinity };
    }
    const trafficLeftGb = info.trafficLeftBytes / 1e9; // decimal GB (1 GB = 1000 MB)
    return { live: true, trafficLeftGb, availableGb: Math.max(0, trafficLeftGb) };
  }

  // --- CREATE-PROXY FORM OPTIONS -------------------------------------------

  /**
   * Options for the Create Proxy form, served by the backend so the frontend
   * holds no hardcoded lists. Ports max (1000) is the Proxy-Seller documented
   * limit; the default rotation is derived from the live package when available.
   */
  public static async getProxyOptions(): Promise<ResidentialProxyOptions> {
    let defaultMinutes = 10;
    try {
      const info = await this.getInfo(); // cached
      if (info.rotationSeconds != null && info.rotationSeconds > 0) {
        defaultMinutes = Math.max(0, Math.min(60, Math.round(info.rotationSeconds / 60)));
      }
    } catch { /* keep default */ }

    return {
      protocols: [
        { value: 'socks5', label: 'SOCKS5' },
        { value: 'http', label: 'HTTP' }
      ],
      proxyTypes: [
        { value: 'residential', label: 'Residential (Rotating Pool)' },
        { value: 'isp', label: 'ISP (Static Residential)' }
      ],
      ports: { min: 1, max: 1000, default: 1 },
      rotation: { minMinutes: 0, maxMinutes: 60, stepMinutes: 5, presetMinutes: [0, 10, 30], defaultMinutes }
    };
  }

  // --- GEO -----------------------------------------------------------------

  private static geoCache: { at: number; live: boolean; data: ResidentialGeoCountry[] } | null = null;
  private static readonly GEO_TTL_MS = 60 * 60 * 1000;        // live tree: 1 hour
  private static readonly GEO_FALLBACK_TTL_MS = 15 * 60 * 1000; // after an error: retry after 15 min

  /**
   * GET /resident/geo — full country/region/city/ISP tree (cached).
   * Falls back to a compact simulated tree when no key / on error.
   */
  public static async getGeo(): Promise<{ live: boolean; geo: ResidentialGeoCountry[] }> {
    const { baseUrl, apiKey } = this.getConfig();

    if (!apiKey) return { live: false, geo: this.simulatedGeo() };

    // Serve from cache if fresh (avoids hitting the rate limit; payload is large).
    if (this.geoCache) {
      const ttl = this.geoCache.live ? this.GEO_TTL_MS : this.GEO_FALLBACK_TTL_MS;
      if (Date.now() - this.geoCache.at < ttl) {
        return { live: this.geoCache.live, geo: this.geoCache.data };
      }
    }

    try {
      const res = await fetch(`${baseUrl}/${apiKey}/resident/geo`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      // /resident/geo returns a ZIP archive containing geo.json (not raw JSON).
      const raw = new Uint8Array(await res.arrayBuffer());
      let parsed: any;
      if (raw[0] === 0x50 && raw[1] === 0x4b) {
        // 'PK' magic -> ZIP; extract the .json entry and parse it.
        const files = unzipSync(raw);
        const entry = Object.keys(files).find(n => n.toLowerCase().endsWith('.json')) || Object.keys(files)[0];
        parsed = JSON.parse(strFromU8(files[entry]));
      } else {
        // Fallback: some error responses come back as plain JSON.
        parsed = JSON.parse(strFromU8(raw));
      }
      const data: ResidentialGeoCountry[] = Array.isArray(parsed) ? parsed : parsed?.data;
      if (!Array.isArray(data)) {
        throw new Error(parsed?.errors?.[0]?.message || `HTTP ${res.status}`);
      }
      this.geoCache = { at: Date.now(), live: true, data };
      dbInstance.log('info', 'proxy', `Loaded ${data.length} residential GEO countries from Proxy-Seller.`);
      return { live: true, geo: data };
    } catch (err: any) {
      dbInstance.log('warning', 'proxy', `Residential GEO fetch failed, using simulation: ${err.message}`);
      const geo = this.simulatedGeo();
      this.geoCache = { at: Date.now(), live: false, data: geo };
      return { live: false, geo };
    }
  }

  // --- LIST CREATE / DELETE ------------------------------------------------

  // Residential gateway host used in customer connection strings. (Geo is
  // determined by the list login, not the host, so a single gateway serves all.)
  private static readonly GATEWAY_HOST = '185.162.130.85';

  private static hostForCountry(_countryCode: string): string {
    return this.GATEWAY_HOST;
  }

  /**
   * POST /resident/list/add — provision a geo-locked residential list.
   * Returns connectable credentials. Falls back to a local simulation without a key.
   *
   * `rotation`: -1 sticky, 0 per-request, 1..3600 seconds.
   */
  public static async createList(params: {
    title: string;
    country: string; // ISO-2 code
    region?: string;
    city?: string;
    isp?: string;
    ports: number;
    rotation: number;
    packageKey?: string; // when set, the list is created under this sub-user package
  }): Promise<ResidentialListResult> {
    const { baseUrl, apiKey } = this.getConfig();
    const host = this.hostForCountry(params.country);
    const port = 10000;
    const ports = Math.max(1, Math.min(1000, Math.floor(params.ports || 1)));
    // Real sub-user package keys are non-empty and not our simulated ones.
    const useSubUser = !!params.packageKey && !params.packageKey.startsWith('sim_');
    const endpoint = useSubUser ? 'residentsubuser/list/add' : 'resident/list/add';

    if (apiKey) {
      try {
        const reqBody: any = {
          title: params.title,
          whitelist: '',
          geo: {
            country: params.country,
            region: params.region || '',
            city: params.city || '',
            isp: params.isp || ''
          },
          export: { ports, ext: 'txt' },
          rotation: params.rotation
        };
        if (useSubUser) reqBody.package_key = params.packageKey;

        const res = await fetch(`${baseUrl}/${apiKey}/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reqBody)
        });
        const body = (await res.json()) as any;
        if (body.status !== 'success' || !body.data) {
          throw new Error(body?.errors?.[0]?.message || `HTTP ${res.status}`);
        }
        const d = body.data;
        dbInstance.log('info', 'proxy', `Residential list created on Proxy-Seller. id=${d.id}, login=${d.login}`);
        return {
          id: String(d.id),
          login: d.login,
          password: d.password,
          host,
          port,
          country: d.geo?.country || params.country,
          region: d.geo?.region || params.region || '',
          city: d.geo?.city || params.city || '',
          isp: d.geo?.isp || params.isp || '',
          ports: d.export?.ports ?? ports,
          live: true
        };
      } catch (err: any) {
        // A key IS configured, so this deployment sells real proxies. Never fall
        // through to the simulated branch here: that would hand the customer
        // random credentials for a proxy that was never created upstream (and
        // which the UI would happily show as "online"). Fail loudly instead.
        dbInstance.log('error', 'proxy', `Residential list/add failed: ${err.message}`);
        throw new Error(
          `Proxy could not be created right now (${err.message}). Please try again in a few minutes — no bandwidth has been used.`
        );
      }
    }

    // Simulated fallback
    await new Promise((r) => setTimeout(r, 400));
    const login = Math.random().toString(16).slice(2, 10);
    const password = Math.random().toString(36).slice(2, 10).toUpperCase();
    return {
      id: `sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      login,
      password,
      host,
      port,
      country: params.country,
      region: params.region || '',
      city: params.city || '',
      isp: params.isp || '',
      ports,
      live: false
    };
  }

  /** DELETE a residential list by id (main account or a sub-user). No-op for simulated ids. */
  public static async deleteList(listId: string, packageKey?: string): Promise<boolean> {
    const { baseUrl, apiKey } = this.getConfig();
    const isRealId = /^\d+$/.test(listId);
    const useSubUser = !!packageKey && !packageKey.startsWith('sim_');
    const path = useSubUser ? 'residentsubuser/list/delete' : 'resident/list/delete';

    if (apiKey && isRealId) {
      try {
        const reqBody: any = { id: Number(listId) };
        if (useSubUser) reqBody.package_key = packageKey;
        const res = await fetch(`${baseUrl}/${apiKey}/${path}?id=${Number(listId)}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reqBody)
        });
        const body = (await res.json()) as any;
        if (body.status === 'success') {
          dbInstance.log('info', 'proxy', `Residential list ${listId} deleted from Proxy-Seller.`);
          return true;
        }
        dbInstance.log('warning', 'proxy', `Residential list delete returned: ${JSON.stringify(body.errors || body)}`);
      } catch (err: any) {
        dbInstance.log('warning', 'proxy', `Residential list delete failed: ${err.message}`);
      }
    }
    return true; // simulated ids (or no key) — nothing to revoke upstream
  }

  // --- SUB-USERS (per-customer reserved traffic allocation) -----------------

  /**
   * POST /residentsubuser/create — reserve `trafficBytes` from the reseller pool
   * for a customer. Returns the sub-user package key. Simulated without a key.
   */
  public static async createSubUserPackage(params: {
    trafficBytes: number;
    rotation?: number;    // default -1 (sticky)
    isLinkDate?: boolean; // link expiry to the main package (default true)
  }): Promise<{ packageKey: string; live: boolean }> {
    const { baseUrl, apiKey } = this.getConfig();
    const rotation = params.rotation ?? -1;
    const isLinkDate = params.isLinkDate ?? true;
    const trafficLimit = String(Math.max(1, Math.floor(params.trafficBytes)));

    if (apiKey) {
      try {
        const res = await fetch(`${baseUrl}/${apiKey}/residentsubuser/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_link_date: isLinkDate, rotation, traffic_limit: trafficLimit })
        });
        const body = (await res.json()) as any;
        if (body.status === 'success' && body.data?.package_key) {
          dbInstance.log('info', 'proxy', `Sub-user package created: ${body.data.package_key} (limit ${trafficLimit} bytes)`);
          return { packageKey: body.data.package_key, live: true };
        }
        throw new Error(body?.errors?.[0]?.message || `HTTP ${res.status}`);
      } catch (err: any) {
        // As with createList: with a real key configured, never mint a fake
        // `sim_pkg_` key — the order would look reserved while nothing exists
        // upstream. The caller (completePaymentTransaction) already catches this
        // and leaves the paid order active with no key, so it can be retried.
        dbInstance.log('error', 'proxy', `Sub-user package create failed: ${err.message}`);
        throw new Error(`Could not reserve traffic on Proxy-Seller: ${err.message}`);
      }
    }
    return { packageKey: `sim_pkg_${Date.now()}_${Math.floor(Math.random() * 1000)}`, live: false };
  }

  /** DELETE /residentsubuser/delete — release a customer's reserved allocation. */
  public static async deleteSubUserPackage(packageKey: string): Promise<boolean> {
    const { baseUrl, apiKey } = this.getConfig();
    if (!packageKey || packageKey.startsWith('sim_')) return true;
    if (apiKey) {
      try {
        const res = await fetch(`${baseUrl}/${apiKey}/residentsubuser/delete`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ package_key: packageKey })
        });
        const body = (await res.json()) as any;
        if (body.status === 'success') {
          dbInstance.log('info', 'proxy', `Sub-user package ${packageKey} deleted.`);
          return true;
        }
        dbInstance.log('warning', 'proxy', `Sub-user package delete returned: ${JSON.stringify(body.errors || body)}`);
      } catch (err: any) {
        dbInstance.log('warning', 'proxy', `Sub-user package delete failed: ${err.message}`);
      }
    }
    return true;
  }

  // Real per-sub-user traffic usage from Proxy-Seller (cached ~60s to respect the rate limit).
  private static usageCache: { at: number; data: Record<string, { usedBytes: number; limitBytes: number }> } | null = null;

  public static async getSubUserUsage(): Promise<{ live: boolean; usage: Record<string, { usedBytes: number; limitBytes: number }> }> {
    const { baseUrl, apiKey } = this.getConfig();
    if (!apiKey) return { live: false, usage: {} };
    if (this.usageCache && Date.now() - this.usageCache.at < 60 * 1000) {
      return { live: true, usage: this.usageCache.data };
    }
    try {
      const res = await fetch(`${baseUrl}/${apiKey}/residentsubuser/packages`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000)
      });
      const body = (await res.json()) as any;
      const data = Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : null);
      if (!data) throw new Error(body?.errors?.[0]?.message || `HTTP ${res.status}`);
      const usage: Record<string, { usedBytes: number; limitBytes: number }> = {};
      for (const p of data) {
        if (!p?.package_key) continue;
        usage[p.package_key] = {
          usedBytes: parseInt(p.traffic_usage, 10) || 0,
          limitBytes: parseInt(p.traffic_limit, 10) || 0
        };
      }
      this.usageCache = { at: Date.now(), data: usage };
      return { live: true, usage };
    } catch (err: any) {
      dbInstance.log('warning', 'proxy', `Sub-user usage fetch failed: ${err.message}`);
      return { live: false, usage: {} };
    }
  }

  /** Compact simulated GEO tree (mirrors the real shape) for when no key is set. */
  private static simulatedGeo(): ResidentialGeoCountry[] {
    return [
      {
        code: 'US', name: 'United States',
        regions: [
          { name: 'California', cities: [
            { name: 'Los Angeles', isps: ['Comcast Cable', 'AT&T Internet'] },
            { name: 'San Francisco', isps: ['Verizon Fios'] }
          ] },
          { name: 'New York', cities: [
            { name: 'New York', isps: ['Charter Spectrum', 'Verizon Fios'] }
          ] }
        ]
      },
      {
        code: 'GB', name: 'United Kingdom',
        regions: [
          { name: 'England', cities: [
            { name: 'London', isps: ['BT Broadband', 'Sky Broadband'] },
            { name: 'Manchester', isps: ['Virgin Media'] }
          ] }
        ]
      },
      {
        code: 'CA', name: 'Canada',
        regions: [
          { name: 'Alberta', cities: [
            { name: 'Calgary', isps: ['Telus', 'Shaw Communications'] },
            { name: 'Edmonton', isps: ['Telus', 'Shaw Communications'] }
          ] },
          { name: 'British Columbia', cities: [
            { name: 'Vancouver', isps: ['Telus', 'Shaw Communications'] },
            { name: 'Victoria', isps: ['Telus'] }
          ] },
          { name: 'Manitoba', cities: [
            { name: 'Winnipeg', isps: ['Bell MTS', 'Shaw Communications'] }
          ] },
          { name: 'New Brunswick', cities: [
            { name: 'Fredericton', isps: ['Bell Aliant'] },
            { name: 'Moncton', isps: ['Bell Aliant', 'Rogers Communications'] }
          ] },
          { name: 'Newfoundland and Labrador', cities: [
            { name: "St. John's", isps: ['Bell Aliant'] }
          ] },
          { name: 'Northwest Territories', cities: [
            { name: 'Yellowknife', isps: ['Northwestel'] }
          ] },
          { name: 'Nova Scotia', cities: [
            { name: 'Halifax', isps: ['Bell Aliant', 'Eastlink'] }
          ] },
          { name: 'Nunavut', cities: [
            { name: 'Iqaluit', isps: ['Northwestel'] }
          ] },
          { name: 'Ontario', cities: [
            { name: 'Toronto', isps: ['Rogers Communications', 'Bell Canada'] },
            { name: 'Ottawa', isps: ['Rogers Communications', 'Bell Canada'] }
          ] },
          { name: 'Prince Edward Island', cities: [
            { name: 'Charlottetown', isps: ['Bell Aliant'] }
          ] },
          { name: 'Quebec', cities: [
            { name: 'Montreal', isps: ['Bell Canada', 'Videotron'] },
            { name: 'Quebec City', isps: ['Videotron', 'Bell Canada'] },
            { name: 'Acton Vale', isps: ['Bell Canada'] }
          ] },
          { name: 'Saskatchewan', cities: [
            { name: 'Regina', isps: ['SaskTel'] },
            { name: 'Saskatoon', isps: ['SaskTel', 'Shaw Communications'] }
          ] },
          { name: 'XX', cities: [
            { name: 'unknown', isps: ['Bell Canada'] }
          ] },
          { name: 'Yukon', cities: [
            { name: 'Whitehorse', isps: ['Northwestel'] }
          ] }
        ]
      }
    ];
  }

  /**
   * High-fidelity fallback mirroring the shapes from the Proxy-Seller docs so the
   * pricing cards render believable numbers without a live key.
   */
  private static simulatedInfo(): ResidentialInfo {
    const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const dd = String(expiry.getDate()).padStart(2, '0');
    const mm = String(expiry.getMonth() + 1).padStart(2, '0');
    const yyyy = expiry.getFullYear();

    return {
      live: false,
      pricePerGb: 2.2,
      rotationSeconds: 60,
      trafficLimitBytes: 7516192768, // 7 GB
      trafficLeftBytes: 5368709120, // 5 GB
      trafficUsageBytes: 2147483648, // 2 GB
      ordersBytesFormatted: '7.0 GB',
      usedBytesFormatted: '2.0 GB',
      expiresAt: `${dd}.${mm}.${yyyy}`,
      isActive: true,
      autoRenew: false,
      packageKey: 'sim-residential-pool'
    };
  }
}
