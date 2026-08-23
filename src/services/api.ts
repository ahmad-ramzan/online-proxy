/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, ProxyPackage, ProxyOrder, CreatedProxy, PaymentTransaction, SystemLog, ResidentialInfo, ResidentialGeoCountry, ResidentialProxyOptions, Coupon, NoticePost, SupportTicket } from '../types';

const API_BASE = ''; // Same origin

function getHeaders() {
  const token = localStorage.getItem('proxygpt_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export const api = {
  // Authentication
  auth: {
    async login(email: string, password: string): Promise<{ user: User; token: string }> {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Invalid credentials');
      }
      const data = await res.json();
      localStorage.setItem('proxygpt_token', data.token);
      localStorage.setItem('proxygpt_user', JSON.stringify(data.user));
      return data;
    },

    async register(name: string, email: string, password: string): Promise<{ user: User; token: string }> {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name, email, password })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create account');
      }
      const data = await res.json();
      localStorage.setItem('proxygpt_token', data.token);
      localStorage.setItem('proxygpt_user', JSON.stringify(data.user));
      return data;
    },

    async googleLogin(credential: string): Promise<{ user: User; token: string }> {
      const res = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ credential })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Google authentication failed');
      }
      const data = await res.json();
      localStorage.setItem('proxygpt_token', data.token);
      localStorage.setItem('proxygpt_user', JSON.stringify(data.user));
      return data;
    },

    async getMe(): Promise<User | null> {
      if (!localStorage.getItem('proxygpt_token')) return null;
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: getHeaders()
        });
        if (!res.ok) {
          this.logout();
          return null;
        }
        const data = await res.json();
        return data.user;
      } catch (e) {
        return null;
      }
    },
    async updateProfile(name?: string, profilePicture?: string, password?: string): Promise<User> {
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ name, profilePicture, password })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update profile');
      }
      const data = await res.json();
      return data.user;
    },
    async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to process password recovery');
      }
      return res.json();
    },

    logout() {
      localStorage.removeItem('proxygpt_token');
      localStorage.removeItem('proxygpt_user');
    }
  },

  // Proxy configurations
  proxy: {
    async getMyProxies(): Promise<CreatedProxy[]> {
      const res = await fetch(`${API_BASE}/api/proxy/my-proxies`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to retrieve proxies');
      const data = await res.json();
      return data.proxies;
    },

    async getOrders(): Promise<ProxyOrder[]> {
      const res = await fetch(`${API_BASE}/api/proxy/orders`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to retrieve active proxy orders');
      const data = await res.json();
      return data.orders;
    },

    async getUsage(): Promise<{
      live: boolean; usedGb: number; limitGb: number;
      perOrder: { orderId: string; packageName: string; usedGb: number; limitGb: number }[];
    }> {
      const res = await fetch(`${API_BASE}/api/proxy/usage`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to retrieve usage');
      return res.json();
    },

    async getResidentialGeo(): Promise<{ live: boolean; geo: ResidentialGeoCountry[]; options: ResidentialProxyOptions }> {
      const res = await fetch(`${API_BASE}/api/proxy/residential/geo`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to load residential locations');
      return res.json();
    },

    async createProxy(params: {
      orderId: string;
      country: string;       // ISO-2 code
      countryName?: string;  // display name
      region?: string;
      city?: string;
      isp?: string;
      ports?: number;
      type: 'residential' | 'datacenter' | 'mobile' | 'isp';
      protocol: 'http' | 'socks5';
      rotationMinutes: number;
    }): Promise<CreatedProxy> {
      const res = await fetch(`${API_BASE}/api/proxy/create`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(params)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to provision proxy node');
      }
      const data = await res.json();
      return data.proxy;
    },

    async revokeProxy(proxyId: string): Promise<boolean> {
      const res = await fetch(`${API_BASE}/api/proxy/revoke/${proxyId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed to revoke proxy credentials');
      return true;
    }
  },

  // Pricing & Payment Sessions
  payment: {
    async validateCoupon(code: string, packageId: string): Promise<{
      valid: boolean; couponCode?: string; discountUsd?: number; finalUsd?: number; originalUsd: number; message: string;
    }> {
      const res = await fetch(`${API_BASE}/api/payment/validate-coupon`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ code, packageId })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Coupon validation failed');
      }
      return res.json();
    },

    async createCheckoutSession(params: {
      packageId: string;
      gateway: 'stripe' | 'crypto' | 'paypal' | 'credit_card' | 'paystation' | 'cryptomus';
      amountUsd: number;
      couponCode?: string;
      custPhone?: string;
    }): Promise<{ checkoutUrl: string; transactionId: string; message: string; external?: boolean }> {
      const res = await fetch(`${API_BASE}/api/payment/create-session`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(params)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Payment gateway initialization failed');
      }
      return res.json();
    },

    async simulateComplete(transactionId: string): Promise<{ success: boolean; message: string }> {
      const res = await fetch(`${API_BASE}/api/payment/simulate-complete`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ transactionId })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Verification error');
      }
      return res.json();
    },

    async getTransactions(): Promise<PaymentTransaction[]> {
      const res = await fetch(`${API_BASE}/api/payment/transactions`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch transactions');
      const data = await res.json();
      return data.transactions;
    }
  },

  // Prepaid wallet (USD)
  wallet: {
    async get(): Promise<{ balance: number; due: number; transactions: { id: string; type: 'topup' | 'debit'; amountUsd: number; balanceAfter: number; description: string; createdAt: string }[] }> {
      const res = await fetch(`${API_BASE}/api/wallet`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to load wallet');
      return res.json();
    },
    async topup(amountUsd: number, gateway: 'credit_card' | 'paystation' | 'cryptomus', custPhone?: string): Promise<{ checkoutUrl: string; transactionId: string; external?: boolean }> {
      const res = await fetch(`${API_BASE}/api/wallet/topup`, {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({ amountUsd, gateway, custPhone })
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Top-up failed'); }
      return res.json();
    },
    async pay(packageId: string, couponCode?: string): Promise<{ ok: boolean; orderId: string }> {
      const res = await fetch(`${API_BASE}/api/wallet/pay`, {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({ packageId, couponCode })
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Wallet payment failed'); }
      return res.json();
    }
  },

  // Mobile (LTESocks) proxies
  mobile: {
    async getPlans(): Promise<{ configured: boolean; maxSpeed?: number; stock?: number; plans: { id: string; name: string; countryCode: string; availablePorts: number; vpnAccess: boolean; tarifications: { time: number; trafficMb: number; priceUsd: number }[] }[] }> {
      const res = await fetch(`${API_BASE}/api/mobile/plans`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to load mobile plans');
      return res.json();
    },
    async getMy(): Promise<any[]> {
      const res = await fetch(`${API_BASE}/api/mobile/my`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to load mobile proxies');
      return (await res.json()).proxies;
    },
    async order(planId: string, tarificationIndex: number): Promise<{ proxy: any }> {
      const res = await fetch(`${API_BASE}/api/mobile/order`, {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({ planId, tarificationIndex })
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Mobile order failed'); }
      return res.json();
    },
    async reset(id: string): Promise<{ success: boolean }> {
      const res = await fetch(`${API_BASE}/api/mobile/${id}/reset`, { method: 'POST', headers: getHeaders() });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Rotate failed'); }
      return res.json();
    },
    async remove(id: string): Promise<{ success: boolean }> {
      const res = await fetch(`${API_BASE}/api/mobile/${id}`, { method: 'DELETE', headers: getHeaders() });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Delete failed'); }
      return res.json();
    }
  },

  // Shared site metrics and configuration
  settings: {
    async getPublicConfig(): Promise<{
      website: { siteName: string; siteDescription: string; supportEmail: string; enableGoogleAuth: boolean; maintenanceMode: boolean; googleClientId?: string; tutorialVideoUrl?: string; pinnedCountries?: string };
      countries: { code: string; name: string; flag: string; isEnabled: boolean; totalServers: number }[];
      gateways: string[];
      zinipayEnabled?: boolean;
    }> {
      const res = await fetch(`${API_BASE}/api/settings/public`);
      if (!res.ok) throw new Error('Failed to load global server context');
      return res.json();
    },

    async getPackages(): Promise<ProxyPackage[]> {
      const res = await fetch(`${API_BASE}/api/settings/packages`);
      if (!res.ok) throw new Error('Failed to retrieve available proxy packages');
      const data = await res.json();
      return data.packages;
    },

    async getResidentialInfo(): Promise<ResidentialInfo> {
      const res = await fetch(`${API_BASE}/api/settings/residential`);
      if (!res.ok) throw new Error('Failed to load residential package data');
      return res.json();
    }
  },

  // Admin Control Panel APIs
  admin: {
    async getStats(): Promise<{
      metrics: {
        totalUsers: number;
        activeOrdersCount: number;
        totalProxiesCount: number;
        onlineProxiesCount: number;
        totalRevenue: number;
        totalGbPurchased: number;
        totalGbUsed: number;
      };
    }> {
      const res = await fetch(`${API_BASE}/api/admin/stats`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Unauthorized or session expired');
      return res.json();
    },

    async getUsers(): Promise<User[]> {
      const res = await fetch(`${API_BASE}/api/admin/users`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Unauthorized admin request');
      const data = await res.json();
      return data.users;
    },

    async getOrderHistory(): Promise<{
      id: string; orderId: string; userEmail: string; userName: string;
      packageName: string; bandwidthGb: number; amountUsd: number; discountUsd: number;
      couponCode: string; gateway: string; status: string; createdAt: string;
    }[]> {
      const res = await fetch(`${API_BASE}/api/admin/orders`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to load order history');
      const data = await res.json();
      return data.orders;
    },

    async updateUserStatus(userId: string, updates: { isActive?: boolean; role?: 'user' | 'admin'; password?: string }): Promise<User> {
      const res = await fetch(`${API_BASE}/api/admin/users/status`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ userId, ...updates })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update user parameters');
      }
      const data = await res.json();
      return data.user;
    },

    async setUserDue(userId: string, due: number): Promise<User> {
      const res = await fetch(`${API_BASE}/api/admin/users/due`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ userId, due })
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to set due'); }
      return (await res.json()).user;
    },

    async deleteUser(userId: string): Promise<boolean> {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Could not delete user account');
      }
      return true;
    },

    async getLogs(): Promise<SystemLog[]> {
      const res = await fetch(`${API_BASE}/api/admin/logs`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Unauthorized logger query');
      const data = await res.json();
      return data.logs;
    },

    // Package Administration
    async createPackage(pkg: Omit<ProxyPackage, 'id' | 'isActive'>): Promise<ProxyPackage> {
      const res = await fetch(`${API_BASE}/api/admin/packages`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(pkg)
      });
      if (!res.ok) throw new Error('Could not create package');
      const data = await res.json();
      return data.package;
    },

    async updatePackage(id: string, updates: Partial<ProxyPackage>): Promise<ProxyPackage> {
      const res = await fetch(`${API_BASE}/api/admin/packages/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Could not update package configurations');
      const data = await res.json();
      return data.package;
    },

    async deletePackage(id: string): Promise<boolean> {
      const res = await fetch(`${API_BASE}/api/admin/packages/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete pricing package');
      return true;
    },

    // Coupon administration
    async getCoupons(): Promise<Coupon[]> {
      const res = await fetch(`${API_BASE}/api/admin/coupons`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to load coupons');
      const data = await res.json();
      return data.coupons;
    },

    async createCoupon(coupon: { code: string; type: 'percent' | 'fixed'; value: number; maxUses: number }): Promise<Coupon> {
      const res = await fetch(`${API_BASE}/api/admin/coupons`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(coupon)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create coupon');
      }
      const data = await res.json();
      return data.coupon;
    },

    async toggleCoupon(id: string): Promise<Coupon> {
      const res = await fetch(`${API_BASE}/api/admin/coupons/${id}/toggle`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed to toggle coupon');
      const data = await res.json();
      return data.coupon;
    },

    async deleteCoupon(id: string): Promise<boolean> {
      const res = await fetch(`${API_BASE}/api/admin/coupons/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete coupon');
      return true;
    },

    // Country Node administration
    async toggleCountry(code: string, isEnabled: boolean): Promise<any> {
      const res = await fetch(`${API_BASE}/api/admin/countries`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ code, isEnabled })
      });
      if (!res.ok) throw new Error('Failed to modify target country deployment');
      return res.json();
    },

    // Configuration administration
    async getGlobalSettings(): Promise<{
      api: { proxyProviderUrl: string; proxyProviderApiKey: string; webhookSecret: string; resellerUid?: string; residentialApiUrl?: string; residentialApiKey?: string };
      payment: { stripePublicKey: string; stripeSecretKey: string; cryptoWalletAddress: string; paypalClientId: string; activeGateways: string[]; zinipayApiKey?: string; zinipayUsdToBdt?: number; zinipayEnabled?: boolean; paystationMerchantId?: string; paystationPassword?: string; paystationBaseUrl?: string; paystationUsdToBdt?: number; cryptomusMerchantId?: string; cryptomusApiKey?: string; cryptomusBaseUrl?: string; ltesocksApiKey?: string; ltesocksBaseUrl?: string; ltesocksPriceDivisor?: number; ltesocksCountries?: string; ltesocksPrices?: string; ltesocksMaxSpeed?: number; ltesocksAvailablePlans?: string; ltesocksStock?: number };
      website: { siteName: string; siteDescription: string; supportEmail: string; enableGoogleAuth: boolean; maintenanceMode: boolean; googleClientId?: string; tutorialVideoUrl?: string; pinnedCountries?: string };
    }> {
      const res = await fetch(`${API_BASE}/api/admin/settings`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to retrieve site parameters');
      return res.json();
    },

    async updateGlobalSettings(settings: {
      api?: Partial<{ proxyProviderUrl: string; proxyProviderApiKey: string; webhookSecret: string; resellerUid: string; residentialApiUrl: string; residentialApiKey: string }>;
      payment?: Partial<{ stripePublicKey: string; stripeSecretKey: string; cryptoWalletAddress: string; paypalClientId: string; activeGateways: string[]; zinipayApiKey?: string; zinipayUsdToBdt?: number; zinipayEnabled?: boolean; paystationMerchantId: string; paystationPassword: string; paystationBaseUrl: string; paystationUsdToBdt: number; cryptomusMerchantId: string; cryptomusApiKey: string; cryptomusBaseUrl: string; ltesocksApiKey: string; ltesocksBaseUrl: string; ltesocksPriceDivisor: number; ltesocksCountries: string; ltesocksPrices: string; ltesocksMaxSpeed: number; ltesocksAvailablePlans: string; ltesocksStock: number }>;
      website?: Partial<{ siteName: string; siteDescription: string; supportEmail: string; enableGoogleAuth: boolean; maintenanceMode: boolean; googleClientId: string; tutorialVideoUrl: string; pinnedCountries: string }>;
    }): Promise<boolean> {
      const res = await fetch(`${API_BASE}/api/admin/settings`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(settings)
      });
      if (!res.ok) throw new Error('Failed to apply global settings modifications');
      return true;
    }
  },

  // Notice Board — clients read, admin manages
  notice: {
    async getPosts(): Promise<NoticePost[]> {
      const res = await fetch(`${API_BASE}/api/notice`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to load notice board');
      const data = await res.json();
      return data.posts;
    },

    async createPost(post: { title: string; body: string; tag: NoticePost['tag']; isPinned: boolean }): Promise<NoticePost> {
      const res = await fetch(`${API_BASE}/api/admin/notice`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(post)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create notice post');
      }
      const data = await res.json();
      return data.post;
    },

    async updatePost(id: string, updates: Partial<{ title: string; body: string; tag: NoticePost['tag']; isPinned: boolean }>): Promise<NoticePost> {
      const res = await fetch(`${API_BASE}/api/admin/notice/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updates)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update notice post');
      }
      const data = await res.json();
      return data.post;
    },

    async deletePost(id: string): Promise<boolean> {
      const res = await fetch(`${API_BASE}/api/admin/notice/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete notice post');
      return true;
    }
  },

  // Support Tickets
  support: {
    async submitTicket(category: string, message: string): Promise<SupportTicket> {
      const res = await fetch(`${API_BASE}/api/support`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ category, message })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit ticket');
      }
      const data = await res.json();
      return data.ticket;
    },

    async getMyTickets(): Promise<SupportTicket[]> {
      const res = await fetch(`${API_BASE}/api/support/my`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to load tickets');
      const data = await res.json();
      return data.tickets;
    },

    async adminGetAll(): Promise<{ tickets: SupportTicket[]; openCount: number; inProgressCount: number }> {
      const res = await fetch(`${API_BASE}/api/admin/support`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Unauthorized');
      return res.json();
    },

    async adminUpdateTicket(id: string, status: SupportTicket['status'], adminReply?: string): Promise<SupportTicket> {
      const res = await fetch(`${API_BASE}/api/admin/support/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status, adminReply })
      });
      if (!res.ok) throw new Error('Failed to update ticket');
      const data = await res.json();
      return data.ticket;
    },

    async adminDeleteTicket(id: string): Promise<boolean> {
      const res = await fetch(`${API_BASE}/api/admin/support/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete ticket');
      return true;
    }
  }
};
