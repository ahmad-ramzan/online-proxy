/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: string;
}

export interface ProxyPackage {
  id: string;
  name: string;
  bandwidthGb: number;
  priceUsd: number;
  features: string[];
  isActive: boolean;
}

export interface ProxyOrder {
  id: string;
  userId: string;
  packageId: string;
  packageName: string;
  bandwidthGb: number;
  bandwidthUsedGb: number;
  priceUsd: number;
  status: 'active' | 'expired' | 'pending';
  createdAt: string;
  expiresAt: string;
  // Proxy-Seller sub-user package key (per-customer reserved traffic allocation)
  subUserPackageKey?: string;
}

export interface CreatedProxy {
  id: string;
  orderId: string;
  userId: string;
  ip: string;
  port: number;
  username: string;
  passwordHash: string; // text representation
  country: string;
  type: 'residential' | 'datacenter' | 'mobile' | 'isp';
  protocol: 'http' | 'socks5';
  status: 'online' | 'offline';
  rotationMinutes: number;
  createdAt: string;
  // Proxy-Seller residential targeting details (present for residential allocations)
  countryCode?: string; // ISO-2 code, used to render the country flag
  region?: string;
  city?: string;
  isp?: string;
  ports?: number;
  listId?: string; // Proxy-Seller list id, used for revoke via /resident/list/delete
  subUserPackageKey?: string; // sub-user package this list belongs to (for revoke)
}

// Create-proxy form options, served by the backend so the UI holds no hardcoded lists.
export interface ResidentialProxyOptions {
  protocols: { value: 'http' | 'socks5'; label: string }[];
  proxyTypes: { value: 'residential' | 'isp'; label: string }[];
  ports: { min: number; max: number; default: number };
  rotation: { minMinutes: number; maxMinutes: number; stepMinutes: number; presetMinutes: number[]; defaultMinutes: number };
}

// Proxy-Seller residential GEO tree (from GET /resident/geo)
export interface ResidentialGeoCity {
  name: string;
  isps: string[];
}

export interface ResidentialGeoRegion {
  name: string;
  code?: number;
  cities: ResidentialGeoCity[];
}

export interface ResidentialGeoCountry {
  code: string;
  name: string;
  regions: ResidentialGeoRegion[];
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  userEmail: string;
  orderId: string;
  amountUsd: number;
  gateway: 'stripe' | 'crypto' | 'paypal' | 'credit_card' | 'paystation' | 'cryptomus';
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
  // ZiniPay (hosted checkout — Bangla QR / bKash / Nagad / card)
  providerInvoiceId?: string;
  providerTxnId?: string;
  paymentMethod?: string;
  // Coupon applied to this transaction
  couponCode?: string;
  discountUsd?: number;
}

// Discount coupons — admin creates, clients apply at checkout.
export interface Coupon {
  id: string;
  code: string;                 // stored uppercase, unique
  type: 'percent' | 'fixed';    // percent (1-100) or fixed USD amount
  value: number;
  isActive: boolean;
  maxUses: number;              // 0 = unlimited
  usedCount: number;
  createdAt: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'security';
  category: 'auth' | 'proxy' | 'payment' | 'admin' | 'system';
  message: string;
  ipAddress?: string;
}

export interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  isEnabled: boolean;
  totalServers: number;
}

export interface ApiSettings {
  proxyProviderUrl: string;
  proxyProviderApiKey: string;
  webhookSecret: string;
  resellerUid?: string;
  // Proxy-Seller Residential Proxy API (https://docs.proxy-seller.com/api-v1/residential-proxy)
  // Base is combined with the key as `${residentialApiUrl}/${residentialApiKey}/resident/...`
  residentialApiUrl?: string;
  residentialApiKey?: string;
}

/**
 * Normalised residential-package snapshot the landing pricing cards render.
 * Sourced from Proxy-Seller `GET /resident/package` + `POST /resident/consumption`.
 * `live` is false when we fall back to a high-fidelity local simulation
 * (no real API key configured, or the upstream returned an error).
 */
export interface ResidentialInfo {
  live: boolean;
  pricePerGb: number | null;
  rotationSeconds: number | null;
  trafficLimitBytes: number | null;
  trafficLeftBytes: number | null;
  trafficUsageBytes: number | null;
  ordersBytesFormatted: string | null;
  usedBytesFormatted: string | null;
  expiresAt: string | null;
  isActive: boolean | null;
  autoRenew: boolean | null;
  packageKey: string | null;
}

export interface PaymentSettings {
  stripePublicKey: string;
  stripeSecretKey: string;
  cryptoWalletAddress: string;
  paypalClientId: string;
  activeGateways: string[]; // e.g. ['stripe', 'crypto']
  // ZiniPay (Bangladesh) — hosted checkout with Bangla QR / bKash / Nagad / card
  zinipayApiKey?: string;
  zinipayBaseUrl?: string;
  zinipayUsdToBdt?: number; // conversion rate; ZiniPay charges in BDT, packages priced in USD
  zinipayEnabled?: boolean; // show/hide the "Pay with ZiniPay" button at checkout
  // PayStation (Bangladesh) — hosted checkout (bKash / Nagad / Rocket / card)
  paystationMerchantId?: string; // "Store ID"
  paystationPassword?: string;   // API password
  paystationBaseUrl?: string;    // default https://api.paystation.com.bd
  paystationUsdToBdt?: number;   // conversion rate (falls back to zinipayUsdToBdt)
  // Cryptomus — crypto hosted checkout (USDT / BTC / ETH …), charged in USD
  cryptomusMerchantId?: string;  // Merchant UUID
  cryptomusApiKey?: string;      // Payment API key
  cryptomusBaseUrl?: string;     // default https://api.cryptomus.com
}

export interface WebsiteSettings {
  siteName: string;
  siteDescription: string;
  supportEmail: string;
  enableGoogleAuth: boolean;
  maintenanceMode: boolean;
  googleClientId?: string; // Google OAuth 2.0 Web Client ID for real Google Sign-In
  tutorialVideoUrl?: string; // YouTube URL shown in the client Video Tutorial tab
  pinnedCountries?: string; // comma-separated ISO-2 codes pinned to the top of the country dropdown
}

export interface AuthState {
  user: User | null;
  token: string | null;
}

// Notice Board — admin posts announcements, all logged-in clients see them.
export interface NoticePost {
  id: string;
  title: string;
  body: string;
  tag: 'update' | 'maintenance' | 'feature' | 'alert' | 'info';
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

// Support Tickets — clients submit, admin resolves.
export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  category: 'technical' | 'billing' | 'reseller' | 'other';
  message: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  adminReply?: string;
  createdAt: string;
  updatedAt: string;
}

