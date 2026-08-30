/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Express application (API routes only — no Vite, no static hosting, no listen()).
 * server.ts imports this and adds the Vite/static layer + listen().
 */

import dns from 'node:dns';
import http from 'node:http';
import net from 'node:net';
import express from 'express';
import dotenv from 'dotenv';

// In production, prefer IPv6 for outbound requests (our IPv6 is whitelisted with
// Proxy-Seller) but keep "Happy Eyeballs" enabled so connections fall back to
// IPv4 if IPv6 connectivity flaps — otherwise a transient IPv6 hiccup would fail
// the call outright. Whitelist BOTH the VPS IPv6 and IPv4 so either is accepted.
if (process.env.NODE_ENV === 'production') {
  dns.setDefaultResultOrder('ipv6first');
}

// Load environment variables from .env / .env.local if present.
dotenv.config();

import { dbInstance } from './db';
import { ProxyService } from './proxyService';
import { ResidentialService } from './residentialService';
import { PaymentService } from './paymentService';
import { CryptomusService } from './cryptomusService';
import { User, ProxyPackage, Coupon } from '../src/types';

const app = express();

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- MIDDLEWARE: AUTHENTICATION ---
// Decodes and validates bearer token. To keep deployment dependencies simple,
// we use a clean JSON/base64 authentication handler that works instantly.
function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No authorization token provided.' });
  }

  try {
    // Decoding token. In our mock/demo auth, the token is simply 'usr_id_role_expiry'
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userId, role, email] = decoded.split(':');

    if (!userId || !role) {
      throw new Error('Malformed auth token.');
    }

    const users = dbInstance.getUsers();
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(403).json({ error: 'Session expired or user not found.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Your account is currently blocked by an administrator.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired security token.' });
  }
}

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Helper: Generate Token
function generateToken(user: User): string {
  const payload = `${user.id}:${user.role}:${user.email}`;
  return Buffer.from(payload).toString('base64');
}

// Public base URL of this deployment (honours nginx X-Forwarded-* headers).
// Used to build ZiniPay redirect/webhook URLs. Override with APP_URL if set.
function publicBaseUrl(req: express.Request): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, '');
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol;
  const host = (req.headers['x-forwarded-host'] as string) || req.get('host');
  return `${proto}://${host}`;
}

// --- API ROUTES ---

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', database: 'online', timestamp: new Date().toISOString() });
});

// 1. AUTH API
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please enter all fields (Name, Email, Password)' });
  }

  const users = dbInstance.getUsers();
  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (existingUser) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const isFirstUserAdmin = users.length === 0;

  const newUser: User = {
    id: `usr_${Date.now()}`,
    email: email.toLowerCase(),
    name,
    role: isFirstUserAdmin ? 'admin' : 'user',
    isActive: true,
    mainBalance: 0,
    dueBalance: 0,
    createdAt: new Date().toISOString()
  };

  dbInstance.insertUser(newUser);
  const token = generateToken(newUser);

  res.status(201).json({
    user: newUser,
    token
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter both Email and Password.' });
  }

  const users = dbInstance.getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(400).json({ error: 'Invalid credentials. No user found with this email.' });
  }

  // Validate password for either admin or standard users if set
  if (user.id === 'usr_admin') {
    const adminPass = (user as any).password || 'admin123';
    if (password !== adminPass) {
      return res.status(400).json({ error: 'Incorrect password for admin user.' });
    }
  } else {
    const userWithPass = user as any;
    if (userWithPass.password && userWithPass.password !== password) {
      return res.status(400).json({ error: 'Incorrect password. Please try again.' });
    }
  }

  if (!user.isActive) {
    return res.status(403).json({ error: 'Your account is suspended. Contact support.' });
  }

  const token = generateToken(user);
  dbInstance.log('info', 'auth', `User logged in successfully: ${user.name} (${user.email})`, req.ip);

  res.json({
    user,
    token
  });
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Please enter your email address.' });
  }

  const users = dbInstance.getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

  if (!user) {
    return res.status(400).json({ error: 'No registered account found with this email.' });
  }

  if (user.id === 'usr_admin') {
    return res.json({ 
      success: true, 
      message: 'Password Recovery: The administrator account has a fixed password. Your password is "admin123".' 
    });
  }

  return res.json({ 
    success: true, 
    message: 'Password Recovery: For standard user accounts, passwordless login is enabled. You can log in using any password of your choice!' 
  });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

app.put('/api/auth/profile', authenticateToken, (req, res) => {
  const { name, profilePicture, password } = req.body;
  const updates: Partial<any> = {};
  if (name && typeof name === 'string' && name.trim().length > 0) updates.name = name.trim();
  if (profilePicture !== undefined) updates.profilePicture = profilePicture;
  if (password && typeof password === 'string' && password.trim().length > 0) {
    updates.password = password.trim();
  }
  
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No fields to update.' });

  const user = dbInstance.updateUser(req.user!.id, updates);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user });
});

// Real Google Sign-In: verify the Google ID token (JWT credential) with Google,
// then find-or-create the user by their real, verified email.
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'Missing Google credential.' });
  }

  const clientId = (dbInstance.getWebsiteSettings().googleClientId || '').trim();
  if (!clientId) {
    return res.status(400).json({ error: 'Google Sign-In is not configured. Set the Google Client ID in Admin settings.' });
  }

  let payload: any;
  try {
    // Google validates the token's signature + expiry and returns the claims.
    const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    payload = await r.json();
    if (!r.ok || payload.error) throw new Error(payload.error_description || 'Invalid token');
  } catch (e: any) {
    dbInstance.log('warning', 'auth', `Google token verification failed: ${e.message}`, req.ip);
    return res.status(401).json({ error: 'Google authentication failed. Please try again.' });
  }

  // Ensure the token was issued for THIS app, by Google, for a verified email.
  const issuers = ['accounts.google.com', 'https://accounts.google.com'];
  if (payload.aud !== clientId) {
    return res.status(401).json({ error: 'Google token was issued for a different app.' });
  }
  if (!issuers.includes(payload.iss)) {
    return res.status(401).json({ error: 'Invalid Google token issuer.' });
  }
  if (payload.email_verified !== 'true' && payload.email_verified !== true) {
    return res.status(401).json({ error: 'Your Google email is not verified.' });
  }

  const email = String(payload.email || '').toLowerCase();
  if (!email) {
    return res.status(400).json({ error: 'Google account has no email.' });
  }
  const name = payload.name || payload.given_name || email.split('@')[0];

  let user = dbInstance.getUsers().find(u => u.email.toLowerCase() === email);

  if (!user) {
    user = {
      id: `usr_g_${Date.now()}`,
      email,
      name,
      role: 'user',
      isActive: true,
      mainBalance: 0,
      dueBalance: 0,
      createdAt: new Date().toISOString()
    };
    dbInstance.insertUser(user);
    dbInstance.log('info', 'auth', `Google user registered: ${name} (${email})`, req.ip);
  } else {
    dbInstance.log('info', 'auth', `Google user signed in: ${name} (${email})`, req.ip);
  }

  if (!user.isActive) {
    return res.status(403).json({ error: 'Your account is currently blocked by an administrator.' });
  }

  const token = generateToken(user);
  res.json({ user, token });
});


// 2. PUBLIC CONFIG & PACKAGES API
app.get('/api/settings/public', (req, res) => {
  res.json({
    website: dbInstance.getWebsiteSettings(),
    countries: dbInstance.getCountries().filter(c => c.isEnabled),
    gateways: dbInstance.getPaymentSettings().activeGateways,
    zinipayEnabled: dbInstance.getPaymentSettings().zinipayEnabled === true
  });
});

app.get('/api/settings/packages', (req, res) => {
  res.json({ packages: dbInstance.getPackages().filter(p => p.isActive) });
});

// Live residential-package snapshot backing the landing pricing cards.
// Sourced from Proxy-Seller /resident/package + /resident/consumption.
app.get('/api/settings/residential', async (req, res) => {
  try {
    const info = await ResidentialService.getInfo();
    res.json(info);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to load residential package data.' });
  }
});


// 3. PROXIES & ORDERS API
// Helper to check SOCKS5/HTTP proxy online/offline status
function checkProxySingleTarget(
  protocol: string,
  ip: string,
  port: number,
  user?: string,
  pass?: string,
  targetHost: string = 'ident.me',
  targetPort: number = 80
): Promise<boolean> {
  if (protocol === 'socks5') {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(2500);

      socket.connect(port, ip, () => {
        socket.write(Buffer.from([0x05, 0x02, 0x00, 0x02]));
      });

      let state = 'greeting';

      socket.on('data', (data) => {
        try {
          if (state === 'greeting') {
            if (data[0] !== 0x05) {
              socket.destroy();
              return resolve(false);
            }
            const method = data[1];
            if (method === 0x00) {
              state = 'connect';
              sendSocks5Connect(socket, targetHost, targetPort);
            } else if (method === 0x02 && user && pass) {
              state = 'auth';
              const uLen = user.length;
              const pLen = pass.length;
              const authReq = Buffer.alloc(3 + uLen + pLen);
              authReq[0] = 0x01;
              authReq[1] = uLen;
              authReq.write(user, 2, uLen, 'ascii');
              authReq[2 + uLen] = pLen;
              authReq.write(pass, 3 + uLen, pLen, 'ascii');
              socket.write(authReq);
            } else {
              socket.destroy();
              resolve(false);
            }
          } else if (state === 'auth') {
            if (data[0] === 0x01 && data[1] === 0x00) {
              state = 'connect';
              sendSocks5Connect(socket, targetHost, targetPort);
            } else {
              socket.destroy();
              resolve(false);
            }
          } else if (state === 'connect') {
            if (data[0] === 0x05 && data[1] === 0x00) {
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

      socket.on('error', () => {
        resolve(false);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
    });
  } else {
    return new Promise((resolve) => {
      const options: any = {
        host: ip,
        port: port,
        path: `http://${targetHost}/`,
        method: 'GET',
        headers: {
          Host: targetHost,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        }
      };
      if (user && pass) {
        options.headers['Proxy-Authorization'] = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');
      }

      const req = http.request(options, (res) => {
        if (res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302) {
          resolve(true);
        } else {
          resolve(false);
        }
      });

      req.on('error', () => {
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

function sendSocks5Connect(sock: net.Socket, host: string, port: number) {
  const hostBuf = Buffer.from(host, 'ascii');
  const req = Buffer.alloc(6 + hostBuf.length);
  req[0] = 0x05;
  req[1] = 0x01;
  req[2] = 0x00;
  req[3] = 0x03;
  req[4] = hostBuf.length;
  hostBuf.copy(req, 5);
  req.writeUInt16BE(port, 5 + hostBuf.length);
  sock.write(req);
}

async function checkProxyStatus(proxy: any): Promise<boolean> {
  if (proxy.id.startsWith('sim_')) {
    // Simulated proxies are only legitimate on a deployment with no API key
    // (local development). When a real key IS configured, a `sim_` record is a
    // leftover from a failed upstream call — it exists nowhere and can never
    // connect, so report it offline instead of showing a healthy-looking proxy.
    return !(dbInstance.getApiSettings().residentialApiKey || '').trim();
  }
  // Newly created proxies (under 10 minutes old) are kept online by default
  if (proxy.createdAt) {
    const ageMs = Date.now() - new Date(proxy.createdAt).getTime();
    if (ageMs < 600000) { // 10 minutes
      return true;
    }
  }
  const { ip, port, username, passwordHash, protocol } = proxy;
  let success = await checkProxySingleTarget(protocol, ip, port, username, passwordHash, 'ident.me', 80);
  if (success) return true;
  success = await checkProxySingleTarget(protocol, ip, port, username, passwordHash, 'icanhazip.com', 80);
  if (success) return true;
  return false;
}

// 3. PROXIES & ORDERS API
app.get('/api/proxy/my-proxies', authenticateToken, async (req, res) => {
  const allProxies = dbInstance.getProxies();
  const userProxies = allProxies.filter(p => p.userId === req.user!.id);
  
  const checkedProxies = await Promise.all(userProxies.map(async (p) => {
    try {
      const isOnline = await checkProxyStatus(p);
      return { ...p, status: isOnline ? 'online' : 'offline' };
    } catch {
      return { ...p, status: 'offline' };
    }
  }));
  
  res.json({ proxies: checkedProxies });
});

app.get('/api/proxy/orders', authenticateToken, (req, res) => {
  const allOrders = dbInstance.getOrders();
  const userOrders = allOrders.filter(o => o.userId === req.user!.id);
  res.json({ orders: userOrders });
});

// Residential GEO tree (country/region/city/ISP) for the Create Proxy form.
// Sourced from Proxy-Seller GET /resident/geo (simulated fallback without a key).
app.get('/api/proxy/residential/geo', authenticateToken, async (req, res) => {
  try {
    const [{ live, geo }, options] = await Promise.all([
      ResidentialService.getGeo(),
      ResidentialService.getProxyOptions()
    ]);
    res.json({ live, geo, options });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to load residential GEO data.' });
  }
});

// Real bandwidth usage for the logged-in user, from Proxy-Seller sub-user packages.
app.get('/api/proxy/usage', authenticateToken, async (req, res) => {
  const orders = dbInstance.getOrders().filter(o => o.userId === req.user!.id && o.status === 'active');
  const { live, usage } = await ResidentialService.getSubUserUsage();
  const GB = 1000 * 1000 * 1000; // decimal: 1 GB = 1000 MB, matches what we sell
  let usedBytes = 0, limitBytes = 0;
  const perOrder = orders.map(o => {
    const u = o.subUserPackageKey ? usage[o.subUserPackageKey] : undefined;
    const ub = u ? u.usedBytes : 0;
    // Limit is the ordered amount in decimal GB, not Proxy-Seller's 1-GiB reservation.
    const lb = Math.round(o.bandwidthGb * GB);
    usedBytes += ub;
    limitBytes += lb;
    return {
      orderId: o.id,
      packageName: o.packageName,
      usedGb: Math.round((ub / GB) * 1000) / 1000,
      limitGb: Math.round((lb / GB) * 100) / 100
    };
  });
  res.json({
    live,
    usedGb: Math.round((usedBytes / GB) * 1000) / 1000,
    limitGb: Math.round((limitBytes / GB) * 100) / 100,
    perOrder
  });
});

app.post('/api/proxy/create', authenticateToken, async (req, res) => {
  const { orderId, country, countryName, region, city, isp, ports, type, protocol, rotationMinutes } = req.body;

  if (!orderId || !country || !type || !protocol) {
    return res.status(400).json({ error: 'Missing proxy configuration attributes.' });
  }

  // Validate ownership of order
  const orders = dbInstance.getOrders();
  const order = orders.find(o => o.id === orderId && o.userId === req.user!.id);

  if (!order) {
    return res.status(404).json({ error: 'Authorized proxy purchasing order not found.' });
  }

  if (order.status !== 'active') {
    return res.status(400).json({ error: 'This order package is inactive, pending, or expired. Complete payment first.' });
  }

  // Don't hand out a new proxy on a package that has no bandwidth left — it
  // would immediately overshoot the limit the customer paid for.
  if (order.subUserPackageKey) {
    const { live, usage } = await ResidentialService.getSubUserUsage();
    const u = live ? usage[order.subUserPackageKey] : undefined;
    const limitBytes = Math.round(order.bandwidthGb * 1000 * 1000 * 1000); // decimal GB
    if (u && u.usedBytes >= limitBytes) {
      return res.status(400).json({
        error: 'This plan has no bandwidth left. Please purchase a refill to create new proxies.'
      });
    }
  }

  try {
    const proxy = await ProxyService.provisionUpstreamProxy({
      userId: req.user!.id,
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

    // Real usage is read from Proxy-Seller (GET /api/proxy/usage) — no local simulation.
    res.status(201).json({ proxy });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'An upstream error occurred during proxy creation.' });
  }
});

app.delete('/api/proxy/revoke/:id', authenticateToken, async (req, res) => {
  const proxyId = req.params.id;
  const proxies = dbInstance.getProxies();
  const proxy = proxies.find(p => p.id === proxyId && p.userId === req.user!.id);

  if (!proxy) {
    return res.status(404).json({ error: 'Proxy credentials not found or access unauthorized.' });
  }

  try {
    await ProxyService.revokeProxy(proxyId);
    res.json({ success: true, message: 'Proxy revoked and resource slot deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Upstream server error during proxy revocation.' });
  }
});


// 4. PAYMENTS API
app.post('/api/payment/create-session', authenticateToken, async (req, res) => {
  const { packageId, gateway, amountUsd, couponCode, custPhone } = req.body;

  if (!packageId || !gateway) {
    return res.status(400).json({ error: 'Missing required payment session keys.' });
  }

  // PayStation requires a customer phone number.
  if (gateway === 'paystation' && !String(custPhone || '').trim()) {
    return res.status(400).json({ error: 'A phone number is required for PayStation checkout.' });
  }

  try {
    const info = await ResidentialService.getInfo();
    if (info.live && info.trafficLeftBytes !== null && info.trafficLeftBytes <= 1024 * 1024) {
      return res.status(400).json({ error: 'Out of stock: No residential bandwidth is available for purchase at this time. Please contact support.' });
    }

    const session = await PaymentService.createCheckoutSession({
      userId: req.user!.id,
      userEmail: req.user!.email,
      packageId,
      amountUsd: parseFloat(amountUsd) || 0,
      gateway,
      couponCode: couponCode ? String(couponCode) : undefined,
      appUrl: publicBaseUrl(req),
      custPhone: custPhone ? String(custPhone) : undefined
    });

    res.json(session);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to initiate merchant gateway checkout.' });
  }
});

// --- WALLET ---

// Current wallet balance + ledger for the logged-in user.
app.get('/api/wallet', authenticateToken, (req, res) => {
  const user = dbInstance.getUsers().find(u => u.id === req.user!.id);
  res.json({
    balance: user?.mainBalance || 0,
    due: user?.dueBalance || 0,
    transactions: dbInstance.getWalletTransactionsByUser(req.user!.id)
  });
});

// Start a wallet top-up via a payment gateway.
app.post('/api/wallet/topup', authenticateToken, async (req, res) => {
  const { amountUsd, gateway, custPhone } = req.body;
  if (!gateway) return res.status(400).json({ error: 'A payment method is required.' });
  if (gateway === 'paystation' && !String(custPhone || '').trim()) {
    return res.status(400).json({ error: 'A phone number is required for BDT Payment.' });
  }
  try {
    const session = await PaymentService.createWalletTopupSession({
      userId: req.user!.id,
      userEmail: req.user!.email,
      amountUsd: parseFloat(amountUsd) || 0,
      gateway,
      appUrl: publicBaseUrl(req),
      custPhone: custPhone ? String(custPhone) : undefined
    });
    res.json(session);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to start wallet top-up.' });
  }
});

// Pay for a package directly from the wallet balance.
app.post('/api/wallet/pay', authenticateToken, async (req, res) => {
  const { packageId, couponCode } = req.body;
  if (!packageId) return res.status(400).json({ error: 'Package is required.' });
  try {
    const result = await PaymentService.payFromWallet({
      userId: req.user!.id,
      userEmail: req.user!.email,
      packageId,
      couponCode: couponCode ? String(couponCode) : undefined
    });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Wallet payment failed.' });
  }
});

// --- MOBILE PROXIES (manual admin-managed pool) ---

// Available mobile "plans" — grouped from the admin's manual proxy pool.
app.get('/api/mobile/plans', authenticateToken, (req, res) => {
  const plans = dbInstance.getMobilePlanGroups();
  res.json({ configured: true, plans });
});

// The logged-in user's mobile proxies.
app.get('/api/mobile/my', authenticateToken, (req, res) => {
  res.json({ proxies: dbInstance.getMobileProxiesByUser(req.user!.id) });
});

// Order a mobile proxy, paying from the wallet balance. Assigns immediately
// from the admin's manual pool.
app.post('/api/mobile/order', authenticateToken, async (req, res) => {
  const { planName, countryCode } = req.body;
  if (!planName || !countryCode) {
    return res.status(400).json({ error: 'planName and countryCode are required.' });
  }
  try {
    // Server-authoritative pricing: look up the pool group ourselves.
    const group = dbInstance.getMobilePlanGroups().find(g => g.planName === planName && g.countryCode === countryCode);
    if (!group || group.availableCount <= 0) {
      return res.status(400).json({ error: 'This plan is out of stock right now.' });
    }

    const debit = dbInstance.debitWallet(req.user!.id, group.priceUsd, `Mobile proxy: ${planName} (${countryCode})`);
    if (!debit.ok) return res.status(400).json({ error: 'Insufficient wallet balance. Please top up first.' });

    const proxy = dbInstance.assignAvailableMobileProxy(req.user!.id, planName, countryCode);
    if (!proxy) {
      // Stock ran out between the check and the debit (rare race) — refund.
      dbInstance.creditWallet(req.user!.id, group.priceUsd, `Refund: ${planName} (${countryCode}) out of stock`);
      return res.status(400).json({ error: 'This plan just sold out. You have been refunded to your wallet.' });
    }
    dbInstance.log('info', 'proxy', `Mobile proxy assigned from wallet purchase: ${planName} (${countryCode}) to user ${req.user!.id}`);
    res.json({ proxy });
  } catch (e: any) {
    console.error('[/api/mobile/order] Error:', e.message || e);
    dbInstance.log('error', 'proxy', `Mobile order error: ${e.message}`);
    res.status(500).json({ error: e.message || 'Mobile proxy order failed.' });
  }
});

// Buy a mobile proxy via a payment gateway (checkout, like residential).
app.post('/api/mobile/checkout', authenticateToken, async (req, res) => {
  const { planName, countryCode, gateway, custPhone } = req.body;
  if (!planName || !countryCode || !gateway) {
    return res.status(400).json({ error: 'planName, countryCode and gateway are required.' });
  }
  if (gateway === 'paystation' && !String(custPhone || '').trim()) {
    return res.status(400).json({ error: 'A phone number is required for BDT Payment.' });
  }
  try {
    const session = await PaymentService.createMobileCheckoutSession({
      userId: req.user!.id, userEmail: req.user!.email,
      planName, countryCode, gateway,
      appUrl: publicBaseUrl(req), custPhone: custPhone ? String(custPhone) : undefined
    });
    res.json(session);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to start mobile checkout.' });
  }
});

// Release a mobile proxy (remove from user's list)
app.delete('/api/mobile/:id', authenticateToken, (req, res) => {
  const mp = dbInstance.getMobileProxyById(req.params.id);
  if (!mp || mp.userId !== req.user!.id) return res.status(404).json({ error: 'Mobile proxy not found.' });
  // Return to available pool (for admin to reassign)
  dbInstance.updateMobileProxy(mp.id, { userId: '', status: 'available' });
  dbInstance.log('info', 'proxy', `User ${req.user!.id} released mobile proxy ${mp.id}.`);
  res.json({ success: true });
});

// Validate a coupon against a package (for client-side preview). Auth required.
app.post('/api/payment/validate-coupon', authenticateToken, (req, res) => {
  const { code, packageId, amountUsd, proxyType } = req.body;
  if (!code || (!packageId && amountUsd === undefined)) {
    return res.status(400).json({ error: 'Coupon code and package are required.' });
  }
  // Prefer a real package price; fall back to an explicit amount (e.g. a mobile
  // proxy, which has no catalog package).
  const pkg = packageId ? dbInstance.getPackages().find(p => p.id === packageId) : undefined;
  const baseUsd = pkg ? pkg.priceUsd : Number(amountUsd);
  if (!(baseUsd >= 0)) {
    return res.status(404).json({ error: 'Package not found.' });
  }
  const result = PaymentService.evaluateCoupon(baseUsd, String(code), proxyType);
  if (result.error) {
    return res.status(200).json({ valid: false, message: result.error, originalUsd: baseUsd });
  }
  res.json({
    valid: true,
    couponCode: result.couponCode,
    discountUsd: result.discountUsd,
    finalUsd: result.finalUsd,
    originalUsd: baseUsd,
    message: `Coupon applied — you save $${result.discountUsd}.`
  });
});

// --- ZiniPay callbacks (public: called by ZiniPay / the buyer's browser) ---

// Buyer is redirected back here after paying on ZiniPay's hosted page.
// ZiniPay appends ?invoice_id=...&status=... to this URL.
const zinipayReturn = async (req: express.Request, res: express.Response) => {
  const txnParam = (req.params.txn || req.query.txn) as string | undefined;
  let invoiceId = (req.query.invoice_id as string | undefined) || '';
  if (!invoiceId && txnParam) {
    invoiceId = dbInstance.getTransactions().find(t => t.id === txnParam)?.providerInvoiceId || '';
  }
  let ok = false, orderId: string | undefined;
  try {
    if (invoiceId) { const r = await PaymentService.completePaymentByInvoiceId(invoiceId); ok = r.ok; orderId = r.orderId; }
  } catch (e: any) {
    dbInstance.log('error', 'payment', `ZiniPay return handler error: ${e.message}`);
  }
  // Only a wallet top-up shows the "topped up" banner; orders & mobile show success.
  const purpose = dbInstance.getTransactions().find(t => t.providerInvoiceId === invoiceId)?.purpose;
  res.redirect(ok ? (purpose === 'wallet' ? '/?checkout=topup' : '/?checkout=success') : '/?checkout=pending');
};
app.get('/api/payment/zinipay/return', zinipayReturn);
app.get('/api/payment/zinipay/return/:txn', zinipayReturn);

// Buyer cancelled on ZiniPay's page.
app.get('/api/payment/zinipay/cancel/:txn', (req, res) => res.redirect('/?checkout=cancelled'));
app.get('/api/payment/zinipay/cancel', (req, res) => res.redirect('/?checkout=cancelled'));

// Server-to-server webhook from ZiniPay (?invoice_id=...&status=true).
const zinipayWebhook = async (req: express.Request, res: express.Response) => {
  const invoiceId = (req.query.invoice_id || req.body?.invoice_id) as string | undefined;
  if (!invoiceId) return res.status(400).json({ error: 'invoice_id is required' });
  try {
    const result = await PaymentService.completePaymentByInvoiceId(invoiceId);
    res.json({ received: true, completed: result.ok });
  } catch (e: any) {
    dbInstance.log('error', 'payment', `ZiniPay webhook error: ${e.message}`);
    res.status(500).json({ received: true, completed: false });
  }
};
app.get('/api/payment/zinipay/webhook', zinipayWebhook);
app.post('/api/payment/zinipay/webhook', zinipayWebhook);

// PayStation redirects the customer here after checkout (invoice_number + trx_id
// come back on the query string or body). We verify via /retrive-transaction,
// activate the order, then bounce the browser to the dashboard.
const paystationCallback = async (req: express.Request, res: express.Response) => {
  const invoiceNumber = (req.query.invoice_number || req.body?.invoice_number) as string | undefined;
  const trxId = (req.query.trx_id || req.body?.trx_id) as string | undefined;
  // PayStation also passes an outcome hint on the callback URL (e.g. ?status=Failed).
  const cbStatus = String(req.query.status || req.body?.status || '').toLowerCase();
  if (!invoiceNumber) return res.redirect('/?checkout=cancelled');

  let result: { ok: boolean; trxStatus?: string; orderId?: string } = { ok: false };
  try {
    result = await PaymentService.completePayStationByInvoice(invoiceNumber, trxId);
  } catch (e: any) {
    dbInstance.log('error', 'payment', `PayStation callback error: ${e.message}`);
  }
  if (result.ok) {
    const purpose = dbInstance.getTransactions().find(t => t.providerInvoiceId === invoiceNumber)?.purpose;
    return res.redirect(purpose === 'wallet' ? '/?checkout=topup' : '/?checkout=success');
  }

  // The customer has RETURNED to us without a confirmed payment. PayStation's
  // methods (bKash / Nagad / card) settle instantly, so at this point the
  // payment was cancelled, closed, or failed — never "still awaiting
  // confirmation". Show a clear failed/cancelled banner, not the pending one.
  const st = `${result.trxStatus || ''} ${cbStatus}`.toLowerCase();
  const failed = ['fail', 'declin', 'error', 'invalid', 'reject', 'expire'].some(s => st.includes(s));
  res.redirect(failed ? '/?checkout=failed' : '/?checkout=cancelled');
};
app.get('/api/payment/paystation/callback', paystationCallback);
app.post('/api/payment/paystation/callback', paystationCallback);

// Cryptomus server-to-server webhook (authoritative): fires when the crypto
// payment status changes. We re-verify via /v1/payment/info and activate.
const cryptomusWebhook = async (req: express.Request, res: express.Response) => {
  const orderId = (req.body?.order_id || req.query.order_id) as string | undefined;
  if (!orderId) return res.status(400).json({ error: 'order_id is required' });
  try {
    const result = await PaymentService.completeCryptomusByOrder(orderId);
    res.json({ received: true, completed: result.ok });
  } catch (e: any) {
    dbInstance.log('error', 'payment', `Cryptomus webhook error: ${e.message}`);
    res.status(500).json({ received: true, completed: false });
  }
};
app.post('/api/payment/cryptomus/callback', cryptomusWebhook);
app.get('/api/payment/cryptomus/callback', cryptomusWebhook);

// Cryptomus browser return: verify and bounce to the right banner. Crypto
// settles asynchronously on-chain, so an unconfirmed-but-not-failed payment is
// genuinely "pending" here (the webhook activates it once fully paid).
const cryptomusReturn = async (req: express.Request, res: express.Response) => {
  const orderId = (req.params.txn || req.query.order_id) as string | undefined;
  if (!orderId) return res.redirect('/?checkout=pending');
  let result: { ok: boolean; status?: string; orderId?: string } = { ok: false };
  try {
    result = await PaymentService.completeCryptomusByOrder(orderId);
  } catch (e: any) {
    dbInstance.log('error', 'payment', `Cryptomus return error: ${e.message}`);
  }
  if (result.ok) {
    const purpose = dbInstance.getTransactions().find(t => t.providerInvoiceId === orderId)?.purpose;
    return res.redirect(purpose === 'wallet' ? '/?checkout=topup' : '/?checkout=success');
  }
  if (CryptomusService.isFailedStatus(result.status)) return res.redirect('/?checkout=failed');
  res.redirect('/?checkout=pending');
};
app.get('/api/payment/cryptomus/return', cryptomusReturn);
app.get('/api/payment/cryptomus/return/:txn', cryptomusReturn);

// Endpoint to simulate the callback of payment completion
app.post('/api/payment/simulate-complete', authenticateToken, async (req, res) => {
  const { transactionId } = req.body;

  if (!transactionId) {
    return res.status(400).json({ error: 'Transaction ID is required for verification.' });
  }

  try {
    const success = await PaymentService.completePaymentTransaction(transactionId);
    if (success) {
      res.json({ success: true, message: 'Payment confirmed. Bandwidth package unlocked and active!' });
    } else {
      res.status(400).json({ error: 'Payment completion validation failed. Transaction mismatch.' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Server error verifying simulated payment.' });
  }
});

app.get('/api/payment/transactions', authenticateToken, (req, res) => {
  const allTxns = dbInstance.getTransactions();
  const userTxns = allTxns.filter(t => t.userId === req.user!.id);
  res.json({ transactions: userTxns });
});

// --- CLEAR DUE BALANCE PAYMENT ---

// Get user's current due balance
app.get('/api/payment/due-balance', authenticateToken, (req, res) => {
  const user = dbInstance.getUsers().find(u => u.id === req.user!.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ dueBalance: user.dueBalance, mainBalance: user.mainBalance });
});

// Initiate clear-due payment via gateway
app.post('/api/payment/clear-due-checkout', authenticateToken, async (req, res) => {
  const { gateway, custPhone } = req.body;
  const user = dbInstance.getUsers().find(u => u.id === req.user!.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  if (user.dueBalance <= 0) return res.status(400).json({ error: 'No due balance to clear.' });
  if (!gateway) return res.status(400).json({ error: 'Payment gateway is required.' });

  try {
    const session = await PaymentService.createClearDueCheckoutSession({
      userId: req.user!.id,
      userEmail: user.email,
      amountUsd: user.dueBalance,
      gateway: gateway as any,
      appUrl: process.env.APP_URL,
      custPhone
    });

    res.json({ checkoutUrl: session.checkoutUrl, transactionId: session.transactionId, external: session.external });
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Failed to create checkout session.' });
  }
});


// 5. ADMIN CONTROL PANEL (Requires Admin role)
const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  next();
};

// List pending mobile proxy orders + available proxies for admin
app.get('/api/admin/mobile-orders', authenticateToken, requireAdmin, (req, res) => {
  const orders = dbInstance.getPendingMobileProxyOrders();
  const availableProxies = dbInstance.getAvailableMobileProxies();
  const allProxies = dbInstance.getMobileProxies();
  const users = dbInstance.getUsers();

  const ordersWithUser = orders.map(o => {
    const user = users.find(u => u.id === o.userId);
    return { ...o, userName: user?.name || 'Unknown', userEmail: user?.email || '' };
  });

  res.json({ orders: ordersWithUser, availableProxies, allProxies });
});

// Admin assigns a proxy from inventory to a pending order
app.post('/api/admin/mobile-orders/:orderId/assign', authenticateToken, requireAdmin, (req, res) => {
  const { orderId } = req.params;
  const { mobileProxyId } = req.body;

  if (!mobileProxyId) {
    return res.status(400).json({ error: 'mobileProxyId is required.' });
  }

  const order = dbInstance.getMobileProxyOrderById(orderId);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  if (order.status !== 'pending') return res.status(400).json({ error: 'Order is not pending.' });

  const proxy = dbInstance.getMobileProxyById(mobileProxyId);
  if (!proxy) return res.status(404).json({ error: 'Proxy not found.' });
  if (proxy.status !== 'available') return res.status(400).json({ error: 'Proxy is not available.' });

  try {
    // Update proxy: assign to user, change status to active
    dbInstance.updateMobileProxy(mobileProxyId, {
      userId: order.userId,
      status: 'active'
    });

    // Update order: mark as assigned, link proxy
    dbInstance.updateMobileProxyOrder(orderId, {
      status: 'assigned',
      mobileProxyId,
      assignedAt: new Date().toISOString()
    });

    dbInstance.log('info', 'proxy', `Mobile proxy ${mobileProxyId} assigned to order ${orderId} (user ${order.userId}).`);
    res.json({ success: true, proxy });
  } catch (e: any) {
    console.error('[/api/admin/mobile-orders/:orderId/assign] Error:', e.message || e);
    res.status(500).json({ error: e.message || 'Failed to assign proxy.' });
  }
});

// Admin lists all mobile proxies in inventory
app.get('/api/admin/mobile-proxies', authenticateToken, requireAdmin, (req, res) => {
  try {
    const proxies = dbInstance.getMobileProxies();
    res.json({ proxies });
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to load proxies' });
  }
});

// Admin adds a proxy to the inventory pool
app.post('/api/admin/mobile-proxies', authenticateToken, requireAdmin, (req, res) => {
  const { ip, port, username, password, planName, countryCode, priceUsd } = req.body;

  if (!ip || !port || !username || !password) {
    return res.status(400).json({ error: 'ip, port, username, password are required.' });
  }

  try {
    const proxy = dbInstance.insertMobileProxy({
      id: `mp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      ip,
      port: String(port),
      username,
      password,
      planName: planName || 'Unknown Plan',
      countryCode: countryCode || '',
      priceUsd: priceUsd || 0,
      protocol: 'socks5',
      status: 'available',
      createdAt: new Date().toISOString()
    });
    dbInstance.log('info', 'proxy', `Admin added proxy to inventory: ${ip}:${port}`);
    res.json({ proxy });
  } catch (e: any) {
    console.error('[/api/admin/mobile-proxies] Error:', e.message || e);
    res.status(500).json({ error: e.message || 'Failed to add proxy.' });
  }
});

// Admin updates proxy status (enable/disable)
app.put('/api/admin/mobile-proxies/:proxyId', authenticateToken, requireAdmin, (req, res) => {
  const { proxyId } = req.params;
  const { status, ip, port, username, password, planName, countryCode, priceUsd } = req.body;
  const proxy = dbInstance.getMobileProxyById(proxyId);

  if (!proxy) {
    return res.status(404).json({ error: 'Proxy not found.' });
  }

  if (status !== undefined && !['available', 'inactive', 'assigned'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be: available, inactive, or assigned.' });
  }

  const updates: Record<string, any> = {};
  if (status !== undefined) updates.status = status;
  if (ip !== undefined) updates.ip = String(ip);
  if (port !== undefined) updates.port = String(port);
  if (username !== undefined) updates.username = String(username);
  if (password !== undefined) updates.password = String(password);
  if (planName !== undefined) updates.planName = String(planName);
  if (countryCode !== undefined) updates.countryCode = String(countryCode);
  if (priceUsd !== undefined) updates.priceUsd = parseFloat(priceUsd) || 0;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No fields to update.' });
  }

  try {
    dbInstance.updateMobileProxy(proxyId, updates);
    dbInstance.log('info', 'proxy', `Admin updated proxy: ${proxy.ip}:${proxy.port}`);
    res.json({ success: true, proxy: dbInstance.getMobileProxyById(proxyId) });
  } catch (e: any) {
    console.error('[/api/admin/mobile-proxies/:proxyId] Error:', e.message || e);
    res.status(500).json({ error: e.message || 'Failed to update proxy.' });
  }
});

// Admin deletes a proxy from inventory
app.delete('/api/admin/mobile-proxies/:proxyId', authenticateToken, requireAdmin, (req, res) => {
  const { proxyId } = req.params;
  const proxy = dbInstance.getMobileProxyById(proxyId);

  if (!proxy) {
    return res.status(404).json({ error: 'Proxy not found.' });
  }

  try {
    dbInstance.deleteMobileProxy(proxyId);
    dbInstance.log('info', 'proxy', `Admin deleted proxy from inventory: ${proxy.ip}:${proxy.port}`);
    res.json({ success: true });
  } catch (e: any) {
    console.error('[/api/admin/mobile-proxies/:proxyId] Error:', e.message || e);
    res.status(500).json({ error: e.message || 'Failed to delete proxy.' });
  }
});

app.get('/api/admin/stats', authenticateToken, requireAdmin, (req, res) => {
  const users = dbInstance.getUsers();
  const orders = dbInstance.getOrders();
  const proxies = dbInstance.getProxies();
  const txns = dbInstance.getTransactions();

  // Metrics
  const totalUsers = users.length;
  const activeOrdersCount = orders.filter(o => o.status === 'active').length;
  const totalProxiesCount = proxies.length;
  const onlineProxiesCount = proxies.filter(p => p.status === 'online').length;

  const totalRevenue = txns
    .filter(t => t.status === 'completed')
    .reduce((acc, t) => acc + t.amountUsd, 0);

  const totalGbPurchased = orders
    .filter(o => o.status === 'active')
    .reduce((acc, o) => acc + o.bandwidthGb, 0);

  const totalGbUsed = orders
    .reduce((acc, o) => acc + o.bandwidthUsedGb, 0);

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

app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
  res.json({ users: dbInstance.getUsers() });
});

// Order history — all purchases (transactions joined with order + user details).
app.get('/api/admin/orders', authenticateToken, requireAdmin, (req, res) => {
  const orders = dbInstance.getOrders();
  const users = dbInstance.getUsers();
  const history = dbInstance.getTransactions().map(t => {
    const o = orders.find(x => x.id === t.orderId);
    const u = users.find(x => x.id === t.userId);
    return {
      id: t.id,
      orderId: t.orderId,
      userEmail: t.userEmail || u?.email || '—',
      userName: u?.name || '',
      packageName: o?.packageName || '—',
      bandwidthGb: o?.bandwidthGb || 0,
      amountUsd: t.amountUsd,
      discountUsd: t.discountUsd || 0,
      couponCode: t.couponCode || '',
      gateway: t.gateway,
      status: t.status,
      createdAt: t.createdAt
    };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ orders: history });
});

app.post('/api/admin/users/status', authenticateToken, requireAdmin, (req, res) => {
  const { userId, isActive, role, password } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  const updates: Partial<any> = {};
  if (isActive !== undefined) updates.isActive = isActive;
  if (role !== undefined) updates.role = role;
  if (password !== undefined) updates.password = password;

  const updated = dbInstance.updateUser(userId, updates);

  if (!updated) {
    return res.status(404).json({ error: 'User profile not found.' });
  }

  dbInstance.log(
    'security',
    'admin',
    `Admin updated status of user ${updated.name} (${updated.email}): ${JSON.stringify(updates)}`
  );

  res.json({ user: updated });
});

// Admin: set a user's wallet Due (amount owed). Due is admin-controlled — it is
// never created automatically by purchases.
app.post('/api/admin/users/due', authenticateToken, requireAdmin, (req, res) => {
  const { userId, due } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required.' });
  const amount = Math.max(0, Math.round((parseFloat(due) || 0) * 100) / 100);
  const updated = dbInstance.updateUser(userId, { dueBalance: amount });
  if (!updated) return res.status(404).json({ error: 'User profile not found.' });
  dbInstance.log('security', 'admin', `Admin set wallet Due for ${updated.email} to $${amount}.`);
  res.json({ user: updated });
});

app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const userId = req.params.id;
  const target = dbInstance.getUsers().find(u => u.id === userId);

  if (!target) {
    return res.status(404).json({ error: 'User profile not found.' });
  }

  if (target.id === 'usr_admin') {
    return res.status(400).json({ error: 'Cannot delete the master administrator account.' });
  }

  // Release the user's reserved traffic on Proxy-Seller. Deleting a sub-user
  // package also removes its IP lists, so this frees the allocation back to the pool.
  const userOrders = dbInstance.getOrders().filter(o => o.userId === userId);
  const subKeys = Array.from(new Set(
    userOrders.map(o => o.subUserPackageKey).filter((k): k is string => !!k)
  ));
  for (const key of subKeys) {
    try {
      await ResidentialService.deleteSubUserPackage(key);
    } catch (e: any) {
      dbInstance.log('warning', 'admin', `Could not release sub-user package ${key} for deleted user: ${e.message}`);
    }
  }

  // Purge the user's local records, then the user.
  const db = (dbInstance as any).read();
  db.orders = db.orders.filter((o: any) => o.userId !== userId);
  db.proxies = db.proxies.filter((p: any) => p.userId !== userId);
  db.transactions = db.transactions.filter((t: any) => t.userId !== userId);
  db.users = db.users.filter((u: any) => u.id !== userId);
  (dbInstance as any).write(db);

  dbInstance.log(
    'security',
    'admin',
    `Admin permanently deleted user ${target.name} (${target.email}); released ${subKeys.length} sub-user allocation(s).`
  );
  res.json({ success: true, message: 'User account and all associated resources deleted.' });
});

app.get('/api/admin/logs', authenticateToken, requireAdmin, (req, res) => {
  res.json({ logs: dbInstance.getLogs() });
});

// Admin Pricing Package management
app.post('/api/admin/packages', authenticateToken, requireAdmin, (req, res) => {
  const { name, bandwidthGb, priceUsd, features } = req.body;

  if (!name || !bandwidthGb || !priceUsd) {
    return res.status(400).json({ error: 'Package Name, GB and Price are required.' });
  }

  const newPkg: ProxyPackage = {
    id: `pkg_${Date.now()}`,
    name,
    bandwidthGb: parseInt(bandwidthGb),
    priceUsd: parseFloat(priceUsd),
    features: Array.isArray(features) ? features : ['HTTP/SOCKS5 Support', 'Instant Provisioning'],
    isActive: true
  };

  dbInstance.insertPackage(newPkg);
  res.status(201).json({ package: newPkg });
});

app.put('/api/admin/packages/:id', authenticateToken, requireAdmin, (req, res) => {
  const pkgId = req.params.id;
  const { name, bandwidthGb, priceUsd, features, isActive } = req.body;

  const updates: Partial<ProxyPackage> = {};
  if (name !== undefined) updates.name = name;
  if (bandwidthGb !== undefined) updates.bandwidthGb = parseInt(bandwidthGb);
  if (priceUsd !== undefined) updates.priceUsd = parseFloat(priceUsd);
  if (features !== undefined) updates.features = features;
  if (isActive !== undefined) updates.isActive = isActive;

  const updated = dbInstance.updatePackage(pkgId, updates);

  if (!updated) {
    return res.status(404).json({ error: 'Pricing package not found.' });
  }

  res.json({ package: updated });
});

app.delete('/api/admin/packages/:id', authenticateToken, requireAdmin, (req, res) => {
  const pkgId = req.params.id;
  const success = dbInstance.deletePackage(pkgId);

  if (!success) {
    return res.status(404).json({ error: 'Pricing package not found.' });
  }

  res.json({ success: true, message: 'Pricing package successfully deleted.' });
});

// Coupon management
app.get('/api/admin/coupons', authenticateToken, requireAdmin, (req, res) => {
  res.json({ coupons: dbInstance.getCoupons() });
});

app.post('/api/admin/coupons', authenticateToken, requireAdmin, (req, res) => {
  const { code, type, value, maxUses, category } = req.body;
  const normCode = String(code || '').trim().toUpperCase();

  if (!normCode || !/^[A-Z0-9_-]{2,32}$/.test(normCode)) {
    return res.status(400).json({ error: 'Code must be 2-32 chars (letters, numbers, - or _).' });
  }
  if (type !== 'percent' && type !== 'fixed') {
    return res.status(400).json({ error: 'Type must be "percent" or "fixed".' });
  }
  const val = parseFloat(value);
  if (!Number.isFinite(val) || val <= 0 || (type === 'percent' && val > 100)) {
    return res.status(400).json({ error: 'Invalid discount value.' });
  }
  if (dbInstance.findCouponByCode(normCode)) {
    return res.status(400).json({ error: 'A coupon with this code already exists.' });
  }

  const coupon: Coupon = {
    id: `cpn_${Date.now()}`,
    code: normCode,
    type,
    value: val,
    isActive: true,
    maxUses: Math.max(0, parseInt(maxUses) || 0),
    usedCount: 0,
    createdAt: new Date().toISOString()
  };
  if (category && ['residential', 'mobile', 'both'].includes(category)) {
    coupon.category = category;
  }
  dbInstance.insertCoupon(coupon);
  res.status(201).json({ coupon });
});

app.post('/api/admin/coupons/:id/toggle', authenticateToken, requireAdmin, (req, res) => {
  const coupon = dbInstance.getCoupons().find(c => c.id === req.params.id);
  if (!coupon) return res.status(404).json({ error: 'Coupon not found.' });
  const updated = dbInstance.updateCoupon(coupon.id, { isActive: !coupon.isActive });
  res.json({ coupon: updated });
});

app.delete('/api/admin/coupons/:id', authenticateToken, requireAdmin, (req, res) => {
  const success = dbInstance.deleteCoupon(req.params.id);
  if (!success) return res.status(404).json({ error: 'Coupon not found.' });
  res.json({ success: true, message: 'Coupon deleted.' });
});

// Country toggler
app.post('/api/admin/countries', authenticateToken, requireAdmin, (req, res) => {
  const { code, isEnabled } = req.body;

  if (!code || isEnabled === undefined) {
    return res.status(400).json({ error: 'Country code and isEnabled parameter required.' });
  }

  const country = dbInstance.updateCountry(code, isEnabled);

  if (!country) {
    return res.status(404).json({ error: 'Country profile code not found.' });
  }

  res.json({ country });
});

// API, Payment & Brand Global Settings management
app.get('/api/admin/settings', authenticateToken, requireAdmin, (req, res) => {
  res.json({
    api: dbInstance.getApiSettings(),
    payment: dbInstance.getPaymentSettings(),
    website: dbInstance.getWebsiteSettings()
  });
});

app.put('/api/admin/settings', authenticateToken, requireAdmin, (req, res) => {
  const { api, payment, website } = req.body;

  if (api) dbInstance.updateApiSettings(api);
  if (payment) dbInstance.updatePaymentSettings(payment);
  if (website) dbInstance.updateWebsiteSettings(website);

  res.json({
    success: true,
    message: 'Global configurations updated and live across all services.'
  });
});

// ============================================================
// NOTICE BOARD — public read, admin write
// ============================================================

// GET /api/notice — any authenticated user can read notices
app.get('/api/notice', authenticateToken, (req, res) => {
  const posts = dbInstance.getNoticePosts();
  res.json({ posts });
});

// POST /api/admin/notice — create a new notice post
app.post('/api/admin/notice', authenticateToken, requireAdmin, (req, res) => {
  const { title, body, tag, isPinned } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: 'title and body are required.' });
  }
  const now = new Date().toISOString();
  const post = dbInstance.insertNoticePost({
    id: `notice_${Date.now()}`,
    title: title.trim(),
    body: body.trim(),
    tag: tag || 'info',
    isPinned: !!isPinned,
    createdAt: now,
    updatedAt: now
  });
  res.json({ post });
});

// PUT /api/admin/notice/:id — update a notice post
app.put('/api/admin/notice/:id', authenticateToken, requireAdmin, (req, res) => {
  const { title, body, tag, isPinned } = req.body;
  const post = dbInstance.updateNoticePost(req.params.id, { title, body, tag, isPinned });
  if (!post) return res.status(404).json({ error: 'Notice post not found.' });
  res.json({ post });
});

// DELETE /api/admin/notice/:id — delete a notice post
app.delete('/api/admin/notice/:id', authenticateToken, requireAdmin, (req, res) => {
  const ok = dbInstance.deleteNoticePost(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Notice post not found.' });
  res.json({ success: true });
});

// ============================================================
// SUPPORT TICKETS
// ============================================================

// POST /api/support — submit a new ticket (authenticated user)
app.post('/api/support', authenticateToken, (req, res) => {
  const { category, message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required.' });
  }
  const user = req.user!;
  const now = new Date().toISOString();
  const ticket = dbInstance.insertTicket({
    id: `TCK-${Date.now()}`,
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    category: category || 'other',
    message: message.trim(),
    status: 'open',
    createdAt: now,
    updatedAt: now
  });
  res.json({ ticket });
});

// GET /api/support/my — get current user's own tickets
app.get('/api/support/my', authenticateToken, (req, res) => {
  const tickets = dbInstance.getTicketsByUser(req.user!.id);
  res.json({ tickets });
});

// GET /api/admin/support — admin: get all tickets
app.get('/api/admin/support', authenticateToken, requireAdmin, (req, res) => {
  const tickets = dbInstance.getAllTickets();
  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in-progress').length;
  res.json({ tickets, openCount, inProgressCount });
});

// PUT /api/admin/support/:id — admin: update ticket status + optional reply
app.put('/api/admin/support/:id', authenticateToken, requireAdmin, (req, res) => {
  const { status, adminReply } = req.body;
  const ticket = dbInstance.updateTicket(req.params.id, { status, adminReply });
  if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
  res.json({ ticket });
});

// DELETE /api/admin/support/:id — admin: delete a ticket
app.delete('/api/admin/support/:id', authenticateToken, requireAdmin, (req, res) => {
  const ok = dbInstance.deleteTicket(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Ticket not found.' });
  res.json({ success: true });
});

// --- HOSTED IP MANAGEMENT ---

app.get('/api/admin/hosted-ips', authenticateToken, requireAdmin, (req, res) => {
  const ips = dbInstance.getHostedIps();
  res.json({ ips });
});

app.post('/api/admin/hosted-ips', authenticateToken, requireAdmin, (req, res) => {
  const { ipAddress } = req.body;
  if (!ipAddress || !ipAddress.trim()) {
    return res.status(400).json({ error: 'IP address is required.' });
  }
  try {
    const ip = dbInstance.insertHostedIp({
      id: `ip_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      ipAddress: ipAddress.trim(),
      status: 'available',
      createdAt: new Date().toISOString()
    });
    dbInstance.log('info', 'admin', `Hosted IP added: ${ipAddress}`);
    res.json({ ip });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to add IP.' });
  }
});

app.put('/api/admin/hosted-ips/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { ipAddress, status } = req.body;
  const ip = dbInstance.getHostedIpById(id);
  if (!ip) return res.status(404).json({ error: 'IP not found.' });
  try {
    const updated = dbInstance.updateHostedIp(id, {
      ...(ipAddress && { ipAddress }),
      ...(status && { status })
    });
    if (!updated) return res.status(500).json({ error: 'Failed to update IP.' });
    dbInstance.log('info', 'admin', `Hosted IP updated: ${id}`);
    res.json({ ip: updated });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to update IP.' });
  }
});

app.delete('/api/admin/hosted-ips/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const ip = dbInstance.getHostedIpById(id);
  if (!ip) return res.status(404).json({ error: 'IP not found.' });
  if (ip.status === 'assigned') {
    return res.status(400).json({ error: 'Cannot delete assigned IP. Unassign first.' });
  }
  try {
    dbInstance.deleteHostedIp(id);
    dbInstance.log('info', 'admin', `Hosted IP deleted: ${ip.ipAddress}`);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to delete IP.' });
  }
});

// ---------------------------------------------------------------------------
// BANDWIDTH ENFORCEMENT
//
// Proxy-Seller does not hard-stop a sub-user package when it reaches its
// traffic limit — a customer can overshoot (we have observed a package at
// -53 MB left), and every overshot byte is billed to us at our own per-GB
// rate. This sweep revokes a customer's proxy lists upstream as soon as their
// package is exhausted, so consumption stops at what they actually paid for.
//
// It reuses the 60s-cached sub-user snapshot, so it costs no extra upstream
// calls. Worst-case overshoot is therefore one cache window rather than
// unbounded.
// ---------------------------------------------------------------------------
const ENFORCE_INTERVAL_MS = 60 * 1000;

// We sell bandwidth in DECIMAL gigabytes: 1 GB = 1000 MB = 1,000,000,000 bytes
// (not the 1 GiB / 1024 MB that Proxy-Seller reserves internally). The cutoff is
// therefore computed from the order, so a "1 GB" plan stops at exactly 1000 MB.
const BYTES_PER_GB = 1000 * 1000 * 1000;

export async function enforceBandwidthLimits(): Promise<void> {
  const { live, usage } = await ResidentialService.getSubUserUsage();
  // Never revoke on an unverified snapshot — a transient API failure must not
  // wipe out working proxies.
  if (!live) return;

  const activeOrders = dbInstance
    .getOrders()
    .filter(o => o.status === 'active' && o.subUserPackageKey);

  for (const order of activeOrders) {
    const u = usage[order.subUserPackageKey!];
    if (!u) continue;
    const limitBytes = Math.round(order.bandwidthGb * BYTES_PER_GB);
    if (u.usedBytes < limitBytes) continue;

    const proxies = dbInstance.getProxies().filter(p => p.orderId === order.id);
    for (const p of proxies) {
      try {
        await ResidentialService.deleteList(p.listId || p.id, p.subUserPackageKey);
        // Keep the record so the customer can still see the proxy and why it
        // stopped; the upstream list is gone, so it can never carry traffic.
        dbInstance.updateProxy(p.id, { status: 'offline' });
      } catch (e: any) {
        dbInstance.log('warning', 'proxy', `Could not revoke ${p.id} on exhaustion: ${e.message}`);
      }
    }

    dbInstance.updateOrder(order.id, { status: 'expired' });
    dbInstance.log(
      'warning',
      'proxy',
      `Bandwidth exhausted for order ${order.id} (${Math.round(u.usedBytes / 1e6)}MB of ` +
        `${Math.round(limitBytes / 1e6)}MB) — ${proxies.length} proxy(ies) revoked.`
    );
  }
}

if (process.env.NODE_ENV === 'production') {
  setInterval(() => { enforceBandwidthLimits().catch(() => { /* logged inside */ }); }, ENFORCE_INTERVAL_MS);
}

export { app };
export default app;
