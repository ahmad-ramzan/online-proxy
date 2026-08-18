/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import {
  User, ProxyPackage, ProxyOrder, CreatedProxy,
  PaymentTransaction, SystemLog, CountryConfig,
  ApiSettings, PaymentSettings, WebsiteSettings, Coupon, NoticePost, SupportTicket
} from '../src/types';

// JSON file "database". On a VPS this persists on disk across restarts.
// Override the location with DB_DIR if you want to store it outside the project.
const DB_DIR = process.env.DB_DIR || path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

interface DatabaseSchema {
  users: User[];
  packages: ProxyPackage[];
  orders: ProxyOrder[];
  proxies: CreatedProxy[];
  transactions: PaymentTransaction[];
  coupons: Coupon[];
  logs: SystemLog[];
  countries: CountryConfig[];
  apiSettings: ApiSettings;
  paymentSettings: PaymentSettings;
  websiteSettings: WebsiteSettings;
  noticePosts: NoticePost[];
  supportTickets: SupportTicket[];
}

const DEFAULT_DB: DatabaseSchema = {
  users: [
    {
      id: 'usr_admin',
      email: 'admin@proxygpt.online',
      name: 'Sarah Connor',
      role: 'admin',
      isActive: true,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  packages: [
    { id: 'pkg_1gb', name: 'Starter Proxy', bandwidthGb: 1, priceUsd: 2, features: ['HTTP/SOCKS5 support', '99.9% Uptime SLA', 'Instant Auto-Generation', 'Canada, USA, UK Nodes'], isActive: true },
    { id: 'pkg_3gb', name: 'Lite Proxy', bandwidthGb: 3, priceUsd: 6, features: ['HTTP/SOCKS5 support', 'High-speed 1Gbps ports', 'Instant Auto-Generation', 'All Country Nodes'], isActive: true },
    { id: 'pkg_5gb', name: 'Value Proxy', bandwidthGb: 5, priceUsd: 10, features: ['Standard Support', 'Standard bandwidth speed', 'Multi-country selectors', 'Fully rotating endpoints'], isActive: true },
    { id: 'pkg_10gb', name: 'Enterprise Pro', bandwidthGb: 10, priceUsd: 20, features: ['Premium Priority Support', 'Dual-stack IPv4/IPv6', 'Static & Rotating IPs', 'Exclusive server nodes'], isActive: true },
    { id: 'pkg_20gb', name: 'Ultimate Power', bandwidthGb: 20, priceUsd: 35, features: ['24/7 Phone Support', 'Ultra-low latency (<50ms)', 'Static Dedicated IPs', 'Custom rotation timers'], isActive: true }
  ],
  orders: [],
  proxies: [],
  transactions: [],
  coupons: [],
  noticePosts: [
    {
      id: 'notice_welcome',
      title: '🎉 Welcome to ProxyGPT Notice Board!',
      body: 'This is where the admin posts daily or weekly updates, maintenance schedules, new features, and important announcements. Check back regularly for the latest news!',
      tag: 'info',
      isPinned: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  supportTickets: [],
  logs: [
    {
      id: 'log_1',
      timestamp: new Date().toISOString(),
      level: 'info',
      category: 'system',
      message: 'ProxyGPT Online database initialized.',
      ipAddress: '127.0.0.1'
    }
  ],
  countries: [
    { code: 'CA', name: 'Canada', flag: '🇨🇦', isEnabled: true, totalServers: 420 },
    { code: 'US', name: 'USA', flag: '🇺🇸', isEnabled: true, totalServers: 1250 },
    { code: 'GB', name: 'UK', flag: '🇬🇧', isEnabled: true, totalServers: 680 }
  ],
  apiSettings: {
    proxyProviderUrl: 'https://app-api.geonode.com/api/reseller/v2',
    proxyProviderApiKey: 'geonode.$UdtkIJLlqISZ29lE3X4k8g^XN5Il2sWBh4o',
    webhookSecret: 'whsec_908f902bf89c8a8d10f',
    resellerUid: '99925e37-e69e-4470-83ce-1ed18e8f99f6',
    // Proxy-Seller Residential Proxy API. Drop a real personal API key here to make
    // the landing pricing cards render live /resident/package + /resident/consumption data.
    residentialApiUrl: 'https://proxy-seller.com/personal/api/v1',
    residentialApiKey: ''
  },
  paymentSettings: {
    stripePublicKey: 'pk_test_51Px2bX...',
    stripeSecretKey: 'sk_test_51Px2bX...',
    cryptoWalletAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    paypalClientId: 'AX_paypal_client_id_demo',
    activeGateways: ['stripe', 'crypto', 'credit_card', 'paystation'],
    // ZiniPay — sandbox key works out of the box; replace with your production Brand/API key.
    zinipayApiKey: 'sandbox_test_8f4c9a2e7b31',
    zinipayBaseUrl: 'https://api.zinipay.com',
    zinipayUsdToBdt: 120,
    // PayStation — set Store ID + API password in Admin → Payment Settings.
    paystationMerchantId: '',
    paystationPassword: '',
    paystationBaseUrl: 'https://api.paystation.com.bd',
    paystationUsdToBdt: 120
  },
  websiteSettings: {
    siteName: 'ProxyGPT Online',
    siteDescription: 'Premium High-Speed Proxy Provider. Clean IP Addresses, Low Latency, Unlimited Concurrent Connections.',
    supportEmail: 'support@proxygpt.online',
    enableGoogleAuth: true,
    maintenanceMode: false,
    googleClientId: '',
    tutorialVideoUrl: '',
    pinnedCountries: 'US, GB, CA'
  }
};

class Database {
  private cache: DatabaseSchema | null = null;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      if (!fs.existsSync(DB_FILE)) {
        this.write(DEFAULT_DB);
      }
    } catch (e) {
      console.error('Failed to initialize database file: ', e);
    }
  }

  private read(): DatabaseSchema {
    if (this.cache) return this.cache;
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
        // Upgrade-safe load: a db.json written by an older build has none of the
        // collections/settings added since (noticePosts, supportTickets,
        // websiteSettings.pinnedCountries, ...). Backfill them from DEFAULT_DB so
        // the new code never touches an undefined array or missing setting.
        this.cache = {
          ...DEFAULT_DB,
          ...parsed,
          websiteSettings: { ...DEFAULT_DB.websiteSettings, ...(parsed.websiteSettings || {}) },
          apiSettings: { ...DEFAULT_DB.apiSettings, ...(parsed.apiSettings || {}) },
          paymentSettings: { ...DEFAULT_DB.paymentSettings, ...(parsed.paymentSettings || {}) }
        } as DatabaseSchema;
        return this.cache!;
      }
    } catch (e) {
      console.error('Error reading database file, using fallback DEFAULT_DB:', e);
    }
    return DEFAULT_DB;
  }

  private write(data: DatabaseSchema) {
    try {
      this.cache = data;
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing database file:', e);
    }
  }

  // --- QUERY UTILITIES ---

  public getUsers(): User[] {
    return this.read().users;
  }

  public insertUser(user: User): User {
    const db = this.read();
    db.users.push(user);
    this.write(db);
    this.log('info', 'auth', `New user registered: ${user.name} (${user.email})`);
    return user;
  }

  public updateUser(userId: string, updates: Partial<User>): User | null {
    const db = this.read();
    const idx = db.users.findIndex(u => u.id === userId);
    if (idx === -1) return null;
    db.users[idx] = { ...db.users[idx], ...updates };
    this.write(db);
    return db.users[idx];
  }

  public getPackages(): ProxyPackage[] {
    return this.read().packages;
  }

  public insertPackage(pkg: ProxyPackage): ProxyPackage {
    const db = this.read();
    db.packages.push(pkg);
    this.write(db);
    this.log('info', 'admin', `Admin added pricing package: ${pkg.name} (${pkg.bandwidthGb} GB - $${pkg.priceUsd})`);
    return pkg;
  }

  public updatePackage(id: string, updates: Partial<ProxyPackage>): ProxyPackage | null {
    const db = this.read();
    const idx = db.packages.findIndex(p => p.id === id);
    if (idx === -1) return null;
    db.packages[idx] = { ...db.packages[idx], ...updates };
    this.write(db);
    this.log('info', 'admin', `Admin updated pricing package: ${db.packages[idx].name}`);
    return db.packages[idx];
  }

  public deletePackage(id: string): boolean {
    const db = this.read();
    const len = db.packages.length;
    db.packages = db.packages.filter(p => p.id !== id);
    if (db.packages.length === len) return false;
    this.write(db);
    this.log('info', 'admin', `Admin deleted pricing package id ${id}`);
    return true;
  }

  public getOrders(): ProxyOrder[] {
    return this.read().orders;
  }

  public insertOrder(order: ProxyOrder): ProxyOrder {
    const db = this.read();
    db.orders.push(order);
    this.write(db);
    return order;
  }

  public updateOrder(orderId: string, updates: Partial<ProxyOrder>): ProxyOrder | null {
    const db = this.read();
    const idx = db.orders.findIndex(o => o.id === orderId);
    if (idx === -1) return null;
    db.orders[idx] = { ...db.orders[idx], ...updates };
    this.write(db);
    return db.orders[idx];
  }

  public getProxies(): CreatedProxy[] {
    return this.read().proxies;
  }

  public insertProxy(proxy: CreatedProxy): CreatedProxy {
    const db = this.read();
    db.proxies.push(proxy);
    this.write(db);
    return proxy;
  }

  public updateProxy(id: string, updates: Partial<CreatedProxy>): CreatedProxy | null {
    const db = this.read();
    const idx = db.proxies.findIndex(p => p.id === id);
    if (idx === -1) return null;
    db.proxies[idx] = { ...db.proxies[idx], ...updates };
    this.write(db);
    return db.proxies[idx];
  }

  public deleteProxy(id: string): boolean {
    const db = this.read();
    const len = db.proxies.length;
    db.proxies = db.proxies.filter(p => p.id !== id);
    if (db.proxies.length === len) return false;
    this.write(db);
    return true;
  }

  public getTransactions(): PaymentTransaction[] {
    return this.read().transactions;
  }

  public insertTransaction(txn: PaymentTransaction): PaymentTransaction {
    const db = this.read();
    db.transactions.push(txn);
    this.write(db);
    return txn;
  }

  public updateTransaction(id: string, updates: Partial<PaymentTransaction>): PaymentTransaction | null {
    const db = this.read();
    const idx = db.transactions.findIndex(t => t.id === id);
    if (idx === -1) return null;
    db.transactions[idx] = { ...db.transactions[idx], ...updates };
    this.write(db);
    return db.transactions[idx];
  }

  // --- COUPONS ---

  public getCoupons(): Coupon[] {
    return this.read().coupons || [];
  }

  public findCouponByCode(code: string): Coupon | undefined {
    const norm = (code || '').trim().toUpperCase();
    return this.getCoupons().find(c => c.code === norm);
  }

  public insertCoupon(coupon: Coupon): Coupon {
    const db = this.read();
    if (!db.coupons) db.coupons = [];
    db.coupons.push(coupon);
    this.write(db);
    this.log('info', 'admin', `Admin created coupon ${coupon.code} (${coupon.type === 'percent' ? coupon.value + '%' : '$' + coupon.value} off)`);
    return coupon;
  }

  public updateCoupon(id: string, updates: Partial<Coupon>): Coupon | null {
    const db = this.read();
    if (!db.coupons) db.coupons = [];
    const idx = db.coupons.findIndex(c => c.id === id);
    if (idx === -1) return null;
    db.coupons[idx] = { ...db.coupons[idx], ...updates };
    this.write(db);
    return db.coupons[idx];
  }

  public deleteCoupon(id: string): boolean {
    const db = this.read();
    if (!db.coupons) db.coupons = [];
    const len = db.coupons.length;
    db.coupons = db.coupons.filter(c => c.id !== id);
    if (db.coupons.length === len) return false;
    this.write(db);
    return true;
  }

  public getLogs(): SystemLog[] {
    return this.read().logs;
  }

  public log(level: 'info' | 'warning' | 'error' | 'security', category: 'auth' | 'proxy' | 'payment' | 'admin' | 'system', message: string, ip?: string) {
    const db = this.read();
    const newLog: SystemLog = {
      id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      ipAddress: ip || '127.0.0.1'
    };
    db.logs.unshift(newLog);
    // Keep last 150 logs to prevent infinite growth
    if (db.logs.length > 150) {
      db.logs = db.logs.slice(0, 150);
    }
    this.write(db);
  }

  public getCountries(): CountryConfig[] {
    return this.read().countries;
  }

  public updateCountry(code: string, isEnabled: boolean): CountryConfig | null {
    const db = this.read();
    const idx = db.countries.findIndex(c => c.code === code);
    if (idx === -1) return null;
    db.countries[idx].isEnabled = isEnabled;
    this.write(db);
    this.log('info', 'admin', `Admin ${isEnabled ? 'enabled' : 'disabled'} country nodes for ${db.countries[idx].name} (${code})`);
    return db.countries[idx];
  }

  public getApiSettings(): ApiSettings {
    return this.read().apiSettings;
  }

  public updateApiSettings(updates: Partial<ApiSettings>): ApiSettings {
    const db = this.read();
    db.apiSettings = { ...db.apiSettings, ...updates };
    this.write(db);
    this.log('security', 'admin', 'Admin modified Proxy Provider API Integration Settings');
    return db.apiSettings;
  }

  public getPaymentSettings(): PaymentSettings {
    return this.read().paymentSettings;
  }

  public updatePaymentSettings(updates: Partial<PaymentSettings>): PaymentSettings {
    const db = this.read();
    db.paymentSettings = { ...db.paymentSettings, ...updates };
    this.write(db);
    this.log('security', 'admin', 'Admin modified Payment Gateway Settings');
    return db.paymentSettings;
  }

  public getWebsiteSettings(): WebsiteSettings {
    return this.read().websiteSettings;
  }

  public updateWebsiteSettings(updates: Partial<WebsiteSettings>): WebsiteSettings {
    const db = this.read();
    db.websiteSettings = { ...db.websiteSettings, ...updates };
    this.write(db);
    this.log('info', 'admin', 'Admin modified Global Website Brand Settings');
    return db.websiteSettings;
  }

  // --- NOTICE BOARD ---

  public getNoticePosts(): NoticePost[] {
    const db = this.read();
    const posts = db.noticePosts || [];
    // Pinned first, then newest first
    return [...posts].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  public insertNoticePost(post: NoticePost): NoticePost {
    const db = this.read();
    if (!db.noticePosts) db.noticePosts = [];
    db.noticePosts.push(post);
    this.write(db);
    this.log('info', 'admin', `Admin posted notice: "${post.title}"`);
    return post;
  }

  public updateNoticePost(id: string, updates: Partial<NoticePost>): NoticePost | null {
    const db = this.read();
    if (!db.noticePosts) db.noticePosts = [];
    const idx = db.noticePosts.findIndex(p => p.id === id);
    if (idx === -1) return null;
    db.noticePosts[idx] = { ...db.noticePosts[idx], ...updates, updatedAt: new Date().toISOString() };
    this.write(db);
    this.log('info', 'admin', `Admin updated notice: "${db.noticePosts[idx].title}"`);
    return db.noticePosts[idx];
  }

  public deleteNoticePost(id: string): boolean {
    const db = this.read();
    if (!db.noticePosts) return false;
    const len = db.noticePosts.length;
    db.noticePosts = db.noticePosts.filter(p => p.id !== id);
    if (db.noticePosts.length === len) return false;
    this.write(db);
    this.log('info', 'admin', `Admin deleted notice id: ${id}`);
    return true;
  }

  // --- SUPPORT TICKETS ---

  public getAllTickets(): SupportTicket[] {
    const db = this.read();
    const tickets = db.supportTickets || [];
    return [...tickets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getTicketsByUser(userId: string): SupportTicket[] {
    return this.getAllTickets().filter(t => t.userId === userId);
  }

  public insertTicket(ticket: SupportTicket): SupportTicket {
    const db = this.read();
    if (!db.supportTickets) db.supportTickets = [];
    db.supportTickets.push(ticket);
    this.write(db);
    this.log('info', 'system', `Support ticket submitted by ${ticket.userEmail}: [${ticket.category}] ${ticket.message.slice(0, 60)}`);
    return ticket;
  }

  public updateTicket(id: string, updates: Partial<SupportTicket>): SupportTicket | null {
    const db = this.read();
    if (!db.supportTickets) db.supportTickets = [];
    const idx = db.supportTickets.findIndex(t => t.id === id);
    if (idx === -1) return null;
    db.supportTickets[idx] = { ...db.supportTickets[idx], ...updates, updatedAt: new Date().toISOString() };
    this.write(db);
    this.log('info', 'admin', `Admin updated support ticket ${id} → status: ${db.supportTickets[idx].status}`);
    return db.supportTickets[idx];
  }

  public deleteTicket(id: string): boolean {
    const db = this.read();
    if (!db.supportTickets) return false;
    const len = db.supportTickets.length;
    db.supportTickets = db.supportTickets.filter(t => t.id !== id);
    if (db.supportTickets.length === len) return false;
    this.write(db);
    return true;
  }
}

export const dbInstance = new Database();

