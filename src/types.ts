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
  mainBalance: number;    // prepaid balance for purchases (USD)
  dueBalance: number;     // amount owed / payable (USD)
}

// A customer's mobile (LTESocks) proxy — one "port" ordered on their behalf.
export interface MobileProxy {
  id: string;
  userId?: string;         // user who owns this proxy (empty = available in pool)
  ip: string;
  port: string;
  username: string;
  password: string;
  protocol: 'socks5' | 'http';
  planName: string;        // which plan this proxy is for
  countryCode: string;
  priceUsd: number;
  status: 'active' | 'expired' | 'available';  // available = in pool, active = assigned to user
  createdAt: string;
  expiresAt?: string;      // when proxy expires
}

export interface MobileProxyOrder {
  id: string;
  userId: string;
  planName: string;
  countryCode: string;
  priceUsd: number;
  status: 'pending' | 'assigned' | 'cancelled';  // pending = awaiting admin assignment
  createdAt: string;
  assignedAt?: string;
  mobileProxyId?: string;  // reference to MobileProxy once assigned
}

// One line in a user's wallet ledger (top-up credit or purchase debit).
export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'topup' | 'debit';
  amountUsd: number;      // positive number; `type` gives the direction
  balanceAfter: number;   // wallet balance after this entry
  description: string;
  createdAt: string;
}

export interface HostedIP {
  id: string;
  ipAddress: string;
  status: 'available' | 'assigned' | 'inactive';
  assignedToUserId?: string;  // user who's currently using this IP
  assignedToOrderId?: string; // which order this IP is assigned to
  createdAt: string;
  assignedAt?: string;
}

export interface ClearDuePayment {
  id: string;
  userId: string;
  amountUsd: number;
  gateway: 'stripe' | 'crypto' | 'paypal' | 'credit_card' | 'paystation' | 'cryptomus';
  status: 'completed' | 'pending' | 'failed';
  providerTransactionId?: string;
  providerInvoiceId?: string;
  createdAt: string;
  completedAt?: string;
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
  // 'wallet' = a wallet top-up (credits balance, no order); 'mobile' = a mobile
  // (LTESocks) proxy bought via a gateway; default 'order'.
  purpose?: 'order' | 'wallet' | 'mobile';
  mobilePlanId?: string;
  mobileTarificationIndex?: number;
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
  // LTESocks — mobile (5G/LTE) proxy provider
  ltesocksApiKey?: string;       // Authorization token (include the "Bearer " prefix)
  ltesocksBaseUrl?: string;      // default https://api.ltesocks.io/v2
  ltesocksPriceDivisor?: number; // LTESocks plan price unit → USD (default 100 = cents)
  ltesocksCountries?: string;    // comma-separated ISO-2 codes shown in the Mobile tab
  ltesocksPrices?: string;       // custom resale prices "days:usd" e.g. "7:4.10, 15:8.15, 30:15.75"
  ltesocksMaxSpeed?: number;     // displayed max speed (mbit/s) on mobile cards
  ltesocksAvailablePlans?: string; // comma-separated plan-name fragments forced "in stock" (blank = live availability)
  ltesocksStock?: number;          // IP-Pool/stock number shown on mobile cards (admin-set)
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

