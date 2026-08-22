var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express2 = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_vite = require("vite");

// server/app.ts
var import_node_dns = __toESM(require("node:dns"), 1);
var import_node_http = __toESM(require("node:http"), 1);
var import_node_net = __toESM(require("node:net"), 1);
var import_express = __toESM(require("express"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);

// server/db.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var DB_DIR = process.env.DB_DIR || import_path.default.join(process.cwd(), "data");
var DB_FILE = import_path.default.join(DB_DIR, "db.json");
var DEFAULT_DB = {
  users: [
    {
      id: "usr_admin",
      email: "proxygptonline@gmail.com",
      name: "Sarah Connor",
      role: "admin",
      isActive: true,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3).toISOString()
    }
  ],
  packages: [
    { id: "pkg_1gb", name: "Starter Proxy", bandwidthGb: 1, priceUsd: 2, features: ["HTTP/SOCKS5 support", "99.9% Uptime SLA", "Instant Auto-Generation", "Canada, USA, UK Nodes"], isActive: true },
    { id: "pkg_3gb", name: "Lite Proxy", bandwidthGb: 3, priceUsd: 6, features: ["HTTP/SOCKS5 support", "High-speed 1Gbps ports", "Instant Auto-Generation", "All Country Nodes"], isActive: true },
    { id: "pkg_5gb", name: "Value Proxy", bandwidthGb: 5, priceUsd: 10, features: ["Standard Support", "Standard bandwidth speed", "Multi-country selectors", "Fully rotating endpoints"], isActive: true },
    { id: "pkg_10gb", name: "Enterprise Pro", bandwidthGb: 10, priceUsd: 20, features: ["Premium Priority Support", "Dual-stack IPv4/IPv6", "Static & Rotating IPs", "Exclusive server nodes"], isActive: true },
    { id: "pkg_20gb", name: "Ultimate Power", bandwidthGb: 20, priceUsd: 35, features: ["24/7 Phone Support", "Ultra-low latency (<50ms)", "Static Dedicated IPs", "Custom rotation timers"], isActive: true }
  ],
  orders: [],
  proxies: [],
  transactions: [],
  coupons: [],
  noticePosts: [
    {
      id: "notice_welcome",
      title: "\u{1F389} Welcome to ProxyGPT Notice Board!",
      body: "This is where the admin posts daily or weekly updates, maintenance schedules, new features, and important announcements. Check back regularly for the latest news!",
      tag: "info",
      isPinned: true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  ],
  supportTickets: [],
  walletTransactions: [],
  mobileProxies: [],
  logs: [
    {
      id: "log_1",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      level: "info",
      category: "system",
      message: "ProxyGPT Online database initialized.",
      ipAddress: "127.0.0.1"
    }
  ],
  countries: [
    { code: "CA", name: "Canada", flag: "\u{1F1E8}\u{1F1E6}", isEnabled: true, totalServers: 420 },
    { code: "US", name: "USA", flag: "\u{1F1FA}\u{1F1F8}", isEnabled: true, totalServers: 1250 },
    { code: "GB", name: "UK", flag: "\u{1F1EC}\u{1F1E7}", isEnabled: true, totalServers: 680 }
  ],
  apiSettings: {
    proxyProviderUrl: "https://app-api.geonode.com/api/reseller/v2",
    proxyProviderApiKey: "geonode.$UdtkIJLlqISZ29lE3X4k8g^XN5Il2sWBh4o",
    webhookSecret: "whsec_908f902bf89c8a8d10f",
    resellerUid: "99925e37-e69e-4470-83ce-1ed18e8f99f6",
    // Proxy-Seller Residential Proxy API. Drop a real personal API key here to make
    // the landing pricing cards render live /resident/package + /resident/consumption data.
    residentialApiUrl: "https://proxy-seller.com/personal/api/v1",
    residentialApiKey: ""
  },
  paymentSettings: {
    stripePublicKey: "pk_test_51Px2bX...",
    stripeSecretKey: "sk_test_51Px2bX...",
    cryptoWalletAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    paypalClientId: "AX_paypal_client_id_demo",
    activeGateways: ["stripe", "crypto", "credit_card", "paystation", "cryptomus"],
    // ZiniPay — sandbox key works out of the box; replace with your production Brand/API key.
    zinipayApiKey: "sandbox_test_8f4c9a2e7b31",
    zinipayBaseUrl: "https://api.zinipay.com",
    zinipayUsdToBdt: 127,
    zinipayEnabled: false,
    // hidden by default; toggle from Admin -> Payment Settings
    // PayStation — set Store ID + API password in Admin → Payment Settings.
    paystationMerchantId: "",
    paystationPassword: "",
    paystationBaseUrl: "https://api.paystation.com.bd",
    paystationUsdToBdt: 127,
    // Cryptomus — set Merchant UUID + API key in Admin → Payment Settings.
    cryptomusMerchantId: "",
    cryptomusApiKey: "",
    cryptomusBaseUrl: "https://api.cryptomus.com",
    // LTESocks — mobile proxy provider; set the Authorization token in Admin.
    ltesocksApiKey: "",
    ltesocksBaseUrl: "https://api.ltesocks.io/v2",
    ltesocksPriceDivisor: 100,
    ltesocksCountries: "DE, FR, CA, GB, AU"
  },
  websiteSettings: {
    siteName: "ProxyGPT Online",
    siteDescription: "Premium High-Speed Proxy Provider. Clean IP Addresses, Low Latency, Unlimited Concurrent Connections.",
    supportEmail: "proxygptonline@gmail.com",
    enableGoogleAuth: true,
    maintenanceMode: false,
    googleClientId: "",
    tutorialVideoUrl: "",
    pinnedCountries: "US, GB, CA"
  }
};
var Database = class {
  constructor() {
    this.cache = null;
    this.init();
  }
  init() {
    try {
      if (!import_fs.default.existsSync(DB_DIR)) {
        import_fs.default.mkdirSync(DB_DIR, { recursive: true });
      }
      if (!import_fs.default.existsSync(DB_FILE)) {
        this.write(DEFAULT_DB);
      }
    } catch (e) {
      console.error("Failed to initialize database file: ", e);
    }
  }
  read() {
    if (this.cache) return this.cache;
    try {
      if (import_fs.default.existsSync(DB_FILE)) {
        const raw = import_fs.default.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        this.cache = {
          ...DEFAULT_DB,
          ...parsed,
          websiteSettings: { ...DEFAULT_DB.websiteSettings, ...parsed.websiteSettings || {} },
          apiSettings: { ...DEFAULT_DB.apiSettings, ...parsed.apiSettings || {} },
          paymentSettings: { ...DEFAULT_DB.paymentSettings, ...parsed.paymentSettings || {} }
        };
        return this.cache;
      }
    } catch (e) {
      console.error("Error reading database file, using fallback DEFAULT_DB:", e);
    }
    return DEFAULT_DB;
  }
  write(data) {
    try {
      this.cache = data;
      import_fs.default.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("Error writing database file:", e);
    }
  }
  // --- QUERY UTILITIES ---
  getUsers() {
    return this.read().users;
  }
  insertUser(user) {
    const db = this.read();
    db.users.push(user);
    this.write(db);
    this.log("info", "auth", `New user registered: ${user.name} (${user.email})`);
    return user;
  }
  updateUser(userId, updates) {
    const db = this.read();
    const idx = db.users.findIndex((u) => u.id === userId);
    if (idx === -1) return null;
    db.users[idx] = { ...db.users[idx], ...updates };
    this.write(db);
    return db.users[idx];
  }
  getPackages() {
    return this.read().packages;
  }
  insertPackage(pkg) {
    const db = this.read();
    db.packages.push(pkg);
    this.write(db);
    this.log("info", "admin", `Admin added pricing package: ${pkg.name} (${pkg.bandwidthGb} GB - $${pkg.priceUsd})`);
    return pkg;
  }
  updatePackage(id, updates) {
    const db = this.read();
    const idx = db.packages.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    db.packages[idx] = { ...db.packages[idx], ...updates };
    this.write(db);
    this.log("info", "admin", `Admin updated pricing package: ${db.packages[idx].name}`);
    return db.packages[idx];
  }
  deletePackage(id) {
    const db = this.read();
    const len = db.packages.length;
    db.packages = db.packages.filter((p) => p.id !== id);
    if (db.packages.length === len) return false;
    this.write(db);
    this.log("info", "admin", `Admin deleted pricing package id ${id}`);
    return true;
  }
  getOrders() {
    return this.read().orders;
  }
  insertOrder(order) {
    const db = this.read();
    db.orders.push(order);
    this.write(db);
    return order;
  }
  updateOrder(orderId, updates) {
    const db = this.read();
    const idx = db.orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return null;
    db.orders[idx] = { ...db.orders[idx], ...updates };
    this.write(db);
    return db.orders[idx];
  }
  getProxies() {
    return this.read().proxies;
  }
  insertProxy(proxy) {
    const db = this.read();
    db.proxies.push(proxy);
    this.write(db);
    return proxy;
  }
  updateProxy(id, updates) {
    const db = this.read();
    const idx = db.proxies.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    db.proxies[idx] = { ...db.proxies[idx], ...updates };
    this.write(db);
    return db.proxies[idx];
  }
  deleteProxy(id) {
    const db = this.read();
    const len = db.proxies.length;
    db.proxies = db.proxies.filter((p) => p.id !== id);
    if (db.proxies.length === len) return false;
    this.write(db);
    return true;
  }
  getTransactions() {
    return this.read().transactions;
  }
  insertTransaction(txn) {
    const db = this.read();
    db.transactions.push(txn);
    this.write(db);
    return txn;
  }
  // --- WALLET ---
  getWalletTransactionsByUser(userId) {
    return (this.read().walletTransactions || []).filter((w) => w.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  /** Credit the user's wallet and record a ledger entry. Returns new balance. */
  creditWallet(userId, amountUsd, description) {
    const db = this.read();
    const user = db.users.find((u) => u.id === userId);
    if (!user) return 0;
    const newBalance = Math.round(((user.walletBalance || 0) + amountUsd) * 100) / 100;
    user.walletBalance = newBalance;
    if (!db.walletTransactions) db.walletTransactions = [];
    db.walletTransactions.push({
      id: `wtx_${Date.now()}_${Math.floor(Math.random() * 1e3)}`,
      userId,
      type: "topup",
      amountUsd: Math.round(amountUsd * 100) / 100,
      balanceAfter: newBalance,
      description,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    this.write(db);
    this.log("info", "payment", `Wallet credited $${amountUsd} for ${user.email} \u2192 balance $${newBalance}`);
    return newBalance;
  }
  /** Debit the wallet if funds suffice. Returns {ok, balance}. */
  debitWallet(userId, amountUsd, description) {
    const db = this.read();
    const user = db.users.find((u) => u.id === userId);
    if (!user) return { ok: false, balance: 0 };
    const bal = user.walletBalance || 0;
    if (bal + 1e-9 < amountUsd) return { ok: false, balance: bal };
    const newBalance = Math.round((bal - amountUsd) * 100) / 100;
    user.walletBalance = newBalance;
    if (!db.walletTransactions) db.walletTransactions = [];
    db.walletTransactions.push({
      id: `wtx_${Date.now()}_${Math.floor(Math.random() * 1e3)}`,
      userId,
      type: "debit",
      amountUsd: Math.round(amountUsd * 100) / 100,
      balanceAfter: newBalance,
      description,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    this.write(db);
    this.log("info", "payment", `Wallet debited $${amountUsd} for ${user.email} \u2192 balance $${newBalance}`);
    return { ok: true, balance: newBalance };
  }
  // --- MOBILE PROXIES (LTESocks) ---
  getMobileProxiesByUser(userId) {
    return (this.read().mobileProxies || []).filter((m) => m.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  getMobileProxyById(id) {
    return (this.read().mobileProxies || []).find((m) => m.id === id);
  }
  insertMobileProxy(m) {
    const db = this.read();
    if (!db.mobileProxies) db.mobileProxies = [];
    db.mobileProxies.push(m);
    this.write(db);
    return m;
  }
  updateMobileProxy(id, updates) {
    const db = this.read();
    if (!db.mobileProxies) db.mobileProxies = [];
    const idx = db.mobileProxies.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    db.mobileProxies[idx] = { ...db.mobileProxies[idx], ...updates };
    this.write(db);
    return db.mobileProxies[idx];
  }
  deleteMobileProxy(id) {
    const db = this.read();
    if (!db.mobileProxies) db.mobileProxies = [];
    const before = db.mobileProxies.length;
    db.mobileProxies = db.mobileProxies.filter((m) => m.id !== id);
    this.write(db);
    return db.mobileProxies.length < before;
  }
  updateTransaction(id, updates) {
    const db = this.read();
    const idx = db.transactions.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    db.transactions[idx] = { ...db.transactions[idx], ...updates };
    this.write(db);
    return db.transactions[idx];
  }
  // --- COUPONS ---
  getCoupons() {
    return this.read().coupons || [];
  }
  findCouponByCode(code) {
    const norm = (code || "").trim().toUpperCase();
    return this.getCoupons().find((c) => c.code === norm);
  }
  insertCoupon(coupon) {
    const db = this.read();
    if (!db.coupons) db.coupons = [];
    db.coupons.push(coupon);
    this.write(db);
    this.log("info", "admin", `Admin created coupon ${coupon.code} (${coupon.type === "percent" ? coupon.value + "%" : "$" + coupon.value} off)`);
    return coupon;
  }
  updateCoupon(id, updates) {
    const db = this.read();
    if (!db.coupons) db.coupons = [];
    const idx = db.coupons.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    db.coupons[idx] = { ...db.coupons[idx], ...updates };
    this.write(db);
    return db.coupons[idx];
  }
  deleteCoupon(id) {
    const db = this.read();
    if (!db.coupons) db.coupons = [];
    const len = db.coupons.length;
    db.coupons = db.coupons.filter((c) => c.id !== id);
    if (db.coupons.length === len) return false;
    this.write(db);
    return true;
  }
  getLogs() {
    return this.read().logs;
  }
  log(level, category, message, ip) {
    const db = this.read();
    const newLog = {
      id: `log_${Date.now()}_${Math.floor(Math.random() * 1e3)}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      level,
      category,
      message,
      ipAddress: ip || "127.0.0.1"
    };
    db.logs.unshift(newLog);
    if (db.logs.length > 150) {
      db.logs = db.logs.slice(0, 150);
    }
    this.write(db);
  }
  getCountries() {
    return this.read().countries;
  }
  updateCountry(code, isEnabled) {
    const db = this.read();
    const idx = db.countries.findIndex((c) => c.code === code);
    if (idx === -1) return null;
    db.countries[idx].isEnabled = isEnabled;
    this.write(db);
    this.log("info", "admin", `Admin ${isEnabled ? "enabled" : "disabled"} country nodes for ${db.countries[idx].name} (${code})`);
    return db.countries[idx];
  }
  getApiSettings() {
    return this.read().apiSettings;
  }
  updateApiSettings(updates) {
    const db = this.read();
    db.apiSettings = { ...db.apiSettings, ...updates };
    this.write(db);
    this.log("security", "admin", "Admin modified Proxy Provider API Integration Settings");
    return db.apiSettings;
  }
  getPaymentSettings() {
    return this.read().paymentSettings;
  }
  updatePaymentSettings(updates) {
    const db = this.read();
    db.paymentSettings = { ...db.paymentSettings, ...updates };
    this.write(db);
    this.log("security", "admin", "Admin modified Payment Gateway Settings");
    return db.paymentSettings;
  }
  getWebsiteSettings() {
    return this.read().websiteSettings;
  }
  updateWebsiteSettings(updates) {
    const db = this.read();
    db.websiteSettings = { ...db.websiteSettings, ...updates };
    this.write(db);
    this.log("info", "admin", "Admin modified Global Website Brand Settings");
    return db.websiteSettings;
  }
  // --- NOTICE BOARD ---
  getNoticePosts() {
    const db = this.read();
    const posts = db.noticePosts || [];
    return [...posts].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
  insertNoticePost(post) {
    const db = this.read();
    if (!db.noticePosts) db.noticePosts = [];
    db.noticePosts.push(post);
    this.write(db);
    this.log("info", "admin", `Admin posted notice: "${post.title}"`);
    return post;
  }
  updateNoticePost(id, updates) {
    const db = this.read();
    if (!db.noticePosts) db.noticePosts = [];
    const idx = db.noticePosts.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    db.noticePosts[idx] = { ...db.noticePosts[idx], ...updates, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    this.write(db);
    this.log("info", "admin", `Admin updated notice: "${db.noticePosts[idx].title}"`);
    return db.noticePosts[idx];
  }
  deleteNoticePost(id) {
    const db = this.read();
    if (!db.noticePosts) return false;
    const len = db.noticePosts.length;
    db.noticePosts = db.noticePosts.filter((p) => p.id !== id);
    if (db.noticePosts.length === len) return false;
    this.write(db);
    this.log("info", "admin", `Admin deleted notice id: ${id}`);
    return true;
  }
  // --- SUPPORT TICKETS ---
  getAllTickets() {
    const db = this.read();
    const tickets = db.supportTickets || [];
    return [...tickets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  getTicketsByUser(userId) {
    return this.getAllTickets().filter((t) => t.userId === userId);
  }
  insertTicket(ticket) {
    const db = this.read();
    if (!db.supportTickets) db.supportTickets = [];
    db.supportTickets.push(ticket);
    this.write(db);
    this.log("info", "system", `Support ticket submitted by ${ticket.userEmail}: [${ticket.category}] ${ticket.message.slice(0, 60)}`);
    return ticket;
  }
  updateTicket(id, updates) {
    const db = this.read();
    if (!db.supportTickets) db.supportTickets = [];
    const idx = db.supportTickets.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    db.supportTickets[idx] = { ...db.supportTickets[idx], ...updates, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    this.write(db);
    this.log("info", "admin", `Admin updated support ticket ${id} \u2192 status: ${db.supportTickets[idx].status}`);
    return db.supportTickets[idx];
  }
  deleteTicket(id) {
    const db = this.read();
    if (!db.supportTickets) return false;
    const len = db.supportTickets.length;
    db.supportTickets = db.supportTickets.filter((t) => t.id !== id);
    if (db.supportTickets.length === len) return false;
    this.write(db);
    return true;
  }
};
var dbInstance = new Database();

// server/residentialService.ts
var import_fflate = require("fflate");
var ResidentialService = class {
  static getConfig() {
    const settings = dbInstance.getApiSettings();
    const baseUrl = (settings.residentialApiUrl || "https://proxy-seller.com/personal/api/v1").replace(/\/+$/, "");
    const apiKey = (settings.residentialApiKey || "").trim();
    return { baseUrl, apiKey };
  }
  /** Parse strings like "$2.20" or "2.20" into a number. */
  static parseMoney(value) {
    if (!value) return null;
    const num = parseFloat(String(value).replace(/[^0-9.]/g, ""));
    return Number.isFinite(num) ? num : null;
  }
  static parseBytes(value) {
    if (value === void 0 || value === null || value === "") return null;
    const num = parseInt(String(value), 10);
    return Number.isFinite(num) ? num : null;
  }
  static {
    // Cache the package/consumption snapshot to stay well under Proxy-Seller's
    // 60 requests/minute limit — the public landing page can be hit frequently.
    this.infoCache = null;
  }
  static {
    this.INFO_TTL_MS = 5 * 60 * 1e3;
  }
  static {
    // live data: 5 min
    this.FALLBACK_TTL_MS = 15 * 60 * 1e3;
  }
  // after an error: retry after 15 min
  // ^ Long fallback avoids hammering Proxy-Seller during an outage or a rate-limit
  //   block (exceeding 60/min triggers a multi-hour restriction).
  /**
   * Fetches and normalises the residential package + consumption snapshot (cached).
   * Always resolves (never throws) so the public landing page stays resilient.
   */
  static async getInfo() {
    if (this.infoCache) {
      const ttl = this.infoCache.data.live ? this.INFO_TTL_MS : this.FALLBACK_TTL_MS;
      if (Date.now() - this.infoCache.at < ttl) return this.infoCache.data;
    }
    const data = await this.computeInfo();
    this.infoCache = { at: Date.now(), data };
    return data;
  }
  static async computeInfo() {
    const { baseUrl, apiKey } = this.getConfig();
    if (!apiKey) {
      return this.simulatedInfo();
    }
    try {
      const [pkgRes, consRes] = await Promise.all([
        fetch(`${baseUrl}/${apiKey}/resident/package`, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        }),
        fetch(`${baseUrl}/${apiKey}/resident/consumption`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({})
        })
      ]);
      const pkgBody = await pkgRes.json();
      const consBody = await consRes.json();
      if (pkgBody.status !== "success" || !pkgBody.data) {
        const msg = pkgBody.errors?.[0]?.message || `HTTP ${pkgRes.status}`;
        throw new Error(`/resident/package error: ${msg}`);
      }
      const pkg = pkgBody.data;
      const cons = consBody.status === "success" ? consBody.data : null;
      dbInstance.log(
        "info",
        "proxy",
        `Live residential data loaded. Package: ${pkg.package_key}, price/GB: ${cons?.price_per_gb ?? "n/a"}`
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
        isActive: typeof pkg.is_active === "boolean" ? pkg.is_active : null,
        autoRenew: typeof pkg.auto_renew === "boolean" ? pkg.auto_renew : null,
        packageKey: pkg.package_key ?? null
      };
    } catch (err) {
      dbInstance.log(
        "warning",
        "proxy",
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
  static async getAvailableStockGb() {
    const info = await this.getInfo();
    if (!info.live || info.trafficLeftBytes == null) {
      return { live: false, availableGb: Infinity, trafficLeftGb: Infinity };
    }
    const trafficLeftGb = info.trafficLeftBytes / 1e9;
    return { live: true, trafficLeftGb, availableGb: Math.max(0, trafficLeftGb) };
  }
  // --- CREATE-PROXY FORM OPTIONS -------------------------------------------
  /**
   * Options for the Create Proxy form, served by the backend so the frontend
   * holds no hardcoded lists. Ports max (1000) is the Proxy-Seller documented
   * limit; the default rotation is derived from the live package when available.
   */
  static async getProxyOptions() {
    let defaultMinutes = 10;
    try {
      const info = await this.getInfo();
      if (info.rotationSeconds != null && info.rotationSeconds > 0) {
        defaultMinutes = Math.max(0, Math.min(60, Math.round(info.rotationSeconds / 60)));
      }
    } catch {
    }
    return {
      protocols: [
        { value: "socks5", label: "SOCKS5" },
        { value: "http", label: "HTTP" }
      ],
      proxyTypes: [
        { value: "residential", label: "Residential (Rotating Pool)" },
        { value: "isp", label: "ISP (Static Residential)" }
      ],
      ports: { min: 1, max: 1e3, default: 1 },
      rotation: { minMinutes: 0, maxMinutes: 60, stepMinutes: 5, presetMinutes: [0, 10, 30], defaultMinutes }
    };
  }
  static {
    // --- GEO -----------------------------------------------------------------
    this.geoCache = null;
  }
  static {
    this.GEO_TTL_MS = 60 * 60 * 1e3;
  }
  static {
    // live tree: 1 hour
    this.GEO_FALLBACK_TTL_MS = 15 * 60 * 1e3;
  }
  // after an error: retry after 15 min
  /**
   * GET /resident/geo — full country/region/city/ISP tree (cached).
   * Falls back to a compact simulated tree when no key / on error.
   */
  static async getGeo() {
    const { baseUrl, apiKey } = this.getConfig();
    if (!apiKey) return { live: false, geo: this.simulatedGeo() };
    if (this.geoCache) {
      const ttl = this.geoCache.live ? this.GEO_TTL_MS : this.GEO_FALLBACK_TTL_MS;
      if (Date.now() - this.geoCache.at < ttl) {
        return { live: this.geoCache.live, geo: this.geoCache.data };
      }
    }
    try {
      const res = await fetch(`${baseUrl}/${apiKey}/resident/geo`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      const raw = new Uint8Array(await res.arrayBuffer());
      let parsed;
      if (raw[0] === 80 && raw[1] === 75) {
        const files = (0, import_fflate.unzipSync)(raw);
        const entry = Object.keys(files).find((n) => n.toLowerCase().endsWith(".json")) || Object.keys(files)[0];
        parsed = JSON.parse((0, import_fflate.strFromU8)(files[entry]));
      } else {
        parsed = JSON.parse((0, import_fflate.strFromU8)(raw));
      }
      const data = Array.isArray(parsed) ? parsed : parsed?.data;
      if (!Array.isArray(data)) {
        throw new Error(parsed?.errors?.[0]?.message || `HTTP ${res.status}`);
      }
      this.geoCache = { at: Date.now(), live: true, data };
      dbInstance.log("info", "proxy", `Loaded ${data.length} residential GEO countries from Proxy-Seller.`);
      return { live: true, geo: data };
    } catch (err) {
      dbInstance.log("warning", "proxy", `Residential GEO fetch failed, using simulation: ${err.message}`);
      const geo = this.simulatedGeo();
      this.geoCache = { at: Date.now(), live: false, data: geo };
      return { live: false, geo };
    }
  }
  static {
    // --- LIST CREATE / DELETE ------------------------------------------------
    // Residential gateway host used in customer connection strings. (Geo is
    // determined by the list login, not the host, so a single gateway serves all.)
    this.GATEWAY_HOST = "185.162.130.85";
  }
  static hostForCountry(_countryCode) {
    return this.GATEWAY_HOST;
  }
  /**
   * POST /resident/list/add — provision a geo-locked residential list.
   * Returns connectable credentials. Falls back to a local simulation without a key.
   *
   * `rotation`: -1 sticky, 0 per-request, 1..3600 seconds.
   */
  static async createList(params) {
    const { baseUrl, apiKey } = this.getConfig();
    const host = this.hostForCountry(params.country);
    const port = 1e4;
    const ports = Math.max(1, Math.min(1e3, Math.floor(params.ports || 1)));
    const useSubUser = !!params.packageKey && !params.packageKey.startsWith("sim_");
    const endpoint = useSubUser ? "residentsubuser/list/add" : "resident/list/add";
    if (apiKey) {
      try {
        const reqBody = {
          title: params.title,
          whitelist: "",
          geo: {
            country: params.country,
            region: params.region || "",
            city: params.city || "",
            isp: params.isp || ""
          },
          export: { ports, ext: "txt" },
          rotation: params.rotation
        };
        if (useSubUser) reqBody.package_key = params.packageKey;
        const res = await fetch(`${baseUrl}/${apiKey}/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reqBody)
        });
        const body = await res.json();
        if (body.status !== "success" || !body.data) {
          throw new Error(body?.errors?.[0]?.message || `HTTP ${res.status}`);
        }
        const d = body.data;
        dbInstance.log("info", "proxy", `Residential list created on Proxy-Seller. id=${d.id}, login=${d.login}`);
        return {
          id: String(d.id),
          login: d.login,
          password: d.password,
          host,
          port,
          country: d.geo?.country || params.country,
          region: d.geo?.region || params.region || "",
          city: d.geo?.city || params.city || "",
          isp: d.geo?.isp || params.isp || "",
          ports: d.export?.ports ?? ports,
          live: true
        };
      } catch (err) {
        dbInstance.log("error", "proxy", `Residential list/add failed: ${err.message}`);
        throw new Error(
          `Proxy could not be created right now (${err.message}). Please try again in a few minutes \u2014 no bandwidth has been used.`
        );
      }
    }
    await new Promise((r) => setTimeout(r, 400));
    const login = Math.random().toString(16).slice(2, 10);
    const password = Math.random().toString(36).slice(2, 10).toUpperCase();
    return {
      id: `sim_${Date.now()}_${Math.floor(Math.random() * 1e3)}`,
      login,
      password,
      host,
      port,
      country: params.country,
      region: params.region || "",
      city: params.city || "",
      isp: params.isp || "",
      ports,
      live: false
    };
  }
  /** DELETE a residential list by id (main account or a sub-user). No-op for simulated ids. */
  static async deleteList(listId, packageKey) {
    const { baseUrl, apiKey } = this.getConfig();
    const isRealId = /^\d+$/.test(listId);
    const useSubUser = !!packageKey && !packageKey.startsWith("sim_");
    const path3 = useSubUser ? "residentsubuser/list/delete" : "resident/list/delete";
    if (apiKey && isRealId) {
      try {
        const reqBody = { id: Number(listId) };
        if (useSubUser) reqBody.package_key = packageKey;
        const res = await fetch(`${baseUrl}/${apiKey}/${path3}?id=${Number(listId)}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reqBody)
        });
        const body = await res.json();
        if (body.status === "success") {
          dbInstance.log("info", "proxy", `Residential list ${listId} deleted from Proxy-Seller.`);
          return true;
        }
        dbInstance.log("warning", "proxy", `Residential list delete returned: ${JSON.stringify(body.errors || body)}`);
      } catch (err) {
        dbInstance.log("warning", "proxy", `Residential list delete failed: ${err.message}`);
      }
    }
    return true;
  }
  // --- SUB-USERS (per-customer reserved traffic allocation) -----------------
  /**
   * POST /residentsubuser/create — reserve `trafficBytes` from the reseller pool
   * for a customer. Returns the sub-user package key. Simulated without a key.
   */
  static async createSubUserPackage(params) {
    const { baseUrl, apiKey } = this.getConfig();
    const rotation = params.rotation ?? -1;
    const isLinkDate = params.isLinkDate ?? true;
    const trafficLimit = String(Math.max(1, Math.floor(params.trafficBytes)));
    if (apiKey) {
      try {
        const res = await fetch(`${baseUrl}/${apiKey}/residentsubuser/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_link_date: isLinkDate, rotation, traffic_limit: trafficLimit })
        });
        const body = await res.json();
        if (body.status === "success" && body.data?.package_key) {
          dbInstance.log("info", "proxy", `Sub-user package created: ${body.data.package_key} (limit ${trafficLimit} bytes)`);
          return { packageKey: body.data.package_key, live: true };
        }
        throw new Error(body?.errors?.[0]?.message || `HTTP ${res.status}`);
      } catch (err) {
        dbInstance.log("error", "proxy", `Sub-user package create failed: ${err.message}`);
        throw new Error(`Could not reserve traffic on Proxy-Seller: ${err.message}`);
      }
    }
    return { packageKey: `sim_pkg_${Date.now()}_${Math.floor(Math.random() * 1e3)}`, live: false };
  }
  /** DELETE /residentsubuser/delete — release a customer's reserved allocation. */
  static async deleteSubUserPackage(packageKey) {
    const { baseUrl, apiKey } = this.getConfig();
    if (!packageKey || packageKey.startsWith("sim_")) return true;
    if (apiKey) {
      try {
        const res = await fetch(`${baseUrl}/${apiKey}/residentsubuser/delete`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ package_key: packageKey })
        });
        const body = await res.json();
        if (body.status === "success") {
          dbInstance.log("info", "proxy", `Sub-user package ${packageKey} deleted.`);
          return true;
        }
        dbInstance.log("warning", "proxy", `Sub-user package delete returned: ${JSON.stringify(body.errors || body)}`);
      } catch (err) {
        dbInstance.log("warning", "proxy", `Sub-user package delete failed: ${err.message}`);
      }
    }
    return true;
  }
  static {
    // Real per-sub-user traffic usage from Proxy-Seller (cached ~60s to respect the rate limit).
    this.usageCache = null;
  }
  static async getSubUserUsage() {
    const { baseUrl, apiKey } = this.getConfig();
    if (!apiKey) return { live: false, usage: {} };
    if (this.usageCache && Date.now() - this.usageCache.at < 60 * 1e3) {
      return { live: true, usage: this.usageCache.data };
    }
    try {
      const res = await fetch(`${baseUrl}/${apiKey}/residentsubuser/packages`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(8e3)
      });
      const body = await res.json();
      const data = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : null;
      if (!data) throw new Error(body?.errors?.[0]?.message || `HTTP ${res.status}`);
      const usage = {};
      for (const p of data) {
        if (!p?.package_key) continue;
        usage[p.package_key] = {
          usedBytes: parseInt(p.traffic_usage, 10) || 0,
          limitBytes: parseInt(p.traffic_limit, 10) || 0
        };
      }
      this.usageCache = { at: Date.now(), data: usage };
      return { live: true, usage };
    } catch (err) {
      dbInstance.log("warning", "proxy", `Sub-user usage fetch failed: ${err.message}`);
      return { live: false, usage: {} };
    }
  }
  /** Compact simulated GEO tree (mirrors the real shape) for when no key is set. */
  static simulatedGeo() {
    return [
      {
        code: "US",
        name: "United States",
        regions: [
          { name: "California", cities: [
            { name: "Los Angeles", isps: ["Comcast Cable", "AT&T Internet"] },
            { name: "San Francisco", isps: ["Verizon Fios"] }
          ] },
          { name: "New York", cities: [
            { name: "New York", isps: ["Charter Spectrum", "Verizon Fios"] }
          ] }
        ]
      },
      {
        code: "GB",
        name: "United Kingdom",
        regions: [
          { name: "England", cities: [
            { name: "London", isps: ["BT Broadband", "Sky Broadband"] },
            { name: "Manchester", isps: ["Virgin Media"] }
          ] }
        ]
      },
      {
        code: "CA",
        name: "Canada",
        regions: [
          { name: "Alberta", cities: [
            { name: "Calgary", isps: ["Telus", "Shaw Communications"] },
            { name: "Edmonton", isps: ["Telus", "Shaw Communications"] }
          ] },
          { name: "British Columbia", cities: [
            { name: "Vancouver", isps: ["Telus", "Shaw Communications"] },
            { name: "Victoria", isps: ["Telus"] }
          ] },
          { name: "Manitoba", cities: [
            { name: "Winnipeg", isps: ["Bell MTS", "Shaw Communications"] }
          ] },
          { name: "New Brunswick", cities: [
            { name: "Fredericton", isps: ["Bell Aliant"] },
            { name: "Moncton", isps: ["Bell Aliant", "Rogers Communications"] }
          ] },
          { name: "Newfoundland and Labrador", cities: [
            { name: "St. John's", isps: ["Bell Aliant"] }
          ] },
          { name: "Northwest Territories", cities: [
            { name: "Yellowknife", isps: ["Northwestel"] }
          ] },
          { name: "Nova Scotia", cities: [
            { name: "Halifax", isps: ["Bell Aliant", "Eastlink"] }
          ] },
          { name: "Nunavut", cities: [
            { name: "Iqaluit", isps: ["Northwestel"] }
          ] },
          { name: "Ontario", cities: [
            { name: "Toronto", isps: ["Rogers Communications", "Bell Canada"] },
            { name: "Ottawa", isps: ["Rogers Communications", "Bell Canada"] }
          ] },
          { name: "Prince Edward Island", cities: [
            { name: "Charlottetown", isps: ["Bell Aliant"] }
          ] },
          { name: "Quebec", cities: [
            { name: "Montreal", isps: ["Bell Canada", "Videotron"] },
            { name: "Quebec City", isps: ["Videotron", "Bell Canada"] },
            { name: "Acton Vale", isps: ["Bell Canada"] }
          ] },
          { name: "Saskatchewan", cities: [
            { name: "Regina", isps: ["SaskTel"] },
            { name: "Saskatoon", isps: ["SaskTel", "Shaw Communications"] }
          ] },
          { name: "XX", cities: [
            { name: "unknown", isps: ["Bell Canada"] }
          ] },
          { name: "Yukon", cities: [
            { name: "Whitehorse", isps: ["Northwestel"] }
          ] }
        ]
      }
    ];
  }
  /**
   * High-fidelity fallback mirroring the shapes from the Proxy-Seller docs so the
   * pricing cards render believable numbers without a live key.
   */
  static simulatedInfo() {
    const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3);
    const dd = String(expiry.getDate()).padStart(2, "0");
    const mm = String(expiry.getMonth() + 1).padStart(2, "0");
    const yyyy = expiry.getFullYear();
    return {
      live: false,
      pricePerGb: 2.2,
      rotationSeconds: 60,
      trafficLimitBytes: 7516192768,
      // 7 GB
      trafficLeftBytes: 5368709120,
      // 5 GB
      trafficUsageBytes: 2147483648,
      // 2 GB
      ordersBytesFormatted: "7.0 GB",
      usedBytesFormatted: "2.0 GB",
      expiresAt: `${dd}.${mm}.${yyyy}`,
      isActive: true,
      autoRenew: false,
      packageKey: "sim-residential-pool"
    };
  }
};

// server/proxyService.ts
var ProxyService = class {
  /**
   * Provisions a residential proxy list on Proxy-Seller (or simulates one).
   */
  static async provisionUpstreamProxy(params) {
    const countryCode = (params.country || "US").toUpperCase();
    const displayCountry = params.countryName || countryCode;
    const rotationSeconds = params.rotationMinutes <= 0 ? -1 : Math.min(params.rotationMinutes * 60, 3600);
    dbInstance.log(
      "info",
      "proxy",
      `Provisioning residential proxy \u2014 ${displayCountry}${params.region ? "/" + params.region : ""}${params.city ? "/" + params.city : ""}${params.isp ? " via " + params.isp : ""}, ports=${params.ports || 1}, rotation=${rotationSeconds}s`
    );
    const title = `ProxyGPT ${displayCountry}${params.city ? " " + params.city : ""} #${Date.now().toString().slice(-5)}`;
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
    const newProxy = {
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
      status: "online",
      rotationMinutes: params.rotationMinutes,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      region: result.region || void 0,
      city: result.city || void 0,
      isp: result.isp || void 0,
      ports: result.ports,
      listId: result.id,
      subUserPackageKey: params.subUserPackageKey
    };
    dbInstance.insertProxy(newProxy);
    dbInstance.log(
      "info",
      "proxy",
      `Proxy allocation completed (${result.live ? "LIVE Proxy-Seller" : "local simulation"})! ${result.host}:${result.port} login=${result.login}`
    );
    return newProxy;
  }
  /**
   * Revokes a proxy — deletes the residential list upstream, then removes it locally.
   */
  static async revokeProxy(proxyId) {
    const proxies = dbInstance.getProxies();
    const target = proxies.find((p) => p.id === proxyId);
    if (!target) return false;
    dbInstance.log("info", "proxy", `Revoking proxy ${target.ip}:${target.port} (list ${target.listId || target.id})`);
    await ResidentialService.deleteList(target.listId || target.id, target.subUserPackageKey);
    dbInstance.deleteProxy(proxyId);
    dbInstance.log("info", "proxy", `Proxy ${target.ip}:${target.port} revoked and resources recycled.`);
    return true;
  }
};

// server/zinipayService.ts
var ZiniPayService = class {
  static getConfig() {
    const s = dbInstance.getPaymentSettings();
    const baseUrl = (s.zinipayBaseUrl || "https://api.zinipay.com").replace(/\/+$/, "");
    const apiKey = (s.zinipayApiKey || "").trim();
    const usdToBdt = s.zinipayUsdToBdt && s.zinipayUsdToBdt > 0 ? s.zinipayUsdToBdt : 120;
    return { baseUrl, apiKey, usdToBdt };
  }
  static isConfigured() {
    return !!this.getConfig().apiKey;
  }
  /** Convert a USD amount to the BDT integer amount ZiniPay expects. */
  static usdToBdt(amountUsd) {
    const { usdToBdt } = this.getConfig();
    return Math.max(1, Math.round(amountUsd * usdToBdt));
  }
  /** POST /v1/payment/create — returns the hosted payment URL + invoice id. */
  static async createInvoice(params) {
    const { baseUrl, apiKey } = this.getConfig();
    if (!apiKey) return { ok: false, message: "ZiniPay API key not configured." };
    try {
      const res = await fetch(`${baseUrl}/v1/payment/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "zini-api-key": apiKey },
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
      const data = await res.json();
      if (data?.status === true && data?.payment_url) {
        const invoiceId = String(data.payment_url).split("/").filter(Boolean).pop();
        dbInstance.log("info", "payment", `ZiniPay invoice created: ${invoiceId} | redirect=${params.redirectUrl} | webhook=${params.webhookUrl}`);
        return { ok: true, paymentUrl: data.payment_url, invoiceId };
      }
      dbInstance.log("warning", "payment", `ZiniPay create failed: ${data?.message || JSON.stringify(data).slice(0, 150)}`);
      return { ok: false, message: data?.message || "ZiniPay did not return a payment URL." };
    } catch (err) {
      dbInstance.log("error", "payment", `ZiniPay create error: ${err.message}`);
      return { ok: false, message: err.message };
    }
  }
  /** POST /v1/payment/verify — authoritative confirmation of a payment. */
  static async verifyInvoice(invoiceId) {
    const { baseUrl, apiKey } = this.getConfig();
    if (!apiKey) return { ok: false, completed: false, message: "ZiniPay API key not configured." };
    try {
      const res = await fetch(`${baseUrl}/v1/payment/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "zini-api-key": apiKey },
        body: JSON.stringify({ invoice_id: invoiceId })
      });
      const data = await res.json();
      const status = String(data?.status || "").toUpperCase();
      const completed = status === "COMPLETED" || status === "SUCCESS" || status === "PAID";
      return {
        ok: true,
        completed,
        status,
        transactionId: data?.transaction_id,
        paymentMethod: data?.payment_method,
        amount: typeof data?.amount === "number" ? data.amount : void 0
      };
    } catch (err) {
      dbInstance.log("error", "payment", `ZiniPay verify error: ${err.message}`);
      return { ok: false, completed: false, message: err.message };
    }
  }
};

// server/paystationService.ts
var PayStationService = class {
  static getConfig() {
    const s = dbInstance.getPaymentSettings();
    const baseUrl = (s.paystationBaseUrl || "https://api.paystation.com.bd").replace(/\/+$/, "");
    const merchantId = (s.paystationMerchantId || "").trim();
    const password = (s.paystationPassword || "").trim();
    const usdToBdt = s.paystationUsdToBdt && s.paystationUsdToBdt > 0 ? s.paystationUsdToBdt : s.zinipayUsdToBdt && s.zinipayUsdToBdt > 0 ? s.zinipayUsdToBdt : 120;
    return { baseUrl, merchantId, password, usdToBdt };
  }
  static isConfigured() {
    const { merchantId, password } = this.getConfig();
    return !!(merchantId && password);
  }
  /** Convert a USD amount to the integer BDT amount PayStation expects. */
  static usdToBdt(amountUsd) {
    const { usdToBdt } = this.getConfig();
    return Math.max(1, Math.round(amountUsd * usdToBdt));
  }
  /** Exchange merchantId + password for a short-lived bearer token. */
  static async getToken() {
    const { baseUrl, merchantId, password } = this.getConfig();
    if (!merchantId || !password) return null;
    try {
      const res = await fetch(`${baseUrl}/grant-token`, {
        method: "POST",
        headers: { merchantId, password },
        signal: AbortSignal.timeout(15e3)
      });
      const data = await res.json();
      if (data?.status === "success" && data?.token) return String(data.token);
      dbInstance.log("warning", "payment", `PayStation grant-token failed: ${data?.message || `HTTP ${res.status}`}`);
      return null;
    } catch (err) {
      dbInstance.log("error", "payment", `PayStation grant-token error: ${err.message}`);
      return null;
    }
  }
  /** Create a hosted-checkout invoice; returns the payment_url to redirect to. */
  static async createInvoice(params) {
    const { baseUrl } = this.getConfig();
    const token = await this.getToken();
    if (!token) return { ok: false, message: "PayStation authentication failed. Check Store ID / password." };
    const body = new URLSearchParams({
      invoice_number: params.invoiceNumber,
      currency: "BDT",
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
        method: "POST",
        headers: { token, "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(2e4)
      });
      const data = await res.json();
      if (String(data?.status_code) === "200" && data?.status === "success" && data?.payment_url) {
        return { ok: true, paymentUrl: String(data.payment_url), invoiceNumber: params.invoiceNumber };
      }
      dbInstance.log("warning", "payment", `PayStation create-payment failed: ${data?.message || `HTTP ${res.status}`}`);
      return { ok: false, message: data?.message || "PayStation could not create the payment." };
    } catch (err) {
      dbInstance.log("error", "payment", `PayStation create-payment error: ${err.message}`);
      return { ok: false, message: err.message };
    }
  }
  /** Authoritative status check for an invoice via /retrive-transaction. */
  static async verifyInvoice(invoiceNumber, trxId) {
    const { baseUrl } = this.getConfig();
    const token = await this.getToken();
    if (!token) return { ok: false, completed: false, message: "PayStation authentication failed." };
    const body = new URLSearchParams({ invoice_number: invoiceNumber, trx_id: trxId || "" });
    try {
      const res = await fetch(`${baseUrl}/retrive-transaction`, {
        method: "POST",
        headers: { token, "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(2e4)
      });
      const data = await res.json();
      if (data?.status !== "success" || !data?.data) {
        return { ok: false, completed: false, message: data?.message || "Transaction not found." };
      }
      const d = data.data;
      const trxStatus = String(d.trx_status || "").toLowerCase();
      const completed = ["success", "completed", "paid", "successful"].includes(trxStatus) || !!d.success_date_time && String(d.success_date_time).trim() !== "";
      return { ok: true, completed, trxStatus, trxId: d.trx_id || trxId, message: data.message };
    } catch (err) {
      dbInstance.log("error", "payment", `PayStation verify error: ${err.message}`);
      return { ok: false, completed: false, message: err.message };
    }
  }
};

// server/cryptomusService.ts
var import_node_crypto = __toESM(require("node:crypto"), 1);
var PAID_STATUSES = ["paid", "paid_over"];
var FAILED_STATUSES = ["fail", "cancel", "system_fail", "wrong_amount", "refund_process", "refund_paid"];
var CryptomusService = class {
  static getConfig() {
    const s = dbInstance.getPaymentSettings();
    const baseUrl = (s.cryptomusBaseUrl || "https://api.cryptomus.com").replace(/\/+$/, "");
    const merchantId = (s.cryptomusMerchantId || "").trim();
    const apiKey = (s.cryptomusApiKey || "").trim();
    return { baseUrl, merchantId, apiKey };
  }
  static isConfigured() {
    const { merchantId, apiKey } = this.getConfig();
    return !!(merchantId && apiKey);
  }
  /** Cryptomus request signature: md5( base64(json) + api_key ). */
  static sign(payload, apiKey) {
    const b64 = Buffer.from(payload).toString("base64");
    return import_node_crypto.default.createHash("md5").update(b64 + apiKey).digest("hex");
  }
  static async post(path3, body) {
    const { baseUrl, merchantId, apiKey } = this.getConfig();
    if (!merchantId || !apiKey) return null;
    const payload = JSON.stringify(body);
    try {
      const res = await fetch(`${baseUrl}${path3}`, {
        method: "POST",
        headers: {
          merchant: merchantId,
          sign: this.sign(payload, apiKey),
          "Content-Type": "application/json"
        },
        body: payload,
        signal: AbortSignal.timeout(2e4)
      });
      return await res.json();
    } catch (err) {
      dbInstance.log("error", "payment", `Cryptomus ${path3} error: ${err.message}`);
      return null;
    }
  }
  /** Create a hosted crypto invoice; returns the pay-page URL to redirect to. */
  static async createInvoice(params) {
    const data = await this.post("/v1/payment", {
      amount: params.amountUsd.toFixed(2),
      currency: "USD",
      order_id: params.orderId,
      url_callback: params.callbackUrl,
      url_return: params.returnUrl,
      url_success: params.successUrl
    });
    if (data?.state === 0 && data?.result?.url) {
      return { ok: true, url: String(data.result.url), uuid: data.result.uuid };
    }
    dbInstance.log("warning", "payment", `Cryptomus create failed: ${data?.message || JSON.stringify(data?.errors || data).slice(0, 150)}`);
    return { ok: false, message: data?.message || "Cryptomus could not create the payment." };
  }
  /** Authoritative status check for an order via /v1/payment/info. */
  static async verifyInvoice(orderId) {
    const data = await this.post("/v1/payment/info", { order_id: orderId });
    if (data?.state !== 0 || !data?.result) {
      return { ok: false, completed: false, message: data?.message || "Payment not found." };
    }
    const status = String(data.result.payment_status || "").toLowerCase();
    return { ok: true, completed: PAID_STATUSES.includes(status), status };
  }
  /** Is a payment_status a terminal failure (vs. still pending)? */
  static isFailedStatus(status) {
    return FAILED_STATUSES.includes(String(status || "").toLowerCase());
  }
};

// server/paymentService.ts
var PaymentService = class {
  /**
   * Generates a checkout link or session configuration depending on merchant selection.
   */
  /**
   * Evaluates a coupon against a base USD amount. Returns the discounted total.
   * `error` is set (and no discount applied) when the coupon is invalid/expired.
   */
  static evaluateCoupon(baseUsd, code) {
    const trimmed = (code || "").trim();
    if (!trimmed) return { finalUsd: baseUsd, discountUsd: 0 };
    const coupon = dbInstance.findCouponByCode(trimmed);
    if (!coupon) return { finalUsd: baseUsd, discountUsd: 0, error: "Invalid coupon code." };
    if (!coupon.isActive) return { finalUsd: baseUsd, discountUsd: 0, error: "This coupon is no longer active." };
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return { finalUsd: baseUsd, discountUsd: 0, error: "This coupon has reached its usage limit." };
    }
    let discount = coupon.type === "percent" ? baseUsd * (coupon.value / 100) : coupon.value;
    discount = Math.min(discount, baseUsd);
    discount = Math.round(discount * 100) / 100;
    const finalUsd = Math.max(0, Math.round((baseUsd - discount) * 100) / 100);
    return { finalUsd, discountUsd: discount, couponCode: coupon.code };
  }
  static async createCheckoutSession(params) {
    const settings = dbInstance.getPaymentSettings();
    const packages = dbInstance.getPackages();
    const pkg = packages.find((p) => p.id === params.packageId);
    if (!pkg) {
      throw new Error(`Invalid pricing package selected: ${params.packageId}`);
    }
    const couponEval = this.evaluateCoupon(pkg.priceUsd, params.couponCode);
    if (couponEval.error) {
      throw new Error(couponEval.error);
    }
    const finalUsd = couponEval.finalUsd;
    const stock = await ResidentialService.getAvailableStockGb();
    if (stock.live && stock.availableGb < pkg.bandwidthGb) {
      dbInstance.log(
        "warning",
        "payment",
        `Order blocked \u2014 insufficient residential stock. Requested ${pkg.bandwidthGb} GB, available (traffic_left) ${stock.trafficLeftGb.toFixed(2)} GB.`
      );
      throw new Error(
        stock.availableGb <= 0 ? "Sorry, our residential proxy stock is currently sold out. Please check back later." : `Sorry, only ${stock.availableGb.toFixed(1)} GB of residential stock is available right now \u2014 not enough for this ${pkg.bandwidthGb} GB plan. Please choose a smaller plan or check back later.`
      );
    }
    dbInstance.log(
      "info",
      "payment",
      `Initiating checkout intent for package '${pkg.name}' via ${params.gateway.toUpperCase()}`
    );
    const txnId = `txn_${Date.now()}_${Math.floor(Math.random() * 1e3)}`;
    const newOrder = {
      id: `ord_${Date.now()}_${Math.floor(Math.random() * 1e3)}`,
      userId: params.userId,
      packageId: pkg.id,
      packageName: pkg.name,
      bandwidthGb: pkg.bandwidthGb,
      bandwidthUsedGb: 0,
      priceUsd: finalUsd,
      status: "pending",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString()
      // 30 day validity
    };
    dbInstance.insertOrder(newOrder);
    const transaction = {
      id: txnId,
      userId: params.userId,
      userEmail: params.userEmail,
      orderId: newOrder.id,
      amountUsd: finalUsd,
      gateway: params.gateway,
      status: "pending",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      couponCode: couponEval.couponCode,
      discountUsd: couponEval.discountUsd || void 0
    };
    dbInstance.insertTransaction(transaction);
    if (finalUsd <= 0) {
      await this.completePaymentTransaction(txnId);
      dbInstance.log("info", "payment", `Free order via coupon ${couponEval.couponCode}: ${newOrder.id} activated.`);
      return {
        checkoutUrl: `${params.appUrl || ""}/?checkout=success`,
        transactionId: txnId,
        message: "Coupon covers the full amount \u2014 order activated.",
        external: true
      };
    }
    if (params.gateway === "credit_card" && ZiniPayService.isConfigured() && params.appUrl) {
      const amountBdt = ZiniPayService.usdToBdt(finalUsd);
      const invoice = await ZiniPayService.createInvoice({
        name: params.userEmail.split("@")[0] || "Customer",
        email: params.userEmail,
        amountBdt,
        // No query string on these URLs: ZiniPay appends ?invoice_id=&status= itself.
        redirectUrl: `${params.appUrl}/api/payment/zinipay/return/${txnId}`,
        cancelUrl: `${params.appUrl}/api/payment/zinipay/cancel/${txnId}`,
        webhookUrl: `${params.appUrl}/api/payment/zinipay/webhook`,
        metadata: { txnId, orderId: newOrder.id, packageId: pkg.id, userId: params.userId }
      });
      if (invoice.ok && invoice.paymentUrl) {
        dbInstance.updateTransaction(txnId, { providerInvoiceId: invoice.invoiceId });
        dbInstance.log("info", "payment", `ZiniPay checkout ready: txn ${txnId}, invoice ${invoice.invoiceId}, amount BDT ${amountBdt}`);
        return {
          checkoutUrl: invoice.paymentUrl,
          transactionId: txnId,
          message: "Redirecting to ZiniPay secure checkout.",
          external: true
        };
      }
      throw new Error(invoice.message || "ZiniPay checkout could not be created.");
    }
    if (params.gateway === "paystation" && PayStationService.isConfigured() && params.appUrl) {
      const amountBdt = PayStationService.usdToBdt(finalUsd);
      const invoiceNumber = txnId;
      const invoice = await PayStationService.createInvoice({
        invoiceNumber,
        name: params.userEmail.split("@")[0] || "Customer",
        phone: (params.custPhone || "").trim() || "01700000000",
        email: params.userEmail,
        address: "Bangladesh",
        amountBdt,
        reference: newOrder.id,
        callbackUrl: `${params.appUrl}/api/payment/paystation/callback`
      });
      if (invoice.ok && invoice.paymentUrl) {
        dbInstance.updateTransaction(txnId, { providerInvoiceId: invoiceNumber });
        dbInstance.log("info", "payment", `PayStation checkout ready: txn ${txnId}, amount BDT ${amountBdt}`);
        return {
          checkoutUrl: invoice.paymentUrl,
          transactionId: txnId,
          message: "Redirecting to PayStation secure checkout.",
          external: true
        };
      }
      throw new Error(invoice.message || "PayStation checkout could not be created.");
    }
    if (params.gateway === "cryptomus" && CryptomusService.isConfigured() && params.appUrl) {
      const invoice = await CryptomusService.createInvoice({
        orderId: txnId,
        // our txn id doubles as Cryptomus order_id
        amountUsd: finalUsd,
        callbackUrl: `${params.appUrl}/api/payment/cryptomus/callback`,
        returnUrl: `${params.appUrl}/api/payment/cryptomus/return/${txnId}`,
        successUrl: `${params.appUrl}/api/payment/cryptomus/return/${txnId}`
      });
      if (invoice.ok && invoice.url) {
        dbInstance.updateTransaction(txnId, { providerInvoiceId: txnId, providerTxnId: invoice.uuid });
        dbInstance.log("info", "payment", `Cryptomus checkout ready: txn ${txnId}, $${finalUsd}`);
        return {
          checkoutUrl: invoice.url,
          transactionId: txnId,
          message: "Redirecting to Cryptomus secure crypto checkout.",
          external: true
        };
      }
      throw new Error(invoice.message || "Cryptomus checkout could not be created.");
    }
    const checkoutUrl = `/checkout-simulation?transactionId=${txnId}&orderId=${newOrder.id}&amount=${finalUsd}&gateway=${params.gateway}`;
    dbInstance.log(
      "info",
      "payment",
      `Checkout session pre-allocated: TransID: ${txnId}, OrderID: ${newOrder.id} for $${finalUsd}`
    );
    return {
      checkoutUrl,
      transactionId: txnId,
      message: "Pending ledger transaction generated. Proceed to checkout URL to complete payment."
    };
  }
  /**
   * Starts a WALLET TOP-UP: creates a `purpose: 'wallet'` transaction (no order)
   * and routes it to the chosen gateway. On payment completion the shared
   * callbacks credit the user's wallet balance (see completePaymentTransaction).
   */
  static async createWalletTopupSession(params) {
    const amountUsd = Math.round((params.amountUsd || 0) * 100) / 100;
    if (!amountUsd || amountUsd < 1) throw new Error("Minimum top-up amount is $1.");
    if (amountUsd > 1e4) throw new Error("Top-up amount is too large.");
    const txnId = `txn_${Date.now()}_${Math.floor(Math.random() * 1e3)}`;
    const transaction = {
      id: txnId,
      userId: params.userId,
      userEmail: params.userEmail,
      orderId: "",
      amountUsd,
      gateway: params.gateway,
      status: "pending",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      purpose: "wallet"
    };
    dbInstance.insertTransaction(transaction);
    if (params.gateway === "credit_card" && ZiniPayService.isConfigured()) {
      const amountBdt = ZiniPayService.usdToBdt(amountUsd);
      const invoice = await ZiniPayService.createInvoice({
        name: params.userEmail.split("@")[0] || "Customer",
        email: params.userEmail,
        amountBdt,
        redirectUrl: `${params.appUrl}/api/payment/zinipay/return/${txnId}`,
        cancelUrl: `${params.appUrl}/api/payment/zinipay/cancel/${txnId}`,
        webhookUrl: `${params.appUrl}/api/payment/zinipay/webhook`,
        metadata: { txnId, purpose: "wallet", userId: params.userId }
      });
      if (invoice.ok && invoice.paymentUrl) {
        dbInstance.updateTransaction(txnId, { providerInvoiceId: invoice.invoiceId });
        return { checkoutUrl: invoice.paymentUrl, transactionId: txnId, external: true };
      }
      throw new Error(invoice.message || "ZiniPay top-up could not be created.");
    }
    if (params.gateway === "paystation" && PayStationService.isConfigured()) {
      const invoice = await PayStationService.createInvoice({
        invoiceNumber: txnId,
        name: params.userEmail.split("@")[0] || "Customer",
        phone: (params.custPhone || "").trim() || "01700000000",
        email: params.userEmail,
        address: "Bangladesh",
        amountBdt: PayStationService.usdToBdt(amountUsd),
        reference: "wallet-topup",
        callbackUrl: `${params.appUrl}/api/payment/paystation/callback`
      });
      if (invoice.ok && invoice.paymentUrl) {
        dbInstance.updateTransaction(txnId, { providerInvoiceId: txnId });
        return { checkoutUrl: invoice.paymentUrl, transactionId: txnId, external: true };
      }
      throw new Error(invoice.message || "PayStation top-up could not be created.");
    }
    if (params.gateway === "cryptomus" && CryptomusService.isConfigured()) {
      const invoice = await CryptomusService.createInvoice({
        orderId: txnId,
        amountUsd,
        callbackUrl: `${params.appUrl}/api/payment/cryptomus/callback`,
        returnUrl: `${params.appUrl}/api/payment/cryptomus/return/${txnId}`,
        successUrl: `${params.appUrl}/api/payment/cryptomus/return/${txnId}`
      });
      if (invoice.ok && invoice.url) {
        dbInstance.updateTransaction(txnId, { providerInvoiceId: txnId, providerTxnId: invoice.uuid });
        return { checkoutUrl: invoice.url, transactionId: txnId, external: true };
      }
      throw new Error(invoice.message || "Cryptomus top-up could not be created.");
    }
    throw new Error("This payment method is not available for top-up right now.");
  }
  /**
   * Pays for a package straight from the user's wallet balance: debits the
   * wallet, creates an active order, and reserves the Proxy-Seller allocation.
   */
  static async payFromWallet(params) {
    const pkg = dbInstance.getPackages().find((p) => p.id === params.packageId);
    if (!pkg) throw new Error(`Invalid pricing package selected: ${params.packageId}`);
    const couponEval = this.evaluateCoupon(pkg.priceUsd, params.couponCode);
    if (couponEval.error) throw new Error(couponEval.error);
    const finalUsd = couponEval.finalUsd;
    const stock = await ResidentialService.getAvailableStockGb();
    if (stock.live && stock.availableGb < pkg.bandwidthGb) {
      throw new Error(stock.availableGb <= 0 ? "Sorry, our residential proxy stock is currently sold out. Please check back later." : `Sorry, only ${stock.availableGb.toFixed(1)} GB of residential stock is available right now.`);
    }
    const debit = dbInstance.debitWallet(params.userId, finalUsd, `Purchase: ${pkg.name} (${pkg.bandwidthGb} GB)`);
    if (!debit.ok) throw new Error("Insufficient wallet balance. Please top up your wallet first.");
    const newOrder = {
      id: `ord_${Date.now()}_${Math.floor(Math.random() * 1e3)}`,
      userId: params.userId,
      packageId: pkg.id,
      packageName: pkg.name,
      bandwidthGb: pkg.bandwidthGb,
      bandwidthUsedGb: 0,
      priceUsd: finalUsd,
      status: "active",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString()
    };
    dbInstance.insertOrder(newOrder);
    const txnId = `txn_${Date.now()}_${Math.floor(Math.random() * 1e3)}`;
    dbInstance.insertTransaction({
      id: txnId,
      userId: params.userId,
      userEmail: params.userEmail,
      orderId: newOrder.id,
      amountUsd: finalUsd,
      gateway: "crypto",
      status: "completed",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      paymentMethod: "wallet",
      couponCode: couponEval.couponCode,
      discountUsd: couponEval.discountUsd || void 0
    });
    if (couponEval.couponCode) {
      const coupon = dbInstance.findCouponByCode(couponEval.couponCode);
      if (coupon) dbInstance.updateCoupon(coupon.id, { usedCount: coupon.usedCount + 1 });
    }
    try {
      const trafficBytes = Math.round(newOrder.bandwidthGb * 1e3 * 1e3 * 1e3);
      const sub = await ResidentialService.createSubUserPackage({ trafficBytes });
      dbInstance.updateOrder(newOrder.id, { subUserPackageKey: sub.packageKey });
    } catch (e) {
      console.error("Failed to reserve sub-user allocation (wallet pay): ", e);
    }
    dbInstance.log("info", "payment", `Order ${newOrder.id} paid from wallet ($${finalUsd}).`);
    return { ok: true, orderId: newOrder.id };
  }
  /**
   * Confirms a ZiniPay payment by invoice id: verifies with ZiniPay (authoritative),
   * then activates the order. Called from the webhook and the redirect-return route.
   */
  static async completePaymentByInvoiceId(invoiceId) {
    const txn = dbInstance.getTransactions().find((t) => t.providerInvoiceId === invoiceId);
    if (!txn) {
      dbInstance.log("warning", "payment", `ZiniPay callback: no transaction for invoice ${invoiceId}`);
      return { ok: false };
    }
    if (txn.status === "completed") return { ok: true, orderId: txn.orderId };
    const verify = await ZiniPayService.verifyInvoice(invoiceId);
    if (!verify.completed) {
      dbInstance.log("warning", "payment", `ZiniPay invoice ${invoiceId} not completed (status=${verify.status ?? "unknown"}).`);
      return { ok: false, orderId: txn.orderId };
    }
    dbInstance.updateTransaction(txn.id, { paymentMethod: verify.paymentMethod, providerTxnId: verify.transactionId });
    const done = await this.completePaymentTransaction(txn.id);
    return { ok: done, orderId: txn.orderId };
  }
  /**
   * Confirms a PayStation payment by invoice number: verifies via
   * /retrive-transaction (authoritative), then activates the order. Called from
   * the callback route.
   */
  static async completePayStationByInvoice(invoiceNumber, trxId) {
    const txn = dbInstance.getTransactions().find((t) => t.providerInvoiceId === invoiceNumber);
    if (!txn) {
      dbInstance.log("warning", "payment", `PayStation callback: no transaction for invoice ${invoiceNumber}`);
      return { ok: false };
    }
    if (txn.status === "completed") return { ok: true, orderId: txn.orderId, trxStatus: "success" };
    const verify = await PayStationService.verifyInvoice(invoiceNumber, trxId);
    if (!verify.completed) {
      dbInstance.log("warning", "payment", `PayStation invoice ${invoiceNumber} not completed (trx_status=${verify.trxStatus ?? "unknown"}).`);
      return { ok: false, orderId: txn.orderId, trxStatus: verify.trxStatus };
    }
    dbInstance.updateTransaction(txn.id, { paymentMethod: "paystation", providerTxnId: verify.trxId });
    const done = await this.completePaymentTransaction(txn.id);
    return { ok: done, orderId: txn.orderId, trxStatus: verify.trxStatus };
  }
  /**
   * Confirms a Cryptomus payment by order id: verifies via /v1/payment/info
   * (authoritative), then activates the order. Called from the callback route.
   */
  static async completeCryptomusByOrder(orderId) {
    const txn = dbInstance.getTransactions().find((t) => t.providerInvoiceId === orderId);
    if (!txn) {
      dbInstance.log("warning", "payment", `Cryptomus callback: no transaction for order ${orderId}`);
      return { ok: false };
    }
    if (txn.status === "completed") return { ok: true, orderId: txn.orderId, status: "paid" };
    const verify = await CryptomusService.verifyInvoice(orderId);
    if (!verify.completed) {
      dbInstance.log("warning", "payment", `Cryptomus order ${orderId} not completed (status=${verify.status ?? "unknown"}).`);
      return { ok: false, orderId: txn.orderId, status: verify.status };
    }
    dbInstance.updateTransaction(txn.id, { paymentMethod: "cryptomus" });
    const done = await this.completePaymentTransaction(txn.id);
    return { ok: done, orderId: txn.orderId, status: verify.status };
  }
  /**
   * Finalizes pending transaction. Triggered either by simulation or real webhooks.
   */
  static async completePaymentTransaction(transactionId) {
    const db = dbInstance;
    const txns = db.getTransactions();
    const txnIdx = txns.findIndex((t) => t.id === transactionId);
    if (txnIdx === -1) {
      db.log("error", "payment", `Completed transaction request failed: Transaction ID ${transactionId} not found.`);
      return false;
    }
    const txn = txns[txnIdx];
    if (txn.status === "completed") return true;
    txn.status = "completed";
    db.log("info", "payment", `Payment verified successfully for Transaction: ${transactionId} via ${txn.gateway.toUpperCase()}`);
    if (txn.purpose === "wallet") {
      db.updateTransaction(txn.id, { status: "completed" });
      db.creditWallet(txn.userId, txn.amountUsd, `Wallet top-up via ${txn.gateway}`);
      return true;
    }
    db.updateOrder(txn.orderId, { status: "active" });
    db.log("info", "payment", `Proxy allocation unlocked. Package is now active on order: ${txn.orderId}`);
    if (txn.couponCode) {
      const coupon = db.findCouponByCode(txn.couponCode);
      if (coupon) db.updateCoupon(coupon.id, { usedCount: coupon.usedCount + 1 });
    }
    try {
      const order = db.getOrders().find((o) => o.id === txn.orderId);
      if (order && !order.subUserPackageKey) {
        const trafficBytes = Math.round(order.bandwidthGb * 1e3 * 1e3 * 1e3);
        const sub = await ResidentialService.createSubUserPackage({ trafficBytes });
        db.updateOrder(order.id, { subUserPackageKey: sub.packageKey });
        db.log(
          "info",
          "proxy",
          `Reserved ${order.bandwidthGb}GB for order ${order.id} as sub-user ${sub.packageKey} (${sub.live ? "live" : "simulated"})`
        );
      }
    } catch (e) {
      console.error("Failed to reserve sub-user allocation: ", e);
    }
    return true;
  }
};

// server/ltesocksService.ts
var LTESocksService = class {
  static getConfig() {
    const s = dbInstance.getPaymentSettings();
    const baseUrl = (s.ltesocksBaseUrl || "https://api.ltesocks.io/v2").replace(/\/+$/, "");
    let apiKey = (s.ltesocksApiKey || "").trim();
    if (apiKey && !/^bearer\s/i.test(apiKey)) apiKey = `Bearer ${apiKey}`;
    const divisor = s.ltesocksPriceDivisor && s.ltesocksPriceDivisor > 0 ? s.ltesocksPriceDivisor : 100;
    return { baseUrl, apiKey, divisor };
  }
  static isConfigured() {
    return !!this.getConfig().apiKey.replace(/^bearer\s*/i, "").trim();
  }
  static async req(method, path3, body) {
    const { baseUrl, apiKey } = this.getConfig();
    if (!apiKey) throw new Error("LTESocks API key is not configured.");
    const res = await fetch(`${baseUrl}${path3}`, {
      method,
      headers: { Authorization: apiKey, "Content-Type": "application/json", "Accept-Language": "en" },
      body: body !== void 0 ? JSON.stringify(body) : void 0,
      signal: AbortSignal.timeout(2e4)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.error) {
      throw new Error(data?.error || `LTESocks ${path3} failed (HTTP ${res.status}).`);
    }
    return data;
  }
  /** Reseller account info (includes LTESocks balance). */
  static async getUser() {
    const d = await this.req("GET", "/user");
    return { login: d.login, balance: d.balance, portsCount: d.portsCount, portsLimit: d.portsLimit };
  }
  /** Available mobile plans, prices converted to USD (pass-through). */
  static async getPlans() {
    const { divisor } = this.getConfig();
    const raw = await this.req("GET", "/plans");
    const list = Array.isArray(raw) ? raw : raw.data || raw.plans || [];
    return list.filter((p) => p && p.available !== false).map((p) => ({
      id: p.id,
      name: p.name,
      countryCode: p.countryCode || "",
      available: p.available !== false,
      availablePorts: p.availablePorts || 0,
      vpnAccess: !!p.vpnAccess,
      tarifications: (p.tarifications || []).map((t) => ({
        time: t.time,
        trafficMb: t.traffic,
        priceRaw: t.price,
        priceUsd: Math.round(t.price / divisor * 100) / 100
      }))
    }));
  }
  /** Map a raw LTESocks port into normalized connection details. */
  static mapPort(p) {
    const creds = p.credentials || {};
    const ipEntry = Array.isArray(creds.ip) ? creds.ip[0] : creds.ip || p.ip;
    const password = Array.isArray(creds.password) ? creds.password[0] : creds.password || "";
    let host = p.ip, portNum = p.port;
    if (typeof ipEntry === "string" && ipEntry.includes(":")) {
      const [h, pt] = ipEntry.split(":");
      host = h || host;
      portNum = pt || portNum;
    } else if (ipEntry && typeof ipEntry === "object") {
      host = ipEntry.ip || ipEntry.host || host;
      portNum = ipEntry.port || portNum;
    }
    return {
      portId: String(p.id || p.portId || p.port || ""),
      ip: String(host || ""),
      port: String(portNum || ""),
      username: String(creds.login || p.login || "" || ""),
      password: String(password || ""),
      status: String(p.status || "active"),
      resetToken: p.resetToken,
      raw: p
    };
  }
  /** Order a new port from a plan + tarification. Costs the LTESocks balance. */
  static async orderPort(planId, tarification) {
    const d = await this.req("POST", "/ports/order", { plan: planId, tarification });
    const port = d?.data || d?.port || d;
    return this.mapPort(port);
  }
  static async getPort(portId) {
    const d = await this.req("GET", `/ports/${portId}`);
    return this.mapPort(d?.data || d);
  }
  /** Rotate the mobile IP for a port. */
  static async resetPort(portId) {
    await this.req("POST", `/ports/${portId}/reset`, {});
    return true;
  }
  static async deletePort(portId) {
    try {
      await this.req("POST", `/ports/${portId}/delete`, {});
    } catch {
      await this.req("DELETE", `/ports/${portId}`);
    }
    return true;
  }
};

// server/app.ts
if (process.env.NODE_ENV === "production") {
  import_node_dns.default.setDefaultResultOrder("ipv6first");
}
import_dotenv.default.config();
var app = (0, import_express.default)();
app.use(import_express.default.json());
app.use(import_express.default.urlencoded({ extended: true }));
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Access denied. No authorization token provided." });
  }
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [userId, role, email] = decoded.split(":");
    if (!userId || !role) {
      throw new Error("Malformed auth token.");
    }
    const users = dbInstance.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) {
      return res.status(403).json({ error: "Session expired or user not found." });
    }
    if (!user.isActive) {
      return res.status(403).json({ error: "Your account is currently blocked by an administrator." });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired security token." });
  }
}
function generateToken(user) {
  const payload = `${user.id}:${user.role}:${user.email}`;
  return Buffer.from(payload).toString("base64");
}
function publicBaseUrl(req) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, "");
  const proto = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.headers["x-forwarded-host"] || req.get("host");
  return `${proto}://${host}`;
}
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", database: "online", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Please enter all fields (Name, Email, Password)" });
  }
  const users = dbInstance.getUsers();
  const existingUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: "An account with this email already exists." });
  }
  const isFirstUserAdmin = users.length === 0;
  const newUser = {
    id: `usr_${Date.now()}`,
    email: email.toLowerCase(),
    name,
    role: isFirstUserAdmin ? "admin" : "user",
    isActive: true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  dbInstance.insertUser(newUser);
  const token = generateToken(newUser);
  res.status(201).json({
    user: newUser,
    token
  });
});
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Please enter both Email and Password." });
  }
  const users = dbInstance.getUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(400).json({ error: "Invalid credentials. No user found with this email." });
  }
  if (user.id === "usr_admin") {
    const adminPass = user.password || "admin123";
    if (password !== adminPass) {
      return res.status(400).json({ error: "Incorrect password for admin user." });
    }
  } else {
    const userWithPass = user;
    if (userWithPass.password && userWithPass.password !== password) {
      return res.status(400).json({ error: "Incorrect password. Please try again." });
    }
  }
  if (!user.isActive) {
    return res.status(403).json({ error: "Your account is suspended. Contact support." });
  }
  const token = generateToken(user);
  dbInstance.log("info", "auth", `User logged in successfully: ${user.name} (${user.email})`, req.ip);
  res.json({
    user,
    token
  });
});
app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Please enter your email address." });
  }
  const users = dbInstance.getUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user) {
    return res.status(400).json({ error: "No registered account found with this email." });
  }
  if (user.id === "usr_admin") {
    return res.json({
      success: true,
      message: 'Password Recovery: The administrator account has a fixed password. Your password is "admin123".'
    });
  }
  return res.json({
    success: true,
    message: "Password Recovery: For standard user accounts, passwordless login is enabled. You can log in using any password of your choice!"
  });
});
app.get("/api/auth/me", authenticateToken, (req, res) => {
  res.json({ user: req.user });
});
app.put("/api/auth/profile", authenticateToken, (req, res) => {
  const { name, profilePicture, password } = req.body;
  const updates = {};
  if (name && typeof name === "string" && name.trim().length > 0) updates.name = name.trim();
  if (profilePicture !== void 0) updates.profilePicture = profilePicture;
  if (password && typeof password === "string" && password.trim().length > 0) {
    updates.password = password.trim();
  }
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No fields to update." });
  const user = dbInstance.updateUser(req.user.id, updates);
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ user });
});
app.post("/api/auth/google", async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ error: "Missing Google credential." });
  }
  const clientId = (dbInstance.getWebsiteSettings().googleClientId || "").trim();
  if (!clientId) {
    return res.status(400).json({ error: "Google Sign-In is not configured. Set the Google Client ID in Admin settings." });
  }
  let payload;
  try {
    const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    payload = await r.json();
    if (!r.ok || payload.error) throw new Error(payload.error_description || "Invalid token");
  } catch (e) {
    dbInstance.log("warning", "auth", `Google token verification failed: ${e.message}`, req.ip);
    return res.status(401).json({ error: "Google authentication failed. Please try again." });
  }
  const issuers = ["accounts.google.com", "https://accounts.google.com"];
  if (payload.aud !== clientId) {
    return res.status(401).json({ error: "Google token was issued for a different app." });
  }
  if (!issuers.includes(payload.iss)) {
    return res.status(401).json({ error: "Invalid Google token issuer." });
  }
  if (payload.email_verified !== "true" && payload.email_verified !== true) {
    return res.status(401).json({ error: "Your Google email is not verified." });
  }
  const email = String(payload.email || "").toLowerCase();
  if (!email) {
    return res.status(400).json({ error: "Google account has no email." });
  }
  const name = payload.name || payload.given_name || email.split("@")[0];
  let user = dbInstance.getUsers().find((u) => u.email.toLowerCase() === email);
  if (!user) {
    user = {
      id: `usr_g_${Date.now()}`,
      email,
      name,
      role: "user",
      isActive: true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    dbInstance.insertUser(user);
    dbInstance.log("info", "auth", `Google user registered: ${name} (${email})`, req.ip);
  } else {
    dbInstance.log("info", "auth", `Google user signed in: ${name} (${email})`, req.ip);
  }
  if (!user.isActive) {
    return res.status(403).json({ error: "Your account is currently blocked by an administrator." });
  }
  const token = generateToken(user);
  res.json({ user, token });
});
app.get("/api/settings/public", (req, res) => {
  res.json({
    website: dbInstance.getWebsiteSettings(),
    countries: dbInstance.getCountries().filter((c) => c.isEnabled),
    gateways: dbInstance.getPaymentSettings().activeGateways,
    zinipayEnabled: dbInstance.getPaymentSettings().zinipayEnabled === true
  });
});
app.get("/api/settings/packages", (req, res) => {
  res.json({ packages: dbInstance.getPackages().filter((p) => p.isActive) });
});
app.get("/api/settings/residential", async (req, res) => {
  try {
    const info = await ResidentialService.getInfo();
    res.json(info);
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to load residential package data." });
  }
});
function checkProxySingleTarget(protocol, ip, port, user, pass, targetHost = "ident.me", targetPort = 80) {
  if (protocol === "socks5") {
    return new Promise((resolve) => {
      const socket = new import_node_net.default.Socket();
      socket.setTimeout(2500);
      socket.connect(port, ip, () => {
        socket.write(Buffer.from([5, 2, 0, 2]));
      });
      let state = "greeting";
      socket.on("data", (data) => {
        try {
          if (state === "greeting") {
            if (data[0] !== 5) {
              socket.destroy();
              return resolve(false);
            }
            const method = data[1];
            if (method === 0) {
              state = "connect";
              sendSocks5Connect(socket, targetHost, targetPort);
            } else if (method === 2 && user && pass) {
              state = "auth";
              const uLen = user.length;
              const pLen = pass.length;
              const authReq = Buffer.alloc(3 + uLen + pLen);
              authReq[0] = 1;
              authReq[1] = uLen;
              authReq.write(user, 2, uLen, "ascii");
              authReq[2 + uLen] = pLen;
              authReq.write(pass, 3 + uLen, pLen, "ascii");
              socket.write(authReq);
            } else {
              socket.destroy();
              resolve(false);
            }
          } else if (state === "auth") {
            if (data[0] === 1 && data[1] === 0) {
              state = "connect";
              sendSocks5Connect(socket, targetHost, targetPort);
            } else {
              socket.destroy();
              resolve(false);
            }
          } else if (state === "connect") {
            if (data[0] === 5 && data[1] === 0) {
              socket.destroy();
              resolve(true);
            } else {
              socket.destroy();
              resolve(false);
            }
          }
        } catch {
          socket.destroy();
          resolve(false);
        }
      });
      socket.on("error", () => {
        resolve(false);
      });
      socket.on("timeout", () => {
        socket.destroy();
        resolve(false);
      });
    });
  } else {
    return new Promise((resolve) => {
      const options = {
        host: ip,
        port,
        path: `http://${targetHost}/`,
        method: "GET",
        headers: {
          Host: targetHost,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }
      };
      if (user && pass) {
        options.headers["Proxy-Authorization"] = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
      }
      const req = import_node_http.default.request(options, (res) => {
        if (res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
      req.on("error", () => {
        resolve(false);
      });
      req.setTimeout(2500, () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    });
  }
}
function sendSocks5Connect(sock, host, port) {
  const hostBuf = Buffer.from(host, "ascii");
  const req = Buffer.alloc(6 + hostBuf.length);
  req[0] = 5;
  req[1] = 1;
  req[2] = 0;
  req[3] = 3;
  req[4] = hostBuf.length;
  hostBuf.copy(req, 5);
  req.writeUInt16BE(port, 5 + hostBuf.length);
  sock.write(req);
}
async function checkProxyStatus(proxy) {
  if (proxy.id.startsWith("sim_")) {
    return !(dbInstance.getApiSettings().residentialApiKey || "").trim();
  }
  if (proxy.createdAt) {
    const ageMs = Date.now() - new Date(proxy.createdAt).getTime();
    if (ageMs < 6e5) {
      return true;
    }
  }
  const { ip, port, username, passwordHash, protocol } = proxy;
  let success = await checkProxySingleTarget(protocol, ip, port, username, passwordHash, "ident.me", 80);
  if (success) return true;
  success = await checkProxySingleTarget(protocol, ip, port, username, passwordHash, "icanhazip.com", 80);
  if (success) return true;
  return false;
}
app.get("/api/proxy/my-proxies", authenticateToken, async (req, res) => {
  const allProxies = dbInstance.getProxies();
  const userProxies = allProxies.filter((p) => p.userId === req.user.id);
  const checkedProxies = await Promise.all(userProxies.map(async (p) => {
    try {
      const isOnline = await checkProxyStatus(p);
      return { ...p, status: isOnline ? "online" : "offline" };
    } catch {
      return { ...p, status: "offline" };
    }
  }));
  res.json({ proxies: checkedProxies });
});
app.get("/api/proxy/orders", authenticateToken, (req, res) => {
  const allOrders = dbInstance.getOrders();
  const userOrders = allOrders.filter((o) => o.userId === req.user.id);
  res.json({ orders: userOrders });
});
app.get("/api/proxy/residential/geo", authenticateToken, async (req, res) => {
  try {
    const [{ live, geo }, options] = await Promise.all([
      ResidentialService.getGeo(),
      ResidentialService.getProxyOptions()
    ]);
    res.json({ live, geo, options });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to load residential GEO data." });
  }
});
app.get("/api/proxy/usage", authenticateToken, async (req, res) => {
  const orders = dbInstance.getOrders().filter((o) => o.userId === req.user.id && o.status === "active");
  const { live, usage } = await ResidentialService.getSubUserUsage();
  const GB = 1e3 * 1e3 * 1e3;
  let usedBytes = 0, limitBytes = 0;
  const perOrder = orders.map((o) => {
    const u = o.subUserPackageKey ? usage[o.subUserPackageKey] : void 0;
    const ub = u ? u.usedBytes : 0;
    const lb = Math.round(o.bandwidthGb * GB);
    usedBytes += ub;
    limitBytes += lb;
    return {
      orderId: o.id,
      packageName: o.packageName,
      usedGb: Math.round(ub / GB * 1e3) / 1e3,
      limitGb: Math.round(lb / GB * 100) / 100
    };
  });
  res.json({
    live,
    usedGb: Math.round(usedBytes / GB * 1e3) / 1e3,
    limitGb: Math.round(limitBytes / GB * 100) / 100,
    perOrder
  });
});
app.post("/api/proxy/create", authenticateToken, async (req, res) => {
  const { orderId, country, countryName, region, city, isp, ports, type, protocol, rotationMinutes } = req.body;
  if (!orderId || !country || !type || !protocol) {
    return res.status(400).json({ error: "Missing proxy configuration attributes." });
  }
  const orders = dbInstance.getOrders();
  const order = orders.find((o) => o.id === orderId && o.userId === req.user.id);
  if (!order) {
    return res.status(404).json({ error: "Authorized proxy purchasing order not found." });
  }
  if (order.status !== "active") {
    return res.status(400).json({ error: "This order package is inactive, pending, or expired. Complete payment first." });
  }
  if (order.subUserPackageKey) {
    const { live, usage } = await ResidentialService.getSubUserUsage();
    const u = live ? usage[order.subUserPackageKey] : void 0;
    const limitBytes = Math.round(order.bandwidthGb * 1e3 * 1e3 * 1e3);
    if (u && u.usedBytes >= limitBytes) {
      return res.status(400).json({
        error: "This plan has no bandwidth left. Please purchase a refill to create new proxies."
      });
    }
  }
  try {
    const proxy = await ProxyService.provisionUpstreamProxy({
      userId: req.user.id,
      orderId,
      country,
      countryName,
      region,
      city,
      isp,
      ports: parseInt(ports) || 1,
      type,
      protocol,
      rotationMinutes: parseInt(rotationMinutes) || 0,
      subUserPackageKey: order.subUserPackageKey
    });
    res.status(201).json({ proxy });
  } catch (error) {
    res.status(500).json({ error: error.message || "An upstream error occurred during proxy creation." });
  }
});
app.delete("/api/proxy/revoke/:id", authenticateToken, async (req, res) => {
  const proxyId = req.params.id;
  const proxies = dbInstance.getProxies();
  const proxy = proxies.find((p) => p.id === proxyId && p.userId === req.user.id);
  if (!proxy) {
    return res.status(404).json({ error: "Proxy credentials not found or access unauthorized." });
  }
  try {
    await ProxyService.revokeProxy(proxyId);
    res.json({ success: true, message: "Proxy revoked and resource slot deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message || "Upstream server error during proxy revocation." });
  }
});
app.post("/api/payment/create-session", authenticateToken, async (req, res) => {
  const { packageId, gateway, amountUsd, couponCode, custPhone } = req.body;
  if (!packageId || !gateway) {
    return res.status(400).json({ error: "Missing required payment session keys." });
  }
  if (gateway === "paystation" && !String(custPhone || "").trim()) {
    return res.status(400).json({ error: "A phone number is required for PayStation checkout." });
  }
  try {
    const info = await ResidentialService.getInfo();
    if (info.live && info.trafficLeftBytes !== null && info.trafficLeftBytes <= 1024 * 1024) {
      return res.status(400).json({ error: "Out of stock: No residential bandwidth is available for purchase at this time. Please contact support." });
    }
    const session = await PaymentService.createCheckoutSession({
      userId: req.user.id,
      userEmail: req.user.email,
      packageId,
      amountUsd: parseFloat(amountUsd) || 0,
      gateway,
      couponCode: couponCode ? String(couponCode) : void 0,
      appUrl: publicBaseUrl(req),
      custPhone: custPhone ? String(custPhone) : void 0
    });
    res.json(session);
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to initiate merchant gateway checkout." });
  }
});
app.get("/api/wallet", authenticateToken, (req, res) => {
  const user = dbInstance.getUsers().find((u) => u.id === req.user.id);
  res.json({
    balance: user?.walletBalance || 0,
    transactions: dbInstance.getWalletTransactionsByUser(req.user.id)
  });
});
app.post("/api/wallet/topup", authenticateToken, async (req, res) => {
  const { amountUsd, gateway, custPhone } = req.body;
  if (!gateway) return res.status(400).json({ error: "A payment method is required." });
  if (gateway === "paystation" && !String(custPhone || "").trim()) {
    return res.status(400).json({ error: "A phone number is required for BDT Payment." });
  }
  try {
    const session = await PaymentService.createWalletTopupSession({
      userId: req.user.id,
      userEmail: req.user.email,
      amountUsd: parseFloat(amountUsd) || 0,
      gateway,
      appUrl: publicBaseUrl(req),
      custPhone: custPhone ? String(custPhone) : void 0
    });
    res.json(session);
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to start wallet top-up." });
  }
});
app.post("/api/wallet/pay", authenticateToken, async (req, res) => {
  const { packageId, couponCode } = req.body;
  if (!packageId) return res.status(400).json({ error: "Package is required." });
  try {
    const result = await PaymentService.payFromWallet({
      userId: req.user.id,
      userEmail: req.user.email,
      packageId,
      couponCode: couponCode ? String(couponCode) : void 0
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message || "Wallet payment failed." });
  }
});
app.get("/api/mobile/plans", authenticateToken, async (req, res) => {
  if (!LTESocksService.isConfigured()) return res.json({ configured: false, plans: [] });
  try {
    const all = await LTESocksService.getPlans();
    const allowed = (dbInstance.getPaymentSettings().ltesocksCountries || "DE, FR, CA, GB, AU").split(",").map((c) => c.trim().toUpperCase()).filter(Boolean);
    const plans = allowed.length ? all.filter((p) => allowed.includes((p.countryCode || "").toUpperCase())) : all;
    res.json({ configured: true, plans });
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to load mobile plans." });
  }
});
app.get("/api/mobile/my", authenticateToken, (req, res) => {
  res.json({ proxies: dbInstance.getMobileProxiesByUser(req.user.id) });
});
app.post("/api/mobile/order", authenticateToken, async (req, res) => {
  const { planId, tarificationIndex } = req.body;
  if (!planId || tarificationIndex === void 0) {
    return res.status(400).json({ error: "planId and tarificationIndex are required." });
  }
  if (!LTESocksService.isConfigured()) {
    return res.status(400).json({ error: "Mobile proxies are not available right now." });
  }
  try {
    const plans = await LTESocksService.getPlans();
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return res.status(404).json({ error: "Plan not found." });
    const trf = plan.tarifications[Number(tarificationIndex)];
    if (!trf) return res.status(400).json({ error: "Invalid duration selected." });
    const debit = dbInstance.debitWallet(req.user.id, trf.priceUsd, `Mobile proxy: ${plan.name}`);
    if (!debit.ok) return res.status(400).json({ error: "Insufficient wallet balance. Please top up first." });
    let ordered;
    try {
      ordered = await LTESocksService.orderPort(planId, { time: trf.time, traffic: trf.trafficMb, price: trf.priceRaw });
    } catch (e) {
      dbInstance.creditWallet(req.user.id, trf.priceUsd, `Refund \u2014 mobile proxy order failed`);
      return res.status(502).json({ error: `Could not create the mobile proxy (${e.message}). Your wallet was refunded.` });
    }
    const s = dbInstance.getPaymentSettings();
    const proto = s?.mobileProtocol || "socks5";
    const mp = dbInstance.insertMobileProxy({
      id: `mob_${Date.now()}_${Math.floor(Math.random() * 1e3)}`,
      userId: req.user.id,
      portId: ordered.portId,
      planId: plan.id,
      planName: plan.name,
      countryCode: plan.countryCode,
      ip: ordered.ip,
      port: ordered.port,
      username: ordered.username,
      password: ordered.password,
      protocol: proto === "http" ? "http" : "socks5",
      status: ordered.status,
      resetToken: ordered.resetToken,
      priceUsd: trf.priceUsd,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      expiresAt: new Date(Date.now() + trf.time * 1e3).toISOString()
    });
    dbInstance.log("info", "proxy", `Mobile proxy ordered: ${plan.name} for user ${req.user.id} (port ${ordered.portId}).`);
    res.json({ proxy: mp });
  } catch (e) {
    res.status(500).json({ error: e.message || "Mobile proxy order failed." });
  }
});
app.post("/api/mobile/:id/reset", authenticateToken, async (req, res) => {
  const mp = dbInstance.getMobileProxyById(req.params.id);
  if (!mp || mp.userId !== req.user.id) return res.status(404).json({ error: "Mobile proxy not found." });
  try {
    await LTESocksService.resetPort(mp.portId);
    try {
      const fresh = await LTESocksService.getPort(mp.portId);
      dbInstance.updateMobileProxy(mp.id, { ip: fresh.ip, port: fresh.port, status: fresh.status });
    } catch {
    }
    res.json({ success: true });
  } catch (e) {
    res.status(502).json({ error: e.message || "Could not rotate the mobile IP." });
  }
});
app.delete("/api/mobile/:id", authenticateToken, async (req, res) => {
  const mp = dbInstance.getMobileProxyById(req.params.id);
  if (!mp || mp.userId !== req.user.id) return res.status(404).json({ error: "Mobile proxy not found." });
  try {
    await LTESocksService.deletePort(mp.portId);
  } catch {
  }
  dbInstance.deleteMobileProxy(mp.id);
  res.json({ success: true });
});
app.post("/api/payment/validate-coupon", authenticateToken, (req, res) => {
  const { code, packageId } = req.body;
  if (!code || !packageId) {
    return res.status(400).json({ error: "Coupon code and package are required." });
  }
  const pkg = dbInstance.getPackages().find((p) => p.id === packageId);
  if (!pkg) {
    return res.status(404).json({ error: "Package not found." });
  }
  const result = PaymentService.evaluateCoupon(pkg.priceUsd, String(code));
  if (result.error) {
    return res.status(200).json({ valid: false, message: result.error, originalUsd: pkg.priceUsd });
  }
  res.json({
    valid: true,
    couponCode: result.couponCode,
    discountUsd: result.discountUsd,
    finalUsd: result.finalUsd,
    originalUsd: pkg.priceUsd,
    message: `Coupon applied \u2014 you save $${result.discountUsd}.`
  });
});
var zinipayReturn = async (req, res) => {
  const txnParam = req.params.txn || req.query.txn;
  let invoiceId = req.query.invoice_id || "";
  if (!invoiceId && txnParam) {
    invoiceId = dbInstance.getTransactions().find((t) => t.id === txnParam)?.providerInvoiceId || "";
  }
  let ok = false, orderId;
  try {
    if (invoiceId) {
      const r = await PaymentService.completePaymentByInvoiceId(invoiceId);
      ok = r.ok;
      orderId = r.orderId;
    }
  } catch (e) {
    dbInstance.log("error", "payment", `ZiniPay return handler error: ${e.message}`);
  }
  res.redirect(ok ? orderId ? "/?checkout=success" : "/?checkout=topup" : "/?checkout=pending");
};
app.get("/api/payment/zinipay/return", zinipayReturn);
app.get("/api/payment/zinipay/return/:txn", zinipayReturn);
app.get("/api/payment/zinipay/cancel/:txn", (req, res) => res.redirect("/?checkout=cancelled"));
app.get("/api/payment/zinipay/cancel", (req, res) => res.redirect("/?checkout=cancelled"));
var zinipayWebhook = async (req, res) => {
  const invoiceId = req.query.invoice_id || req.body?.invoice_id;
  if (!invoiceId) return res.status(400).json({ error: "invoice_id is required" });
  try {
    const result = await PaymentService.completePaymentByInvoiceId(invoiceId);
    res.json({ received: true, completed: result.ok });
  } catch (e) {
    dbInstance.log("error", "payment", `ZiniPay webhook error: ${e.message}`);
    res.status(500).json({ received: true, completed: false });
  }
};
app.get("/api/payment/zinipay/webhook", zinipayWebhook);
app.post("/api/payment/zinipay/webhook", zinipayWebhook);
var paystationCallback = async (req, res) => {
  const invoiceNumber = req.query.invoice_number || req.body?.invoice_number;
  const trxId = req.query.trx_id || req.body?.trx_id;
  const cbStatus = String(req.query.status || req.body?.status || "").toLowerCase();
  if (!invoiceNumber) return res.redirect("/?checkout=cancelled");
  let result = { ok: false };
  try {
    result = await PaymentService.completePayStationByInvoice(invoiceNumber, trxId);
  } catch (e) {
    dbInstance.log("error", "payment", `PayStation callback error: ${e.message}`);
  }
  if (result.ok) return res.redirect(result.orderId ? "/?checkout=success" : "/?checkout=topup");
  const st = `${result.trxStatus || ""} ${cbStatus}`.toLowerCase();
  const failed = ["fail", "declin", "error", "invalid", "reject", "expire"].some((s) => st.includes(s));
  res.redirect(failed ? "/?checkout=failed" : "/?checkout=cancelled");
};
app.get("/api/payment/paystation/callback", paystationCallback);
app.post("/api/payment/paystation/callback", paystationCallback);
var cryptomusWebhook = async (req, res) => {
  const orderId = req.body?.order_id || req.query.order_id;
  if (!orderId) return res.status(400).json({ error: "order_id is required" });
  try {
    const result = await PaymentService.completeCryptomusByOrder(orderId);
    res.json({ received: true, completed: result.ok });
  } catch (e) {
    dbInstance.log("error", "payment", `Cryptomus webhook error: ${e.message}`);
    res.status(500).json({ received: true, completed: false });
  }
};
app.post("/api/payment/cryptomus/callback", cryptomusWebhook);
app.get("/api/payment/cryptomus/callback", cryptomusWebhook);
var cryptomusReturn = async (req, res) => {
  const orderId = req.params.txn || req.query.order_id;
  if (!orderId) return res.redirect("/?checkout=pending");
  let result = { ok: false };
  try {
    result = await PaymentService.completeCryptomusByOrder(orderId);
  } catch (e) {
    dbInstance.log("error", "payment", `Cryptomus return error: ${e.message}`);
  }
  if (result.ok) return res.redirect(result.orderId ? "/?checkout=success" : "/?checkout=topup");
  if (CryptomusService.isFailedStatus(result.status)) return res.redirect("/?checkout=failed");
  res.redirect("/?checkout=pending");
};
app.get("/api/payment/cryptomus/return", cryptomusReturn);
app.get("/api/payment/cryptomus/return/:txn", cryptomusReturn);
app.post("/api/payment/simulate-complete", authenticateToken, async (req, res) => {
  const { transactionId } = req.body;
  if (!transactionId) {
    return res.status(400).json({ error: "Transaction ID is required for verification." });
  }
  try {
    const success = await PaymentService.completePaymentTransaction(transactionId);
    if (success) {
      res.json({ success: true, message: "Payment confirmed. Bandwidth package unlocked and active!" });
    } else {
      res.status(400).json({ error: "Payment completion validation failed. Transaction mismatch." });
    }
  } catch (error) {
    res.status(500).json({ error: error.message || "Server error verifying simulated payment." });
  }
});
app.get("/api/payment/transactions", authenticateToken, (req, res) => {
  const allTxns = dbInstance.getTransactions();
  const userTxns = allTxns.filter((t) => t.userId === req.user.id);
  res.json({ transactions: userTxns });
});
var requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Administrator privileges required." });
  }
  next();
};
app.get("/api/admin/stats", authenticateToken, requireAdmin, (req, res) => {
  const users = dbInstance.getUsers();
  const orders = dbInstance.getOrders();
  const proxies = dbInstance.getProxies();
  const txns = dbInstance.getTransactions();
  const totalUsers = users.length;
  const activeOrdersCount = orders.filter((o) => o.status === "active").length;
  const totalProxiesCount = proxies.length;
  const onlineProxiesCount = proxies.filter((p) => p.status === "online").length;
  const totalRevenue = txns.filter((t) => t.status === "completed").reduce((acc, t) => acc + t.amountUsd, 0);
  const totalGbPurchased = orders.filter((o) => o.status === "active").reduce((acc, o) => acc + o.bandwidthGb, 0);
  const totalGbUsed = orders.reduce((acc, o) => acc + o.bandwidthUsedGb, 0);
  res.json({
    metrics: {
      totalUsers,
      activeOrdersCount,
      totalProxiesCount,
      onlineProxiesCount,
      totalRevenue,
      totalGbPurchased,
      totalGbUsed: parseFloat(totalGbUsed.toFixed(2))
    }
  });
});
app.get("/api/admin/users", authenticateToken, requireAdmin, (req, res) => {
  res.json({ users: dbInstance.getUsers() });
});
app.get("/api/admin/orders", authenticateToken, requireAdmin, (req, res) => {
  const orders = dbInstance.getOrders();
  const users = dbInstance.getUsers();
  const history = dbInstance.getTransactions().map((t) => {
    const o = orders.find((x) => x.id === t.orderId);
    const u = users.find((x) => x.id === t.userId);
    return {
      id: t.id,
      orderId: t.orderId,
      userEmail: t.userEmail || u?.email || "\u2014",
      userName: u?.name || "",
      packageName: o?.packageName || "\u2014",
      bandwidthGb: o?.bandwidthGb || 0,
      amountUsd: t.amountUsd,
      discountUsd: t.discountUsd || 0,
      couponCode: t.couponCode || "",
      gateway: t.gateway,
      status: t.status,
      createdAt: t.createdAt
    };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ orders: history });
});
app.post("/api/admin/users/status", authenticateToken, requireAdmin, (req, res) => {
  const { userId, isActive, role, password } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required." });
  }
  const updates = {};
  if (isActive !== void 0) updates.isActive = isActive;
  if (role !== void 0) updates.role = role;
  if (password !== void 0) updates.password = password;
  const updated = dbInstance.updateUser(userId, updates);
  if (!updated) {
    return res.status(404).json({ error: "User profile not found." });
  }
  dbInstance.log(
    "security",
    "admin",
    `Admin updated status of user ${updated.name} (${updated.email}): ${JSON.stringify(updates)}`
  );
  res.json({ user: updated });
});
app.delete("/api/admin/users/:id", authenticateToken, requireAdmin, async (req, res) => {
  const userId = req.params.id;
  const target = dbInstance.getUsers().find((u) => u.id === userId);
  if (!target) {
    return res.status(404).json({ error: "User profile not found." });
  }
  if (target.id === "usr_admin") {
    return res.status(400).json({ error: "Cannot delete the master administrator account." });
  }
  const userOrders = dbInstance.getOrders().filter((o) => o.userId === userId);
  const subKeys = Array.from(new Set(
    userOrders.map((o) => o.subUserPackageKey).filter((k) => !!k)
  ));
  for (const key of subKeys) {
    try {
      await ResidentialService.deleteSubUserPackage(key);
    } catch (e) {
      dbInstance.log("warning", "admin", `Could not release sub-user package ${key} for deleted user: ${e.message}`);
    }
  }
  const db = dbInstance.read();
  db.orders = db.orders.filter((o) => o.userId !== userId);
  db.proxies = db.proxies.filter((p) => p.userId !== userId);
  db.transactions = db.transactions.filter((t) => t.userId !== userId);
  db.users = db.users.filter((u) => u.id !== userId);
  dbInstance.write(db);
  dbInstance.log(
    "security",
    "admin",
    `Admin permanently deleted user ${target.name} (${target.email}); released ${subKeys.length} sub-user allocation(s).`
  );
  res.json({ success: true, message: "User account and all associated resources deleted." });
});
app.get("/api/admin/logs", authenticateToken, requireAdmin, (req, res) => {
  res.json({ logs: dbInstance.getLogs() });
});
app.post("/api/admin/packages", authenticateToken, requireAdmin, (req, res) => {
  const { name, bandwidthGb, priceUsd, features } = req.body;
  if (!name || !bandwidthGb || !priceUsd) {
    return res.status(400).json({ error: "Package Name, GB and Price are required." });
  }
  const newPkg = {
    id: `pkg_${Date.now()}`,
    name,
    bandwidthGb: parseInt(bandwidthGb),
    priceUsd: parseFloat(priceUsd),
    features: Array.isArray(features) ? features : ["HTTP/SOCKS5 Support", "Instant Provisioning"],
    isActive: true
  };
  dbInstance.insertPackage(newPkg);
  res.status(201).json({ package: newPkg });
});
app.put("/api/admin/packages/:id", authenticateToken, requireAdmin, (req, res) => {
  const pkgId = req.params.id;
  const { name, bandwidthGb, priceUsd, features, isActive } = req.body;
  const updates = {};
  if (name !== void 0) updates.name = name;
  if (bandwidthGb !== void 0) updates.bandwidthGb = parseInt(bandwidthGb);
  if (priceUsd !== void 0) updates.priceUsd = parseFloat(priceUsd);
  if (features !== void 0) updates.features = features;
  if (isActive !== void 0) updates.isActive = isActive;
  const updated = dbInstance.updatePackage(pkgId, updates);
  if (!updated) {
    return res.status(404).json({ error: "Pricing package not found." });
  }
  res.json({ package: updated });
});
app.delete("/api/admin/packages/:id", authenticateToken, requireAdmin, (req, res) => {
  const pkgId = req.params.id;
  const success = dbInstance.deletePackage(pkgId);
  if (!success) {
    return res.status(404).json({ error: "Pricing package not found." });
  }
  res.json({ success: true, message: "Pricing package successfully deleted." });
});
app.get("/api/admin/coupons", authenticateToken, requireAdmin, (req, res) => {
  res.json({ coupons: dbInstance.getCoupons() });
});
app.post("/api/admin/coupons", authenticateToken, requireAdmin, (req, res) => {
  const { code, type, value, maxUses } = req.body;
  const normCode = String(code || "").trim().toUpperCase();
  if (!normCode || !/^[A-Z0-9_-]{2,32}$/.test(normCode)) {
    return res.status(400).json({ error: "Code must be 2-32 chars (letters, numbers, - or _)." });
  }
  if (type !== "percent" && type !== "fixed") {
    return res.status(400).json({ error: 'Type must be "percent" or "fixed".' });
  }
  const val = parseFloat(value);
  if (!Number.isFinite(val) || val <= 0 || type === "percent" && val > 100) {
    return res.status(400).json({ error: "Invalid discount value." });
  }
  if (dbInstance.findCouponByCode(normCode)) {
    return res.status(400).json({ error: "A coupon with this code already exists." });
  }
  const coupon = {
    id: `cpn_${Date.now()}`,
    code: normCode,
    type,
    value: val,
    isActive: true,
    maxUses: Math.max(0, parseInt(maxUses) || 0),
    usedCount: 0,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  dbInstance.insertCoupon(coupon);
  res.status(201).json({ coupon });
});
app.post("/api/admin/coupons/:id/toggle", authenticateToken, requireAdmin, (req, res) => {
  const coupon = dbInstance.getCoupons().find((c) => c.id === req.params.id);
  if (!coupon) return res.status(404).json({ error: "Coupon not found." });
  const updated = dbInstance.updateCoupon(coupon.id, { isActive: !coupon.isActive });
  res.json({ coupon: updated });
});
app.delete("/api/admin/coupons/:id", authenticateToken, requireAdmin, (req, res) => {
  const success = dbInstance.deleteCoupon(req.params.id);
  if (!success) return res.status(404).json({ error: "Coupon not found." });
  res.json({ success: true, message: "Coupon deleted." });
});
app.post("/api/admin/countries", authenticateToken, requireAdmin, (req, res) => {
  const { code, isEnabled } = req.body;
  if (!code || isEnabled === void 0) {
    return res.status(400).json({ error: "Country code and isEnabled parameter required." });
  }
  const country = dbInstance.updateCountry(code, isEnabled);
  if (!country) {
    return res.status(404).json({ error: "Country profile code not found." });
  }
  res.json({ country });
});
app.get("/api/admin/settings", authenticateToken, requireAdmin, (req, res) => {
  res.json({
    api: dbInstance.getApiSettings(),
    payment: dbInstance.getPaymentSettings(),
    website: dbInstance.getWebsiteSettings()
  });
});
app.put("/api/admin/settings", authenticateToken, requireAdmin, (req, res) => {
  const { api, payment, website } = req.body;
  if (api) dbInstance.updateApiSettings(api);
  if (payment) dbInstance.updatePaymentSettings(payment);
  if (website) dbInstance.updateWebsiteSettings(website);
  res.json({
    success: true,
    message: "Global configurations updated and live across all services."
  });
});
app.get("/api/notice", authenticateToken, (req, res) => {
  const posts = dbInstance.getNoticePosts();
  res.json({ posts });
});
app.post("/api/admin/notice", authenticateToken, requireAdmin, (req, res) => {
  const { title, body, tag, isPinned } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: "title and body are required." });
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const post = dbInstance.insertNoticePost({
    id: `notice_${Date.now()}`,
    title: title.trim(),
    body: body.trim(),
    tag: tag || "info",
    isPinned: !!isPinned,
    createdAt: now,
    updatedAt: now
  });
  res.json({ post });
});
app.put("/api/admin/notice/:id", authenticateToken, requireAdmin, (req, res) => {
  const { title, body, tag, isPinned } = req.body;
  const post = dbInstance.updateNoticePost(req.params.id, { title, body, tag, isPinned });
  if (!post) return res.status(404).json({ error: "Notice post not found." });
  res.json({ post });
});
app.delete("/api/admin/notice/:id", authenticateToken, requireAdmin, (req, res) => {
  const ok = dbInstance.deleteNoticePost(req.params.id);
  if (!ok) return res.status(404).json({ error: "Notice post not found." });
  res.json({ success: true });
});
app.post("/api/support", authenticateToken, (req, res) => {
  const { category, message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Message is required." });
  }
  const user = req.user;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const ticket = dbInstance.insertTicket({
    id: `TCK-${Date.now()}`,
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    category: category || "other",
    message: message.trim(),
    status: "open",
    createdAt: now,
    updatedAt: now
  });
  res.json({ ticket });
});
app.get("/api/support/my", authenticateToken, (req, res) => {
  const tickets = dbInstance.getTicketsByUser(req.user.id);
  res.json({ tickets });
});
app.get("/api/admin/support", authenticateToken, requireAdmin, (req, res) => {
  const tickets = dbInstance.getAllTickets();
  const openCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter((t) => t.status === "in-progress").length;
  res.json({ tickets, openCount, inProgressCount });
});
app.put("/api/admin/support/:id", authenticateToken, requireAdmin, (req, res) => {
  const { status, adminReply } = req.body;
  const ticket = dbInstance.updateTicket(req.params.id, { status, adminReply });
  if (!ticket) return res.status(404).json({ error: "Ticket not found." });
  res.json({ ticket });
});
app.delete("/api/admin/support/:id", authenticateToken, requireAdmin, (req, res) => {
  const ok = dbInstance.deleteTicket(req.params.id);
  if (!ok) return res.status(404).json({ error: "Ticket not found." });
  res.json({ success: true });
});
var ENFORCE_INTERVAL_MS = 60 * 1e3;
var BYTES_PER_GB = 1e3 * 1e3 * 1e3;
async function enforceBandwidthLimits() {
  const { live, usage } = await ResidentialService.getSubUserUsage();
  if (!live) return;
  const activeOrders = dbInstance.getOrders().filter((o) => o.status === "active" && o.subUserPackageKey);
  for (const order of activeOrders) {
    const u = usage[order.subUserPackageKey];
    if (!u) continue;
    const limitBytes = Math.round(order.bandwidthGb * BYTES_PER_GB);
    if (u.usedBytes < limitBytes) continue;
    const proxies = dbInstance.getProxies().filter((p) => p.orderId === order.id);
    for (const p of proxies) {
      try {
        await ResidentialService.deleteList(p.listId || p.id, p.subUserPackageKey);
        dbInstance.updateProxy(p.id, { status: "offline" });
      } catch (e) {
        dbInstance.log("warning", "proxy", `Could not revoke ${p.id} on exhaustion: ${e.message}`);
      }
    }
    dbInstance.updateOrder(order.id, { status: "expired" });
    dbInstance.log(
      "warning",
      "proxy",
      `Bandwidth exhausted for order ${order.id} (${Math.round(u.usedBytes / 1e6)}MB of ${Math.round(limitBytes / 1e6)}MB) \u2014 ${proxies.length} proxy(ies) revoked.`
    );
  }
}
if (process.env.NODE_ENV === "production") {
  setInterval(() => {
    enforceBandwidthLimits().catch(() => {
    });
  }, ENFORCE_INTERVAL_MS);
}
var app_default = app;

// server.ts
var PORT = Number(process.env.PORT) || 3e3;
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app_default.use(vite.middlewares);
    console.log("[Dev Server] Vite middleware integrated successfully.");
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app_default.use(import_express2.default.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        }
      }
    }));
    app_default.get("*", (req, res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
    console.log("[Prod Server] Static hosting integrated from /dist.");
  }
  app_default.listen(PORT, "0.0.0.0", () => {
    console.log(`Proxibity Online server initialized successfully on port ${PORT}`);
    console.log(`Local Access: http://localhost:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Critical server crash during bootstrap:", err);
});
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
//# sourceMappingURL=server.cjs.map
