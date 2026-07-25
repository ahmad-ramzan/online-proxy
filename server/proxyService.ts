/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CreatedProxy } from '../src/types';
import { dbInstance } from './db';
import { ResidentialService } from './residentialService';

/**
 * =========================================================================
 * PROXY PROVISIONING LAYER — backed by Proxy-Seller Residential API
 * https://docs.proxy-seller.com/api-v1/residential-proxy
 * =========================================================================
 *
 * Provisioning creates a geo-locked residential list via POST /resident/list/add
 * and stores the connectable credentials. Revocation deletes it via
 * DELETE /resident/list/delete. When no residential API key is configured, a
 * high-fidelity local simulation is used so the app works out of the box.
 */

export class ProxyService {
  /**
   * Provisions a residential proxy list on Proxy-Seller (or simulates one).
   */
  public static async provisionUpstreamProxy(params: {
    userId: string;
    orderId: string;
    country: string;      // ISO-2 code, e.g. "US"
    countryName?: string; // display name, e.g. "United States"
    region?: string;
    city?: string;
    isp?: string;
    ports?: number;
    type: 'residential' | 'datacenter' | 'mobile' | 'isp';
    protocol: 'http' | 'socks5';
    rotationMinutes: number;
    subUserPackageKey?: string; // provision the list under this customer's sub-user package
  }): Promise<CreatedProxy> {
    const countryCode = (params.country || 'US').toUpperCase();
    const displayCountry = params.countryName || countryCode;

    // Map the UI rotation (minutes, 0 = sticky) to Proxy-Seller seconds
    // (-1 sticky, 0 per-request, 1..3600 seconds).
    const rotationSeconds = params.rotationMinutes <= 0
      ? -1
      : Math.min(params.rotationMinutes * 60, 3600);

    dbInstance.log(
      'info',
      'proxy',
      `Provisioning residential proxy — ${displayCountry}${params.region ? '/' + params.region : ''}${params.city ? '/' + params.city : ''}${params.isp ? ' via ' + params.isp : ''}, ports=${params.ports || 1}, rotation=${rotationSeconds}s`
    );

    const title = `ProxyGPT ${displayCountry}${params.city ? ' ' + params.city : ''} #${Date.now().toString().slice(-5)}`;

    const result = await ResidentialService.createList({
      title,
      country: countryCode,
      region: params.region,
      city: params.city,
      isp: params.isp,
      ports: params.ports || 1,
      rotation: rotationSeconds,
      packageKey: params.subUserPackageKey
    });

    const newProxy: CreatedProxy = {
      id: result.id,
      orderId: params.orderId,
      userId: params.userId,
      ip: result.host,
      port: result.port,
      username: result.login,
      passwordHash: result.password,
      country: displayCountry,
      countryCode,
      type: params.type,
      protocol: params.protocol,
      status: 'online',
      rotationMinutes: params.rotationMinutes,
      createdAt: new Date().toISOString(),
      region: result.region || undefined,
      city: result.city || undefined,
      isp: result.isp || undefined,
      ports: result.ports,
      listId: result.id,
      subUserPackageKey: params.subUserPackageKey
    };

    dbInstance.insertProxy(newProxy);

    dbInstance.log(
      'info',
      'proxy',
      `Proxy allocation completed (${result.live ? 'LIVE Proxy-Seller' : 'local simulation'})! ${result.host}:${result.port} login=${result.login}`
    );

    return newProxy;
  }

  /**
   * Revokes a proxy — deletes the residential list upstream, then removes it locally.
   */
  public static async revokeProxy(proxyId: string): Promise<boolean> {
    const proxies = dbInstance.getProxies();
    const target = proxies.find(p => p.id === proxyId);

    if (!target) return false;

    dbInstance.log('info', 'proxy', `Revoking proxy ${target.ip}:${target.port} (list ${target.listId || target.id})`);

    await ResidentialService.deleteList(target.listId || target.id, target.subUserPackageKey);

    dbInstance.deleteProxy(proxyId);
    dbInstance.log('info', 'proxy', `Proxy ${target.ip}:${target.port} revoked and resources recycled.`);
    return true;
  }
}
