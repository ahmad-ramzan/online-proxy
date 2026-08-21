/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Server, Key, LayoutDashboard, Compass, Lock,
  Loader2, LogOut, Code, AlertTriangle, Users, Database, ArrowLeft, Globe, Zap,
  HelpCircle, PlayCircle, Menu, X, Megaphone, Pin, Tag, Bell, ChevronDown, Settings,
  Edit2, Save, Image, ExternalLink
} from 'lucide-react';
import { User, ProxyPackage, CreatedProxy, ProxyOrder, PaymentTransaction } from './types';
import { api } from './services/api';

// Component Imports
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import CreateProxy from './components/CreateProxy';
import CheckoutSimulator from './components/CheckoutSimulator';
import AdminPanel from './components/AdminPanel';
import GoogleSignInButton from './components/GoogleSignInButton';
import CheckoutModal from './components/CheckoutModal';

// Convert a YouTube URL (watch / youtu.be / embed / shorts) or a bare 11-char id
// into an embeddable player URL. Returns null if it can't be parsed.
function toYouTubeEmbed(url: string): string | null {
  if (!url) return null;
  const u = url.trim();
  const m = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/)
    || u.match(/^([A-Za-z0-9_-]{11})$/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

const complianceRows = [
  { label: 'Live Website/App URL', value: 'https://proxygpt.online' },
  { label: 'IP Address (Web/App Server)', value: 'Domain-based hosting for proxygpt.online; server IP may vary by deployment or CDN routing.' },
  { label: 'Privacy Policy & Data Security URL', value: 'https://proxygpt.online/privacy-policy', href: 'https://proxygpt.online/privacy-policy' },
  { label: 'Return-Refund Policy URL', value: 'https://proxygpt.online/refund-policy', href: 'https://proxygpt.online/refund-policy' },
  { label: 'Is the Website/App currently Live?', value: 'Yes' },
  { label: 'Is the primary transaction currency BDT?', value: 'Yes' }
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  // Navigation: 'home' | 'login' | 'signup' | 'dashboard' | 'admin'
  const [page, setPage] = useState<string>('home');
  // Subtab inside dashboard: 'overview' | 'create-proxy' | 'pricing' | 'transactions' | 'video' | 'notice-board' | 'settings'
  const [dashboardTab, setDashboardTab] = useState<'overview' | 'create-proxy' | 'pricing' | 'transactions' | 'video' | 'notice-board' | 'settings'>('overview');
  
  // DB States
  const [packages, setPackages] = useState<ProxyPackage[]>([]);
  const [myProxies, setMyProxies] = useState<CreatedProxy[]>([]);
  const [myOrders, setMyOrders] = useState<ProxyOrder[]>([]);
  const [myTransactions, setMyTransactions] = useState<PaymentTransaction[]>([]);
  const [usage, setUsage] = useState<{ live: boolean; usedGb: number; limitGb: number } | null>(null);

  // Public site config (for Google Sign-In)
  const [googleClientId, setGoogleClientId] = useState('');
  const [enableGoogleAuth, setEnableGoogleAuth] = useState(true);
  const [tutorialVideoUrl, setTutorialVideoUrl] = useState('');
  const [pinnedCountries, setPinnedCountries] = useState('US, GB, CA');
  const [zinipayEnabled, setZinipayEnabled] = useState(false);
  const [gateways, setGateways] = useState<string[]>(['credit_card', 'paystation']);

  // Checkout modal (coupon entry before payment)
  const [checkoutPkg, setCheckoutPkg] = useState<ProxyPackage | null>(null);

  // Mobile sidebar drawer (client dashboard portal)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const selectTab = (t: 'overview' | 'create-proxy' | 'pricing' | 'transactions' | 'video' | 'notice-board' | 'settings') => {
    setDashboardTab(t);
    setSidebarOpen(false);
  };

  // Notice board state
  const [noticePosts, setNoticePosts] = useState<import('./types').NoticePost[]>([]);
  const loadNoticePosts = async () => {
    try { setNoticePosts(await api.notice.getPosts()); } catch { /* non-fatal */ }
  };
  
  // Loading & Error boundary states
  const [appLoading, setAppLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // Form input bindings
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');

  // Active Checkout state
  const [activeCheckout, setActiveCheckout] = useState<{
    transactionId: string;
    orderId: string;
    amount: number;
    gateway: 'stripe' | 'crypto' | 'paypal' | 'credit_card';
  } | null>(null);

  // Support Helpdesk state
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [checkoutNotice, setCheckoutNotice] = useState<{ type: 'success' | 'pending' | 'cancelled' | 'failed'; text: string } | null>(null);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportCategory, setSupportCategory] = useState('technical');
  const [supportTickets, setSupportTickets] = useState<import('./types').SupportTicket[]>([]);
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState('');

  // Forgot Password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotMessage('');
    setForgotSubmitting(true);
    try {
      const res = await api.auth.forgotPassword(forgotEmail);
      setForgotMessage(res.message);
    } catch (err: any) {
      setForgotError(err.message || 'Failed to submit password recovery request.');
    } finally {
      setForgotSubmitting(false);
    }
  };

  // Profile Edit State
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPicUrl, setEditPicUrl] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setEditPicUrl(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      const updatedUser = await api.auth.updateProfile(editName, editPicUrl, editPassword || undefined);
      setUser(updatedUser);
      setEditingProfile(false);
      setEditPassword('');
    } catch (e: any) {
      alert(e.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const loadMyTickets = async () => {
    try { setSupportTickets(await api.support.getMyTickets()); } catch { /* non-fatal */ }
  };

  // Initialize Client App State on load
  const initApp = async () => {
    try {
      // Load packages first
      const pkgs = await api.settings.getPackages();
      setPackages(pkgs);

      // Load public config (Google Sign-In client id, feature flags)
      try {
        const pub = await api.settings.getPublicConfig();
        setGoogleClientId(pub.website.googleClientId || '');
        setEnableGoogleAuth(pub.website.enableGoogleAuth);
        setTutorialVideoUrl(pub.website.tutorialVideoUrl || '');
        if (pub.website.pinnedCountries) setPinnedCountries(pub.website.pinnedCountries);
        if (Array.isArray(pub.gateways)) setGateways(pub.gateways);
        setZinipayEnabled(pub.zinipayEnabled === true);
      } catch { /* non-fatal */ }

      // Validate session token if stored
      const activeUser = await api.auth.getMe();
      if (activeUser) {
        setUser(activeUser);
        setToken(localStorage.getItem('proxygpt_token'));
        
        // Load secure ledger listings
        const [prox, ord, txns] = await Promise.all([
          api.proxy.getMyProxies(),
          api.proxy.getOrders(),
          api.payment.getTransactions()
        ]);
        setMyProxies(prox);
        setMyOrders(ord);
        setMyTransactions(txns);
        // Usage is fetched separately so slow provider calls never block the ledger.
        api.proxy.getUsage().then(setUsage).catch(() => {});

        // Redirect to panel if logged in
        setPage(activeUser.role === 'admin' ? 'admin' : 'dashboard');

        // Load notice posts for client dashboard
        loadNoticePosts();

        // Load user's support tickets
        loadMyTickets();

        // Handle return from the hosted checkout (?checkout=success|pending|cancelled|failed)
        const cp = new URLSearchParams(window.location.search).get('checkout');
        if (cp === 'success' || cp === 'pending' || cp === 'cancelled' || cp === 'failed') {
          setDashboardTab('overview');
          if (cp === 'success') setCheckoutNotice({ type: 'success', text: 'Payment successful! Your bandwidth package is now active.' });
          else if (cp === 'pending') setCheckoutNotice({ type: 'pending', text: 'Payment received — awaiting confirmation. Your package will activate shortly.' });
          else if (cp === 'failed') setCheckoutNotice({ type: 'failed', text: 'Payment failed — no charge was made. Please try again or use another method.' });
          else setCheckoutNotice({ type: 'cancelled', text: 'Checkout was cancelled. No payment was made.' });
          window.history.replaceState({}, '', '/');
        }
      }

      // Deep-link support for public legal pages, so anyone (including payment
      // gateway reviewers) can open them by direct URL — even while logged in.
      const legalRoutes: Record<string, string> = {
        '/about-us': 'about-us',
        '/about': 'about-us',
        '/privacy-policy': 'privacy-policy',
        '/terms-of-service': 'terms-of-service',
        '/terms': 'terms-of-service',
        '/refund-policy': 'refund-policy',
        '/refund': 'refund-policy',
        '/technical-compliance': 'technical-compliance',
        '/compliance': 'technical-compliance'
      };
      const path = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
      if (legalRoutes[path]) setPage(legalRoutes[path]);
    } catch (e) {
      console.error('Core initialize failed: ', e);
    } finally {
      setAppLoading(false);
    }
  };

  useEffect(() => {
    initApp();
  }, []);

  // Action: Synchronize current listings
  const syncLedgerData = async () => {
    if (!localStorage.getItem('proxygpt_token')) return;
    try {
      const [prox, ord, txns] = await Promise.all([
        api.proxy.getMyProxies(),
        api.proxy.getOrders(),
        api.payment.getTransactions()
      ]);
      setMyProxies(prox);
      setMyOrders(ord);
      setMyTransactions(txns);
      // Usage is fetched separately so slow provider calls never block the ledger.
      api.proxy.getUsage().then(setUsage).catch(() => {});
    } catch (e) {
      console.error('Ledger sync failed:', e);
    }
  };

  // Action: Standard Email/Password Auth Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setActionLoading(true);
    try {
      const res = await api.auth.login(authEmail, authPassword);
      setUser(res.user);
      setToken(res.token);
      await syncLedgerData();
      
      setPage(res.user.role === 'admin' ? 'admin' : 'dashboard');
      setDashboardTab('overview');
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Verify credentials.');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Signup/Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setActionLoading(true);
    try {
      const res = await api.auth.register(authName, authEmail, authPassword);
      setUser(res.user);
      setToken(res.token);
      await syncLedgerData();
      
      setPage('dashboard');
      setDashboardTab('overview');
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Real Google Sign-In — verify the Google ID token server-side.
  const handleGoogleCredential = async (credential: string) => {
    setAuthError('');
    setActionLoading(true);
    try {
      const res = await api.auth.googleLogin(credential);
      setUser(res.user);
      setToken(res.token);
      await syncLedgerData();

      setPage(res.user.role === 'admin' ? 'admin' : 'dashboard');
      setDashboardTab('overview');
    } catch (err: any) {
      setAuthError(err.message || 'Google authentication failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Logout session
  const handleLogout = () => {
    api.auth.logout();
    setUser(null);
    setToken(null);
    setPage('home');
    setActiveCheckout(null);
  };

  // Open the checkout modal (coupon entry) for a package.
  const openCheckout = (pkg: ProxyPackage) => {
    if (!token) { setPage('login'); return; }
    setCheckoutPkg(pkg);
  };

  // Action: Initiate purchase & create session url
  const handlePurchaseBandwidth = async (pkg: ProxyPackage, gatewaySelected: 'stripe' | 'crypto' | 'paypal' | 'credit_card' | 'paystation' | 'cryptomus' = 'stripe', couponCode?: string, custPhone?: string) => {
    if (!token) {
      // Redirect to login first
      setPage('login');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.payment.createCheckoutSession({
        packageId: pkg.id,
        amountUsd: pkg.priceUsd,
        gateway: gatewaySelected,
        couponCode: couponCode || undefined,
        custPhone: custPhone || undefined
      });

      // External gateway (ZiniPay hosted checkout) — redirect the browser to it.
      if (res.external || /^https?:\/\//i.test(res.checkoutUrl)) {
        window.location.href = res.checkoutUrl;
        return;
      }

      // In-app simulated checkout — parse the simulated URL parameters.
      const urlParams = new URLSearchParams(res.checkoutUrl.split('?')[1]);
      setActiveCheckout({
        transactionId: urlParams.get('transactionId') || '',
        orderId: urlParams.get('orderId') || '',
        amount: parseFloat(urlParams.get('amount') || '0'),
        gateway: (urlParams.get('gateway') as any) || 'stripe'
      });
      setPage('checkout');
    } catch (e: any) {
      alert(e.message || 'Unable to instantiate payment gateway session.');
    } finally {
      setActionLoading(false);
    }
  };

  if (appLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl overflow-hidden animate-pulse shadow-lg shadow-blue-500/20">
          <img src="/logo.jpeg" alt="ProxyGPT" className="w-full h-full object-cover" />
        </div>
        <p className="text-xs text-slate-500 animate-pulse font-mono tracking-wider uppercase">Bootstrapping Proxibity Core...</p>
      </div>
    );
  }

  // If in custom modular simulation checkout screen
  if (page === 'checkout' && activeCheckout) {
    return (
      <CheckoutSimulator 
        transactionId={activeCheckout.transactionId}
        orderId={activeCheckout.orderId}
        amount={activeCheckout.amount}
        gateway={activeCheckout.gateway}
        onCancel={() => {
          setPage('dashboard');
          setDashboardTab('overview');
        }}
        onPaymentSuccess={async () => {
          await syncLedgerData();
          setPage('dashboard');
          setDashboardTab('overview');
          setActiveCheckout(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white">

      {/* Checkout return banner (from ZiniPay hosted payment) */}
      {checkoutNotice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] max-w-md w-[92%] animate-fade-in">
          <div className={`flex items-start gap-3 px-4 py-3 rounded-2xl border backdrop-blur-md shadow-2xl ${
            checkoutNotice.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
              : checkoutNotice.type === 'pending'
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-200'
                : 'bg-red-500/15 border-red-500/30 text-red-200'
          }`}>
            <span className="text-sm font-bold mt-0.5">{checkoutNotice.type === 'success' ? '✓' : checkoutNotice.type === 'pending' ? '⏳' : '✕'}</span>
            <p className="text-xs font-semibold flex-1 leading-relaxed">{checkoutNotice.text}</p>
            <button onClick={() => setCheckoutNotice(null)} className="text-current/70 hover:text-current text-sm font-bold cursor-pointer">✕</button>
          </div>
        </div>
      )}


      {/* Landing Page Route */}
      {page === 'home' && (
        <LandingPage 
          packages={packages}
          onNavigate={(pageId) => {
            if (pageId === 'dashboard-support') {
              if (token) {
                setPage(user?.role === 'admin' ? 'admin' : 'dashboard');
                setDashboardTab('overview');
                setShowSupportModal(true);
              } else {
                setPage('login');
              }
            } else {
              setPage(pageId);
              setDashboardTab('overview');
              const legalPaths: Record<string, string> = {
                'about-us': '/about-us',
                'privacy-policy': '/privacy-policy',
                'terms-of-service': '/terms-of-service',
                'refund-policy': '/refund-policy',
                'technical-compliance': '/technical-compliance'
              };
              if (legalPaths[pageId]) window.history.pushState({}, '', legalPaths[pageId]);
            }
          }}
          onBuyPackage={openCheckout}
          isAuthenticated={!!token}
        />
      )}

      {/* Terms of Service Route */}
      {page === 'terms-of-service' && (
        <div className="min-h-screen relative overflow-hidden flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 z-10 bg-slate-950">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 max-w-3xl w-full backdrop-blur-xl shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-400" />
                Terms of Service
              </h1>
              <button 
                onClick={() => setPage('home')}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
              </button>
            </div>

            <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar text-left">
              <h2 className="text-base font-bold text-white mt-4">Welcome to Proxy GPT Online</h2>
              <p>By accessing or using our website and services, you agree to be bound by these Terms of Service.</p>

              <h2 className="text-base font-bold text-white mt-4">Acceptance of Terms</h2>
              <p>By creating an account, purchasing a service, or using Proxy GPT Online, you acknowledge that you have read, understood, and agreed to these Terms.</p>

              <h2 className="text-base font-bold text-white mt-4">Services</h2>
              <p>Proxy GPT Online provides residential proxy services for lawful business and personal use. We reserve the right to modify, suspend, or discontinue any service at any time without prior notice.</p>

              <h2 className="text-base font-bold text-white mt-4">Account Responsibility</h2>
              <p>You are responsible for maintaining the confidentiality of your account credentials. Any activity conducted through your account is your responsibility.</p>

              <h2 className="text-base font-bold text-white mt-4">Acceptable Use</h2>
              <p>You agree not to use our services for any illegal, abusive, or harmful activities, including but not limited to:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
                <li>Spam or unsolicited communications</li>
                <li>Hacking or unauthorized access</li>
                <li>Phishing or identity theft</li>
                <li>Fraud or financial crimes</li>
                <li>Malware distribution</li>
                <li>DDoS attacks</li>
                <li>Copyright infringement</li>
                <li>Any activity that violates applicable laws or regulations</li>
              </ul>
              <p className="font-semibold text-red-400">Violation of this policy may result in immediate suspension or termination without prior notice.</p>

              <h2 className="text-base font-bold text-white mt-4">Payments</h2>
              <p>All services are prepaid. Orders are activated after successful payment confirmation.</p>

              <h2 className="text-base font-bold text-white mt-4">Refund Policy</h2>
              <p>All proxy purchases are non-refundable once the service has been delivered or activated. Refunds may only be considered if Proxy GPT Online determines that the service cannot be provided due to a verified technical issue on our side.</p>

              <h2 className="text-base font-bold text-white mt-4">Package Duration</h2>
              <p>Our proxy packages do not have a mandatory renewal period. However, for optimal performance and access to updated IP resources, we recommend purchasing a new package at least once per month.</p>

              <h2 className="text-base font-bold text-white mt-4">Service Availability</h2>
              <p>While we strive to provide reliable services, we do not guarantee uninterrupted or error-free operation. Temporary maintenance or network interruptions may occur.</p>

              <h2 className="text-base font-bold text-white mt-4">Intellectual Property</h2>
              <p>All website content, logos, branding, software, and materials remain the exclusive property of Proxy GPT Online.</p>

              <h2 className="text-base font-bold text-white mt-4">Limitation of Liability</h2>
              <p>Proxy GPT Online shall not be liable for any indirect, incidental, consequential, or special damages arising from the use or inability to use our services.</p>

              <h2 className="text-base font-bold text-white mt-4">Termination</h2>
              <p>We reserve the right to suspend or permanently terminate any account that violates these Terms or engages in activities that may harm our platform or other users.</p>

              <h2 className="text-base font-bold text-white mt-4">Changes to These Terms</h2>
              <p>We may update these Terms of Service at any time. Continued use of our services after changes become effective constitutes acceptance of the revised Terms.</p>

              <h2 className="text-base font-bold text-white mt-4">Contact</h2>
              <p>For questions regarding these Terms, please contact our support team through our official website.</p>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Route */}
      {page === 'privacy-policy' && (
        <div className="min-h-screen relative overflow-hidden flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 z-10 bg-slate-950">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 max-w-3xl w-full backdrop-blur-xl shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-6 h-6 text-blue-400" />
                Privacy Policy
              </h1>
              <button 
                onClick={() => setPage('home')}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
              </button>
            </div>

            <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar text-left">
              <h2 className="text-base font-bold text-white mt-4">Introduction</h2>
              <p>Welcome to Proxy GPT Online. We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our website and services.</p>

              <h2 className="text-base font-bold text-white mt-4">Information We Collect</h2>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
                <li><strong>Account Information:</strong> Email address, name, and profile details provided during registration.</li>
                <li><strong>Connection Logs:</strong> Temporary metadata regarding proxy creation and usage statistics (bandwidth consumed). We do not inspect or record the contents of your encrypted traffic.</li>
                <li><strong>Payment Details:</strong> Transaction reference IDs provided by payment gateways (ZiniPay, Stripe, PayPal, Crypto). We do not store raw credit card numbers.</li>
              </ul>

              <h2 className="text-base font-bold text-white mt-4">How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
                <li>Provision and maintain your proxy server allocations.</li>
                <li>Process payments and prevent financial fraud.</li>
                <li>Improve server network routing and performance.</li>
                <li>Comply with legal obligations and enforce our Terms of Service.</li>
              </ul>

              <h2 className="text-base font-bold text-white mt-4">Data Security</h2>
              <p>We implement robust technical and organizational security measures to protect your account credentials and proxy gateway parameters from unauthorized access or disclosure.</p>

              <h2 className="text-base font-bold text-white mt-4">Cookies</h2>
              <p>We use essential local storage data and session variables to keep you securely signed in to your client panel.</p>

              <h2 className="text-base font-bold text-white mt-4">Contact Support</h2>
              <p>If you have any questions about this Privacy Policy or your personal data, you can contact our support team at <span className="font-bold text-blue-400">admin@proxygpt.online</span>.</p>
            </div>
          </div>
        </div>
      )}

      {/* Return & Refund Policy Route */}
      {page === 'refund-policy' && (
        <div className="min-h-screen relative overflow-hidden flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 z-10 bg-slate-950">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 max-w-3xl w-full backdrop-blur-xl shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-400" />
                Return &amp; Refund Policy
              </h1>
              <button
                onClick={() => { setPage('home'); window.history.pushState({}, '', '/'); }}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
              </button>
            </div>

            <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar text-left">
              <p>At Proxy GPT Online, we want every customer to be satisfied with our residential proxy services. This Return &amp; Refund Policy explains when a refund may be issued.</p>

              <h2 className="text-base font-bold text-white mt-4">Nature of the Service</h2>
              <p>Our proxy plans are digital services delivered instantly. Because bandwidth and proxy access are consumed as soon as a proxy is created, purchases are generally <span className="font-semibold text-white">non-refundable once the service has been delivered or activated</span>.</p>

              <h2 className="text-base font-bold text-white mt-4">When a Refund May Be Granted</h2>
              <p>A refund may be considered if <span className="font-semibold text-white">all</span> of the following apply:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>The service could not be provided due to a verified technical fault on our side.</li>
                <li>No meaningful bandwidth has been consumed from the plan.</li>
                <li>The request is made within <span className="font-semibold text-white">24 hours</span> of purchase.</li>
              </ul>

              <h2 className="text-base font-bold text-white mt-4">Non-Refundable Cases</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Bandwidth has already been used (partially or fully).</li>
                <li>The account was suspended or terminated for violating our Terms of Service.</li>
                <li>Incorrect plan selected, or change of mind after activation.</li>
                <li>Issues caused by the customer's own network, tools, or misuse.</li>
              </ul>

              <h2 className="text-base font-bold text-white mt-4">How to Request a Refund</h2>
              <p>Email <span className="font-bold text-blue-400">admin@proxygpt.online</span> or open a support ticket from your dashboard with your account email, order ID, and a description of the issue. Eligible refunds are processed back to the original payment method within <span className="font-semibold text-white">7–10 business days</span>.</p>

              <h2 className="text-base font-bold text-white mt-4">Currency</h2>
              <p>Plans are priced in USD and charged in Bangladeshi Taka (BDT) via our payment provider. Refunds are issued in BDT at the applicable conversion rate.</p>

              <h2 className="text-base font-bold text-white mt-4">Contact</h2>
              <p>For any refund questions, contact our support team at <span className="font-bold text-blue-400">admin@proxygpt.online</span>.</p>
            </div>
          </div>
        </div>
      )}

      {/* Technical & Compliance Information Route */}
      {page === 'technical-compliance' && (
        <div className="min-h-screen relative overflow-hidden flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 z-10 bg-slate-950">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 max-w-3xl w-full backdrop-blur-xl shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Server className="w-6 h-6 text-blue-400" />
                Technical &amp; Compliance Information
              </h1>
              <button
                onClick={() => { setPage('home'); window.history.pushState({}, '', '/'); }}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60">
              {complianceRows.map((row) => (
                <div key={row.label} className="grid grid-cols-1 sm:grid-cols-[260px_1fr] border-b border-slate-800 last:border-b-0">
                  <div className="bg-slate-900/70 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-300">
                    {row.label}
                  </div>
                  <div className="px-4 py-3 text-sm text-slate-200 break-words">
                    {row.href ? (
                      <a
                        href={row.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {row.value}
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    ) : (
                      row.value
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-3 text-left">
              <p>ProxyGPT Online is a live web application for residential proxy package purchases, account access, payment processing, and customer support.</p>
              <p>Customer payment transactions are processed in Bangladeshi Taka (BDT). Package prices may be displayed in USD for comparison, then converted to BDT at checkout where applicable.</p>
            </div>
          </div>
        </div>
      )}

      {/* About Us Route */}
      {page === 'about-us' && (
        <div className="min-h-screen relative overflow-hidden flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 z-10 bg-slate-950">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 max-w-3xl w-full backdrop-blur-xl shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-400" />
                About Us
              </h1>
              <button
                onClick={() => { setPage('home'); window.history.pushState({}, '', '/'); }}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
              </button>
            </div>

            <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-4 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar text-left">
              <h2 className="text-base font-bold text-white">Business Information</h2>
              <ul className="space-y-1.5">
                <li><span className="text-slate-500">Business Name:</span> <span className="font-semibold text-white">Ryan Shoe Place</span></li>
                <li><span className="text-slate-500">Online Service / Brand:</span> <span className="font-semibold text-white">ProxyGPT.online</span></li>
                <li><span className="text-slate-500">Trade License No.:</span> <span className="font-semibold text-white">814</span></li>
                <li>
                  <span className="text-slate-500">Business Address:</span> Village/Road: Farakpur, Post Office: Taragunia – 7051,
                  Upazila: Daulatpur, District: Kushtia, Country: Bangladesh
                </li>
                <li><span className="text-slate-500">Director:</span> <span className="font-semibold text-white">Md. Rasheduzzaman</span></li>
                <li><span className="text-slate-500">Managing Director:</span> <span className="font-semibold text-white">Md. Rasel Sarker</span></li>
              </ul>

              <h2 className="text-base font-bold text-white mt-4">About ProxyGPT.online</h2>
              <p>ProxyGPT.online is a proxy service platform providing reliable Residential and Mobile Proxy solutions for individuals, businesses, developers, freelancers, and online professionals.</p>
              <p>Our Residential Proxies provide IP addresses associated with real residential networks, while our Mobile Proxies use mobile network IPs to provide reliable connectivity and flexible location-based access.</p>
              <p>For users in Bangladesh, proxies can be useful for legitimate purposes such as market research, SEO, web development, software testing, advertising verification, online business operations, data research, and testing websites or services from different locations. They can also help businesses and developers work with international platforms when certain content or services are location-dependent.</p>
              <p>Our goal is to provide Bangladeshi users with a reliable and easy-to-use proxy platform for legitimate online activities, with flexible plans and dependable service.</p>
              <p>ProxyGPT.online does not support or promote illegal activities. Our services are intended for lawful and legitimate use only. Users are responsible for complying with applicable laws, website terms of service, and our acceptable-use policies.</p>
              <p className="font-semibold text-white">Our mission is simple: reliable proxies, transparent service, and a better experience for every customer.</p>
            </div>
          </div>
        </div>
      )}

      {/* Contact Support Route */}
      {page === 'contact-support' && (
        <div className="min-h-screen relative overflow-hidden flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 z-10 bg-slate-950">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 max-w-3xl w-full backdrop-blur-xl shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-blue-400" />
                Contact Support
              </h1>
              <button 
                onClick={() => setPage('home')}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
              </button>
            </div>

            <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar text-left">
              <div className="space-y-2">
                <h2 className="text-base font-bold text-white">ProxyGPT Support Helpdesk</h2>
                <p>
                  We are here to assist you 24/7/365 with all inquiries, including technical routing difficulties, billing questions, and custom enterprise or reseller API integrations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/60 border border-slate-850 p-5 rounded-2xl space-y-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide text-blue-400">Direct Email</h3>
                  <p className="text-xs text-slate-400">Drop us an email at any time. Our ticket dispatchers will route it to the appropriate engineer.</p>
                  <a href="mailto:admin@proxygpt.online" className="inline-block text-sm font-bold text-white hover:text-blue-400 transition-colors">
                    admin@proxygpt.online
                  </a>
                </div>

                <div className="bg-slate-950/60 border border-slate-855 p-5 rounded-2xl space-y-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide text-indigo-400">Telegram Support</h3>
                  <p className="text-xs text-slate-400">Connect directly with our support team on Telegram for real-time live assistance.</p>
                  <a 
                    href="https://t.me/proxygptonline" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-block text-sm font-bold text-white hover:text-indigo-400 transition-colors"
                  >
                    @proxygptonline
                  </a>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-6 space-y-4">
                <h2 className="text-base font-bold text-white">Direct Ticket Submission</h2>
                
                {token ? (
                  <div>
                    {ticketSuccess ? (
                      <div className="text-center py-6 space-y-4 bg-slate-950/40 border border-slate-850 rounded-2xl">
                        <div className="w-12 h-12 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mx-auto border border-green-500/20 text-lg font-bold">
                          ✓
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">Ticket Submitted Successfully!</h4>
                          <p className="text-xs text-slate-400 mt-1">Our team will review your query shortly.</p>
                        </div>
                        <button 
                          onClick={() => {
                            setTicketSuccess('');
                            setSupportMessage('');
                          }}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-xl transition-colors cursor-pointer"
                        >
                          Create Another Ticket
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        if (!supportMessage.trim() || supportSubmitting) return;
                        setSupportSubmitting(true);
                        try {
                          await api.support.submitTicket(supportCategory, supportMessage);
                          await loadMyTickets();
                          setTicketSuccess('submitted');
                          setSupportMessage('');
                        } catch (err: any) {
                          alert(err.message || 'Failed to submit ticket.');
                        } finally {
                          setSupportSubmitting(false);
                        }
                      }} className="space-y-4 bg-slate-950/40 border border-slate-850 p-6 rounded-2xl">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Category</label>
                          <select 
                            value={supportCategory}
                            onChange={(e) => setSupportCategory(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                          >
                            <option value="technical">Technical Routing (IP issues)</option>
                            <option value="billing">Billing & Refills</option>
                            <option value="reseller">Reseller API integration</option>
                            <option value="other">Other Inquiry</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Message</label>
                          <textarea 
                            required
                            rows={4}
                            placeholder="Describe your technical difficulty or reseller API questions..."
                            value={supportMessage}
                            onChange={(e) => setSupportMessage(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                          ></textarea>
                        </div>

                        <button 
                          type="submit"
                          disabled={supportSubmitting}
                          className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-xs font-bold text-white rounded-xl shadow-md cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                          {supportSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Support Ticket'}
                        </button>
                      </form>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-4">
                    <p className="text-xs text-slate-400">
                      To submit a direct support ticket through your client panel, please log in to your account.
                    </p>
                    <button
                      onClick={() => setPage('login')}
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-xs font-bold text-white rounded-xl shadow-md cursor-pointer transition-all"
                    >
                      Log In to Client Portal
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      

      {/* LOGIN ROUTE */}
      {page === 'login' && (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
          {/* Backdrops */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none"></div>

          <div className="w-full max-w-md bg-slate-900/40 border border-slate-900 rounded-3xl p-8 backdrop-blur-xl relative z-10 space-y-6">
            <div className="text-center space-y-2">
              <div 
                onClick={() => setPage('home')}
                className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg shadow-blue-500/20 mx-auto cursor-pointer hover:scale-105 transition-transform"
              >
                <img src="/logo.jpeg" alt="ProxyGPT" className="w-full h-full object-cover" />
              </div>
              <h2 className="text-2xl font-black text-white">ProxyGPT Online</h2>
              <p className="text-xs text-slate-400">Premium High-Speed Tunnel Gateway</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Client Email Address</label>
                <input 
                  type="email" 
                  required 
                  placeholder="name@email.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500" 
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Security Password</label>
                  <span 
                    onClick={() => {
                      setForgotEmail(authEmail);
                      setForgotError('');
                      setForgotMessage('');
                      setShowForgotModal(true);
                    }}
                    className="text-[10px] text-slate-500 hover:text-white cursor-pointer"
                  >
                    Forgot?
                  </span>
                </div>
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500" 
                />
              </div>

              {authError && (
                <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{authError}</p>
              )}

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 rounded-xl font-bold text-xs text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log In Account'}
              </button>
            </form>

            {enableGoogleAuth && googleClientId && (
              <>
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-850"></div>
                  <span className="flex-shrink mx-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">OR</span>
                  <div className="flex-grow border-t border-slate-850"></div>
                </div>
                <GoogleSignInButton clientId={googleClientId} onSuccess={handleGoogleCredential} />
              </>
            )}

            <div className="text-center text-xs text-slate-500">
              New client?{' '}
              <span onClick={() => setPage('signup')} className="text-blue-400 font-semibold hover:underline cursor-pointer">
                Create an account
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SIGNUP ROUTE */}
      {page === 'signup' && (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
          {/* Backdrops */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none"></div>

          <div className="w-full max-w-md bg-slate-900/40 border border-slate-900 rounded-3xl p-8 backdrop-blur-xl relative z-10 space-y-6">
            <div className="text-center space-y-2">
              <div 
                onClick={() => setPage('home')}
                className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg shadow-blue-500/20 mx-auto cursor-pointer hover:scale-105 transition-transform"
              >
                <img src="/logo.jpeg" alt="ProxyGPT" className="w-full h-full object-cover" />
              </div>
              <h2 className="text-2xl font-black text-white">Get Started with ProxyGPT</h2>
              <p className="text-xs text-slate-400">Access dynamic, unthrottled residential nodes</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Your Full Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Alex Mercer"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Client Email Address</label>
                <input 
                  type="email" 
                  required 
                  placeholder="name@email.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Security Password</label>
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500" 
                />
              </div>

              {authError && (
                <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{authError}</p>
              )}

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 rounded-xl font-bold text-xs text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register New Account'}
              </button>
            </form>

            {enableGoogleAuth && googleClientId && (
              <>
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-850"></div>
                  <span className="flex-shrink mx-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">OR</span>
                  <div className="flex-grow border-t border-slate-850"></div>
                </div>
                <GoogleSignInButton clientId={googleClientId} onSuccess={handleGoogleCredential} />
              </>
            )}

            <div className="text-center text-xs text-slate-500">
              Already have an account?{' '}
              <span onClick={() => setPage('login')} className="text-blue-400 font-semibold hover:underline cursor-pointer">
                Log In
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SECURE DASHBOARD ROUTE (Tab-based system styled exactly matching Sophisticated Dark sidebar theme) */}
      {page === 'dashboard' && user && (
        <div className="flex min-h-screen relative overflow-hidden">
          
          {/* Glass background flares */}
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

          {/* Mobile drawer backdrop */}
          {sidebarOpen && (
            <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-30 lg:hidden"></div>
          )}

          {/* Sidebar Section — static on desktop, slide-in drawer on mobile */}
          <aside className={`w-64 border-r border-slate-900 bg-slate-950/95 lg:bg-slate-950/40 backdrop-blur-md flex flex-col z-40 shrink-0 fixed inset-y-0 left-0 overflow-y-auto transform transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setPage('home'); setSidebarOpen(false); }}>
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-blue-500/20">
                  <img src="/logo.jpeg" alt="ProxyGPT" className="w-full h-full object-cover" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">ProxyGPT</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white cursor-pointer" title="Close menu">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
              <button 
                id="tab-overview"
                onClick={() => selectTab('overview')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-xs font-semibold cursor-pointer ${
                  dashboardTab === 'overview' 
                    ? 'bg-blue-500/10 border-l-4 border-blue-500 text-blue-400' 
                    : 'hover:bg-slate-900/50 text-slate-400 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Overview Dashboard</span>
              </button>

              <button 
                id="tab-create-proxy"
                onClick={() => selectTab('create-proxy')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-xs font-semibold cursor-pointer ${
                  dashboardTab === 'create-proxy' 
                    ? 'bg-blue-500/10 border-l-4 border-blue-500 text-blue-400' 
                    : 'hover:bg-slate-900/50 text-slate-400 hover:text-white'
                }`}
              >
                <Server className="w-4 h-4" />
                <span>Create proxies</span>
              </button>

              <button 
                id="tab-pricing"
                onClick={() => selectTab('pricing')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-xs font-semibold cursor-pointer ${
                  dashboardTab === 'pricing' 
                    ? 'bg-blue-500/10 border-l-4 border-blue-500 text-blue-400' 
                    : 'hover:bg-slate-900/50 text-slate-400 hover:text-white'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>Residential Pricing &amp; Bandwidth</span>
              </button>

              <button
                id="tab-video"
                onClick={() => selectTab('video')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-xs font-semibold cursor-pointer ${
                  dashboardTab === 'video'
                    ? 'bg-blue-500/10 border-l-4 border-blue-500 text-blue-400'
                    : 'hover:bg-slate-900/50 text-slate-400 hover:text-white'
                }`}
              >
                <PlayCircle className="w-4 h-4" />
                <span>Video Tutorial</span>
              </button>

              <button
                id="tab-notice-board"
                onClick={() => selectTab('notice-board')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-xs font-semibold cursor-pointer ${
                  dashboardTab === 'notice-board'
                    ? 'bg-amber-500/10 border-l-4 border-amber-500 text-amber-400'
                    : 'hover:bg-slate-900/50 text-slate-400 hover:text-white'
                }`}
              >
                <Megaphone className="w-4 h-4" />
                <span>Notice Board</span>
                {noticePosts.length > 0 && (
                  <span className="ml-auto bg-amber-500/20 text-amber-400 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-amber-500/30">
                    {noticePosts.length}
                  </span>
                )}
              </button>
            </nav>

            <div className="p-6 border-t border-slate-900 space-y-3">
              <a
                href="https://t.me/proxygptonline"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600/10 to-cyan-600/10 border border-sky-500/20 hover:border-sky-500/50 hover:bg-sky-500/15 text-sky-300 hover:text-white transition-all text-[11px] font-bold uppercase tracking-wider cursor-pointer shadow-lg shadow-sky-950/20"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
                </svg>
                <span>Telegram</span>
              </a>
              <button
                id="support-btn"
                onClick={() => setShowSupportModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-500/15 text-blue-300 hover:text-white transition-all text-[11px] font-bold uppercase tracking-wider cursor-pointer shadow-lg shadow-blue-950/20"
              >
                <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                <span>Contact Support</span>
              </button>

              <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900/40 p-4 rounded-xl border border-indigo-500/10">
                {(() => {
                  const usedGb = usage ? usage.usedGb : myOrders.reduce((acc, o) => acc + o.bandwidthUsedGb, 0);
                  const totalGb = usage && usage.live && usage.limitGb > 0 ? usage.limitGb : myOrders.filter(o => o.status === 'active').reduce((acc, o) => acc + o.bandwidthGb, 0);
                  const pct = totalGb > 0 ? Math.min((usedGb / totalGb) * 100, 100) : 0;
                  return (
                    <>
                      <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider mb-2">Total Consumed</p>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${pct}%` }}></div>
                      </div>
                      <p className="text-[10px] mt-2 text-slate-500 font-mono">
                        {usedGb.toFixed(2)} GB / {totalGb} GB Total
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>
          </aside>

          {/* Main User Panel Frame */}
          <div className="flex-1 flex flex-col relative z-10 overflow-y-auto max-h-screen">
            
            {/* Header */}
            <header className="h-20 border-b border-slate-900 flex items-center justify-between px-4 sm:px-8 bg-slate-950/20 backdrop-blur-sm relative z-20 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 -ml-1 bg-slate-900 border border-slate-850 rounded-xl text-slate-300 hover:text-white cursor-pointer shrink-0"
                  title="Open menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-white uppercase tracking-wider text-xs sm:text-sm truncate">
                    {dashboardTab === 'overview' ? 'Overview' : dashboardTab === 'create-proxy' ? 'Configure Terminal' : dashboardTab === 'video' ? 'Video Tutorial' : dashboardTab === 'notice-board' ? 'Notice Board' : dashboardTab === 'settings' ? 'Account Settings' : dashboardTab === 'transactions' ? 'Order History' : 'Pricing Pool Catalog'}
                  </h1>
                  <p className="text-xs text-slate-500 hidden sm:block">Manage your secure unthrottled dynamic internet gateways</p>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                {/* Quick IP-check: open ipgpt.net to see the assigned IP */}
                <a
                  href="https://ipgpt.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open ipgpt.net — check your IP"
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-850 hover:border-blue-500/60 rounded-xl transition-colors cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="text-xs font-bold text-blue-400 font-mono hidden sm:block">ipgpt.net</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </a>

                <div className="relative">
                  <button
                    onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-850 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden shrink-0">
                      {user?.profilePicture ? (
                        <img src={user.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold text-white uppercase">{user?.name?.charAt(0)}</span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-300 hidden sm:block">My Account</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                  
                  {accountMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setAccountMenuOpen(false)}></div>
                      <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in py-1">
                        <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-3">
                          <Users className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-[11px] font-bold text-slate-300 truncate">{user?.email}</span>
                        </div>
                        <button
                          onClick={() => {
                            selectTab('transactions');
                            setAccountMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-3 transition-colors cursor-pointer"
                        >
                          <Database className="w-4 h-4 text-slate-400" />
                          Order History
                        </button>
                        <button
                          onClick={() => {
                            selectTab('settings');
                            setAccountMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-3 transition-colors cursor-pointer border-t border-slate-800"
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                          Settings
                        </button>
                        <button
                          onClick={() => {
                            setAccountMenuOpen(false);
                            handleLogout();
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-slate-800 flex items-center gap-3 transition-colors cursor-pointer border-t border-slate-800"
                        >
                          <LogOut className="w-4 h-4" />
                          Log out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </header>

            {/* Dashboard Sub-Tab View Switching Router */}
            <div className="p-4 sm:p-8 flex-grow">
              
              {dashboardTab === 'overview' && (
                <Dashboard 
                  user={user}
                  proxies={myProxies}
                  orders={myOrders}
                  transactions={myTransactions}
                  onRefresh={syncLedgerData}
                  onCreateProxyTab={() => selectTab('create-proxy')}
                  onPricingTab={() => selectTab('pricing')}
                />
              )}

              {dashboardTab === 'create-proxy' && (
                <CreateProxy
                  orders={myOrders}
                  onProxyCreated={syncLedgerData}
                  pinnedCountries={pinnedCountries}
                />
              )}

              {dashboardTab === 'pricing' && (
                <div className="space-y-8 animate-fade-in">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Zap className="w-5 h-5 text-blue-400" />
                      Bandwidth Refill Center
                    </h2>
                    <p className="text-xs text-slate-400">Refill or add a fresh package of high-grade proxy bandwidth pool.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {packages.map((pkg) => (
                      <div 
                        key={pkg.id} 
                        className={`bg-slate-900/40 border p-6 rounded-2xl flex flex-col justify-between backdrop-blur-sm relative group transition-all duration-300 hover:-translate-y-1 ${
                          pkg.bandwidthGb === 10 
                            ? 'border-blue-500/50 shadow-lg shadow-blue-500/10 bg-slate-900/60' 
                            : 'border-slate-900 hover:border-slate-800'
                        }`}
                      >
                        {pkg.bandwidthGb === 10 && (
                          <span className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-blue-500 text-slate-950 text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full shadow-md">
                            POPULAR
                          </span>
                        )}

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{pkg.name}</p>
                          <div className="flex items-baseline gap-1 mt-3">
                            <span className="text-4xl font-black text-white">${pkg.priceUsd}</span>
                            <span className="text-xs text-white">/ {pkg.bandwidthGb} GB</span>
                          </div>

                          <div className="w-full bg-slate-850 h-1 rounded-full my-4 overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full" style={{ width: `${Math.min(pkg.bandwidthGb * 5, 100)}%` }}></div>
                          </div>

                          <ul className="space-y-2 text-[11px] text-slate-400">
                            {pkg.features.map((feat, fidx) => (
                              <li key={fidx} className="flex items-center gap-1.5">
                                <span className="text-blue-400 font-bold">•</span>
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Payment Selector inside Dashboard Refill */}
                        <div className="mt-6 space-y-2">
                          <button
                            onClick={() => openCheckout(pkg)}
                            className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 rounded-xl text-xs font-bold text-white shadow shadow-blue-900/40 cursor-pointer"
                          >
                            Order Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dashboardTab === 'video' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <PlayCircle className="w-5 h-5 text-blue-400" />
                      Video Tutorial
                    </h2>
                    <p className="text-xs text-slate-400">Watch a quick walkthrough of how to buy bandwidth and create your proxies.</p>
                  </div>

                  {toYouTubeEmbed(tutorialVideoUrl) ? (
                    <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-4 backdrop-blur-md">
                      <div className="relative w-full rounded-2xl overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                          src={toYouTubeEmbed(tutorialVideoUrl)!}
                          title="Video Tutorial"
                          className="absolute inset-0 w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        ></iframe>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-12 text-center backdrop-blur-md">
                      <PlayCircle className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                      <p className="text-sm font-bold text-white">No tutorial video yet</p>
                      <p className="text-xs text-slate-500 mt-1">A video walkthrough will appear here soon.</p>
                    </div>
                  )}
                </div>
              )}


              {dashboardTab === 'notice-board' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-amber-400" />
                        Notice Board
                      </h2>
                      <p className="text-xs text-slate-400">Official announcements, updates & maintenance notices from the ProxyGPT team.</p>
                    </div>
                    <button
                      onClick={loadNoticePosts}
                      className="text-[10px] px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer font-bold"
                    >
                      Refresh
                    </button>
                  </div>

                  {noticePosts.length === 0 ? (
                    <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-16 text-center backdrop-blur-md">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
                        <Megaphone className="w-7 h-7 text-amber-500/50" />
                      </div>
                      <p className="text-sm font-bold text-white">No announcements yet</p>
                      <p className="text-xs text-slate-500 mt-1">The admin hasn't posted any updates yet. Check back soon!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {noticePosts.map((post) => {
                        const tagStyles: Record<string, { bg: string; border: string; text: string; dot: string }> = {
                          update:      { bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   text: 'text-blue-400',   dot: 'bg-blue-400' },
                          maintenance: { bg: 'bg-red-500/10',    border: 'border-red-500/20',    text: 'text-red-400',    dot: 'bg-red-400' },
                          feature:     { bg: 'bg-emerald-500/10',border: 'border-emerald-500/20',text: 'text-emerald-400',dot: 'bg-emerald-400' },
                          alert:       { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', dot: 'bg-orange-400' },
                          info:        { bg: 'bg-slate-500/10',  border: 'border-slate-500/20',  text: 'text-slate-400',  dot: 'bg-slate-400' },
                        };
                        const ts = tagStyles[post.tag] || tagStyles.info;
                        return (
                          <div
                            key={post.id}
                            className={`relative bg-slate-900/40 border rounded-3xl p-6 backdrop-blur-md transition-all hover:border-opacity-50 ${
                              post.isPinned ? 'border-amber-500/30 shadow-lg shadow-amber-500/5' : 'border-slate-900 hover:border-slate-800'
                            }`}
                          >
                            {post.isPinned && (
                              <div className="absolute top-4 right-4 flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                                <Pin className="w-2.5 h-2.5 text-amber-400" />
                                <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider">Pinned</span>
                              </div>
                            )}

                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                                <Bell className="w-5 h-5 text-amber-400" />
                              </div>

                              <div className="flex-1 min-w-0 pr-16">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${ts.bg} ${ts.border} ${ts.text}`}>
                                    {post.tag}
                                  </span>
                                  <h3 className="text-sm font-bold text-white">{post.title}</h3>
                                </div>

                                <p className="text-[12px] text-slate-300 leading-relaxed whitespace-pre-wrap">{post.body}</p>

                                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-900">
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    Posted: {new Date(post.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {post.updatedAt !== post.createdAt && (
                                    <span className="text-[10px] text-slate-600 font-mono">
                                      Updated: {new Date(post.updatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {dashboardTab === 'transactions' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Order History</h2>
                      <p className="text-xs text-slate-400 mt-1">View and track all your bandwidth purchases.</p>
                    </div>
                  </div>

                  <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
                    {myOrders.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">No orders found.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                          <thead>
                            <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-widest bg-slate-950/50">
                              <th className="p-3 font-bold">Order ID</th>
                              <th className="p-3 font-bold">Date</th>
                              <th className="p-3 font-bold">Package</th>
                              <th className="p-3 font-bold">Amount</th>
                              <th className="p-3 font-bold">Status</th>
                              <th className="p-3 font-bold">Gateway</th>
                            </tr>
                          </thead>
                          <tbody className="text-xs text-slate-300">
                            {myOrders.map(order => {
                              const txn = myTransactions.find(t => t.orderId === order.id);
                              const gatewayName = txn ? txn.gateway : 'credit_card';
                              return (
                                <tr key={order.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                                  <td className="p-3 font-mono text-[11px] text-slate-400">{order.id}</td>
                                  <td className="p-3">{new Date(order.createdAt).toLocaleDateString()}</td>
                                  <td className="p-3 font-bold text-white">{order.packageName}</td>
                                  <td className="p-3 font-mono text-emerald-400">${order.priceUsd.toFixed(2)}</td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      (order.status === 'active' || order.status === 'completed') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                      order.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                      'bg-red-500/10 text-red-400 border border-red-500/20'
                                    }`}>
                                      {order.status}
                                    </span>
                                  </td>
                                  <td className="p-3 capitalize">{gatewayName.replace('_', ' ')}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {dashboardTab === 'settings' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Account Settings</h2>
                      <p className="text-xs text-slate-400 mt-1">Manage your profile details.</p>
                    </div>
                  </div>

                  <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" /> User Profile
                      </h3>
                      {!editingProfile ? (
                        <button
                          onClick={() => {
                            setEditName(user?.name || '');
                            setEditPicUrl(user?.profilePicture || '');
                            setEditPassword('');
                            setEditingProfile(true);
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            disabled={profileSaving}
                            onClick={() => setEditingProfile(false)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" /> Cancel
                          </button>
                          <button
                            disabled={profileSaving || !editName.trim()}
                            onClick={handleSaveProfile}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                          >
                            {profileSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            Save Changes
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6 items-start">
                      {/* Avatar Display / Edit */}
                      <div className="shrink-0">
                        {editingProfile ? (
                          <>
                            <div 
                              onClick={() => fileInputRef.current?.click()}
                              className="w-24 h-24 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-2 overflow-hidden relative group cursor-pointer"
                            >
                              {editPicUrl ? (
                                <>
                                  <img src={editPicUrl} alt="Avatar Preview" className="w-full h-full object-cover opacity-50 group-hover:opacity-20 transition-opacity" />
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <Image className="w-6 h-6 text-white drop-shadow-md" />
                                  </div>
                                </>
                              ) : (
                                <Image className="w-8 h-8 text-slate-600 group-hover:text-white transition-colors" />
                              )}
                            </div>
                            <input 
                              type="file" 
                              accept="image/*" 
                              ref={fileInputRef} 
                              className="hidden" 
                              onChange={handleImageUpload} 
                            />
                          </>
                        ) : (
                          <div className="w-24 h-24 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shadow-xl shadow-black/40">
                            {user?.profilePicture ? (
                              <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-3xl font-black text-slate-500 uppercase">{user?.name.charAt(0)}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Fields */}
                      <div className="flex-1 grid grid-cols-1 gap-4 w-full">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Full Name</label>
                          {editingProfile ? (
                            <input
                              type="text"
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              className="w-full bg-slate-950 border border-blue-500/50 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                            />
                          ) : (
                            <div className="bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-300 font-bold">
                              {user?.name}
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Email Address (Read-only)</label>
                          <div className="bg-slate-950 border border-slate-850/50 rounded-xl px-4 py-2.5 text-xs text-slate-500 cursor-not-allowed">
                            {user?.email}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Account Password</label>
                          {editingProfile ? (
                            <input
                              type="password"
                              placeholder="Type a new password to change..."
                              value={editPassword}
                              onChange={e => setEditPassword(e.target.value)}
                              className="w-full bg-slate-950 border border-blue-500/50 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                            />
                          ) : (
                            <div className="bg-slate-950 border border-slate-850/50 rounded-xl px-4 py-2.5 text-xs text-slate-500">
                              •••••••• (Encrypted)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order History has been moved to its own tab */}
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* ADMIN CONSOLE ROUTE */}
      {page === 'admin' && user && user.role === 'admin' && (
        <div className="min-h-screen relative overflow-hidden flex flex-col">
          {/* Top Admin Header */}
          <header className="h-20 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 relative z-20 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div
                onClick={() => setPage('home')}
                className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-blue-500/20 cursor-pointer shrink-0"
              >
                <img src="/logo.jpeg" alt="ProxyGPT" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-black tracking-tight text-white uppercase block truncate">Admin Control Console</span>
                <p className="text-[10px] text-slate-500 hidden sm:block">Root Access • System parameters & ledger settings</p>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white rounded-xl transition-all flex items-center gap-2 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </header>

          <div className="p-4 sm:p-8 flex-grow relative z-10 overflow-y-auto">
            <AdminPanel onLogout={handleLogout} />
          </div>
        </div>
      )}

      {/* Checkout Modal (coupon + pay) */}
      {checkoutPkg && (
        <CheckoutModal
          pkg={checkoutPkg}
          loading={actionLoading}
          showZinipay={zinipayEnabled}
          onClose={() => setCheckoutPkg(null)}
          onProceed={(couponCode, gateway, phone) => {
            const pkg = checkoutPkg;
            setCheckoutPkg(null);
            handlePurchaseBandwidth(pkg, gateway, couponCode, phone);
          }}
        />
      )}

      {/* Support Dialog Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full relative overflow-hidden shadow-2xl">
            <div className="absolute pointer-events-none top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">ProxyGPT Support Helpdesk</h3>
              </div>
              <button 
                onClick={() => {
                  setShowSupportModal(false);
                  setTicketSuccess('');
                }}
                className="text-slate-500 hover:text-white transition-colors cursor-pointer text-sm font-bold w-6 h-6 flex items-center justify-center bg-slate-950 rounded-full border border-slate-800/60"
              >
                ✕
              </button>
            </div>

            {ticketSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mx-auto border border-green-500/20 text-lg font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Ticket Submitted Successfully!</h4>
                  <p className="text-xs text-slate-400 mt-1">Our technical network operations center will review your query within 15 minutes.</p>
                </div>
                <button 
                  onClick={() => {
                    setTicketSuccess('');
                    setSupportMessage('');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-xl transition-colors cursor-pointer"
                >
                  Create Another Ticket
                </button>
              </div>
            ) : (
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!supportMessage.trim() || supportSubmitting) return;
                setSupportSubmitting(true);
                try {
                  await api.support.submitTicket(supportCategory, supportMessage);
                  await loadMyTickets();
                  setTicketSuccess('submitted');
                  setSupportMessage('');
                } catch (err: any) {
                  alert(err.message || 'Failed to submit ticket.');
                } finally {
                  setSupportSubmitting(false);
                }
              }} className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed mb-1">
                  Submit a support ticket below, or email us directly at <span className="font-bold text-blue-400">admin@proxygpt.online</span>. Our network operations center is active 24/7.
                </p>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Category</label>
                  <select 
                    value={supportCategory}
                    onChange={(e) => setSupportCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="technical">Technical Routing (IP issues)</option>
                    <option value="billing">Billing & Refills</option>
                    <option value="reseller">Reseller API integration</option>
                    <option value="other">Other Inquiry</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Message</label>
                  <textarea 
                    required
                    rows={4}
                    placeholder="Describe your technical difficulty or reseller API questions..."
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  disabled={supportSubmitting}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-xs font-bold text-white rounded-xl shadow-md cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {supportSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Support Ticket'}
                </button>
              </form>
            )}

            <div className="mt-6 border-t border-slate-800 pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Ticket History</span>
                {supportTickets.filter(t => t.status === 'open' || t.status === 'in-progress').length > 0 && (
                  <span className="text-[9px] font-black bg-amber-500/15 border border-amber-500/30 text-amber-400 px-1.5 py-0.5 rounded-full">
                    {supportTickets.filter(t => t.status === 'open' || t.status === 'in-progress').length} pending
                  </span>
                )}
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {supportTickets.length === 0 ? (
                  <p className="text-[10px] text-slate-600 text-center py-4">No tickets yet.</p>
                ) : supportTickets.map((t) => (
                  <div key={t.id} className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-850 text-[11px]">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-400">{t.id}</span>
                        <span className="text-[9px] text-slate-600">•</span>
                        <span className="text-slate-500 capitalize">{t.category}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${
                        t.status === 'open'        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        : t.status === 'in-progress' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                        : t.status === 'resolved'    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                        : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                    <p className="text-slate-400 mt-1 line-clamp-1">{t.message}</p>
                    {t.adminReply && (
                      <div className="mt-1.5 p-1.5 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                        <p className="text-[10px] text-blue-300"><span className="font-bold">Admin:</span> {t.adminReply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full relative overflow-hidden shadow-2xl">
            <div className="absolute pointer-events-none top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Account Password Recovery</h3>
              </div>
              <button 
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotError('');
                  setForgotMessage('');
                }}
                className="text-slate-500 hover:text-white transition-colors cursor-pointer text-sm font-bold w-6 h-6 flex items-center justify-center bg-slate-950 rounded-full border border-slate-800/60"
              >
                ✕
              </button>
            </div>

            {forgotMessage ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mx-auto border border-green-500/20 text-lg font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Recovery Instructions</h4>
                  <p className="text-xs text-slate-300 mt-3 p-3 bg-slate-950 border border-slate-850 rounded-xl leading-relaxed text-left whitespace-pre-wrap font-medium">
                    {forgotMessage}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotError('');
                    setForgotMessage('');
                  }}
                  className="px-6 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs font-bold rounded-xl transition-all hover:text-white cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your registered client email address. We will verify the credentials and return the password recovery instructions instantly.
                </p>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Registered Email</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="name@email.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500" 
                  />
                </div>

                {forgotError && (
                  <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
                    {forgotError}
                  </p>
                )}

                <button 
                  type="submit"
                  disabled={forgotSubmitting || !forgotEmail.trim()}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-xs font-bold text-white rounded-xl shadow-md cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {forgotSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Recover Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
