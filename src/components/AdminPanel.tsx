/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Users, DollarSign, Database, Server, Settings, Terminal, Shield,
  Trash2, ToggleLeft, ToggleRight, Plus, Check, Edit2, ShieldAlert,
  Loader2, Save, Globe, Lock, Code, Ticket, Receipt, Megaphone, Bell, Pin, X, HelpCircle, Smartphone
} from 'lucide-react';
import { User, ProxyPackage, SystemLog, CountryConfig, Coupon, NoticePost, SupportTicket } from '../types';
import { api } from '../services/api';
import MobileProxyAdmin from './MobileProxyAdmin';

interface AdminPanelProps {
  onLogout: () => void;
}

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'orders' | 'pricing' | 'coupons' | 'countries' | 'logs' | 'settings' | 'notice' | 'support' | 'mobile-proxies'>('stats');

  // States loaded from backend
  const [metrics, setMetrics] = useState<any>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [packages, setPackages] = useState<ProxyPackage[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [countries, setCountries] = useState<CountryConfig[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);

  // Notice Board state
  const [noticePosts, setNoticePosts] = useState<NoticePost[]>([]);
  const [noticeForm, setNoticeForm] = useState({ title: '', body: '', tag: 'info' as NoticePost['tag'], isPinned: false });
  const [editingNotice, setEditingNotice] = useState<NoticePost | null>(null);
  const [orderDateFrom, setOrderDateFrom] = useState('');
  const [orderDateTo, setOrderDateTo] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Support Helpdesk state
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [supportStats, setSupportStats] = useState({ openCount: 0, inProgressCount: 0 });
  const [ticketReplies, setTicketReplies] = useState<Record<string, string>>({});

  // New coupon form
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percent' | 'fixed'>('percent');
  const [newCouponValue, setNewCouponValue] = useState<number>(10);
  const [newCouponMaxUses, setNewCouponMaxUses] = useState<number>(0);
  
  // Settings edit states
  const [apiSettings, setApiSettings] = useState<any>(null);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [websiteSettings, setWebsiteSettings] = useState<any>(null);

  // loading / action states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Add Package State Form
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgGb, setNewPkgGb] = useState(5);
  const [newPkgPrice, setNewPkgPrice] = useState(5);
  const [newPkgFeatures, setNewPkgFeatures] = useState('SOCKS5 Support, Instant Active Endpoint');
  const [adminNewPassword, setAdminNewPassword] = useState('');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.admin.getStats();
      setMetrics(statsRes.metrics);
      
      const usersRes = await api.admin.getUsers();
      setUsersList(usersRes);

      const pkgsRes = await api.settings.getPackages();
      setPackages(pkgsRes);

      const logsRes = await api.admin.getLogs();
      setLogs(logsRes);

      try { setCoupons(await api.admin.getCoupons()); } catch { /* non-fatal */ }
      try { setOrderHistory(await api.admin.getOrderHistory()); } catch { /* non-fatal */ }
      try { setNoticePosts(await api.notice.getPosts()); } catch { /* non-fatal */ }
      
      try { 
        const supRes = await api.support.adminGetAll();
        setSupportTickets(supRes.tickets);
        setSupportStats({ openCount: supRes.openCount, inProgressCount: supRes.inProgressCount });
      } catch { /* non-fatal */ }

      const pubConf = await api.settings.getPublicConfig();
      // Wait, we need full country configs (including the disabled ones).
      // We can load them from the settings endpoint or use a fallback list.
      // Let's load settings
      const settingsRes = await api.admin.getGlobalSettings();
      setApiSettings(settingsRes.api);
      setPaymentSettings(settingsRes.payment);
      setWebsiteSettings(settingsRes.website);
      
      // Load countries
      setCountries(pubConf.countries);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const triggerNotify = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // 1. User Management Actions
  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setActionLoading(true);
    try {
      await api.admin.updateUserStatus(userId, { isActive: !currentStatus });
      triggerNotify(`User status changed successfully.`);
      await loadAdminData();
    } catch (e: any) {
      alert(e.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user account? This cannot be undone.')) return;
    setActionLoading(true);
    try {
      await api.admin.deleteUser(userId);
      triggerNotify(`User deleted permanently.`);
      await loadAdminData();
    } catch (e: any) {
      alert(e.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetUserPassword = async (userId: string, newPass: string) => {
    if (!newPass.trim()) return;
    setActionLoading(true);
    try {
      await api.admin.updateUserStatus(userId, { password: newPass.trim() });
      triggerNotify(`User password updated successfully.`);
      await loadAdminData();
    } catch (e: any) {
      alert(e.message || 'Failed to update user password.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetUserDue = async (userId: string, current: number) => {
    const input = prompt('Set wallet Due (USD) for this user:', String(current || 0));
    if (input === null) return;
    const amount = parseFloat(input);
    if (!Number.isFinite(amount) || amount < 0) { alert('Enter a valid amount (0 or more).'); return; }
    setActionLoading(true);
    try {
      await api.admin.setUserDue(userId, amount);
      triggerNotify(`Wallet Due set to $${amount.toFixed(2)}.`);
      await loadAdminData();
    } catch (e: any) {
      alert(e.message || 'Failed to set due.');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Package Actions
  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkgName || !newPkgGb || !newPkgPrice) return;
    setActionLoading(true);
    try {
      await api.admin.createPackage({
        name: newPkgName,
        bandwidthGb: newPkgGb,
        priceUsd: newPkgPrice,
        features: newPkgFeatures.split(',').map(f => f.trim())
      });
      triggerNotify(`New package '${newPkgName}' created live!`);
      setNewPkgName('');
      await loadAdminData();
    } catch (e: any) {
      alert(e.message || 'Failed to create pricing package.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePackage = async (pkgId: string) => {
    if (!confirm('Delete this pricing package? New orders won\'t be able to buy it.')) return;
    setActionLoading(true);
    try {
      await api.admin.deletePackage(pkgId);
      triggerNotify(`Pricing package deleted successfully.`);
      await loadAdminData();
    } catch (e: any) {
      alert(e.message || 'Failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Coupon Actions
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.admin.createCoupon({
        code: newCouponCode,
        type: newCouponType,
        value: newCouponValue,
        maxUses: newCouponMaxUses
      });
      setNewCouponCode('');
      setNewCouponValue(10);
      setNewCouponMaxUses(0);
      setCoupons(await api.admin.getCoupons());
      triggerNotify('Coupon created successfully.');
    } catch (e: any) {
      alert(e.message || 'Failed to create coupon.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleCoupon = async (id: string) => {
    try {
      await api.admin.toggleCoupon(id);
      setCoupons(await api.admin.getCoupons());
    } catch (e: any) {
      alert(e.message || 'Failed.');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await api.admin.deleteCoupon(id);
      setCoupons(await api.admin.getCoupons());
    } catch (e: any) {
      alert(e.message || 'Failed.');
    }
  };

  // 3. Country Actions
  const handleToggleCountry = async (code: string, currentEnabled: boolean) => {
    setActionLoading(true);
    try {
      await api.admin.toggleCountry(code, !currentEnabled);
      triggerNotify(`Country allocation toggled.`);
      await loadAdminData();
    } catch (e: any) {
      alert(e.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Update Configurations
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.admin.updateGlobalSettings({
        api: apiSettings,
        payment: paymentSettings,
        website: websiteSettings
      });
      if (adminNewPassword.trim()) {
        await api.admin.updateUserStatus('usr_admin', { password: adminNewPassword.trim() });
        setAdminNewPassword('');
      }
      triggerNotify(`Configurations saved successfully on server!`);
      await loadAdminData();
    } catch (e: any) {
      alert(e.message || 'Failed to save parameters.');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Notice Board Actions
  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeForm.title.trim() || !noticeForm.body.trim()) return;
    setActionLoading(true);
    try {
      await api.notice.createPost(noticeForm);
      setNoticeForm({ title: '', body: '', tag: 'info', isPinned: false });
      setNoticePosts(await api.notice.getPosts());
      triggerNotify('Notice posted successfully!');
    } catch (e: any) {
      alert(e.message || 'Failed to create notice.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNotice) return;
    setActionLoading(true);
    try {
      await api.notice.updatePost(editingNotice.id, {
        title: editingNotice.title,
        body: editingNotice.body,
        tag: editingNotice.tag,
        isPinned: editingNotice.isPinned
      });
      setEditingNotice(null);
      setNoticePosts(await api.notice.getPosts());
      triggerNotify('Notice updated successfully!');
    } catch (e: any) {
      alert(e.message || 'Failed to update notice.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (!confirm('Delete this notice post?')) return;
    try {
      await api.notice.deletePost(id);
      setNoticePosts(await api.notice.getPosts());
      triggerNotify('Notice deleted.');
    } catch (e: any) {
      alert(e.message || 'Failed.');
    }
  };

  // 6. Support Tickets Actions
  const handleUpdateSupportTicket = async (id: string, status: SupportTicket['status']) => {
    setActionLoading(true);
    try {
      await api.support.adminUpdateTicket(id, status, ticketReplies[id]);
      const supRes = await api.support.adminGetAll();
      setSupportTickets(supRes.tickets);
      setSupportStats({ openCount: supRes.openCount, inProgressCount: supRes.inProgressCount });
      triggerNotify('Ticket updated successfully!');
      
      // Clear reply buffer if it was resolved/closed
      if (status === 'resolved' || status === 'closed') {
        const newReps = { ...ticketReplies };
        delete newReps[id];
        setTicketReplies(newReps);
      }
    } catch (e: any) {
      alert(e.message || 'Failed to update ticket.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSupportTicket = async (id: string) => {
    if (!confirm('Permanently delete this support ticket?')) return;
    try {
      await api.support.adminDeleteTicket(id);
      const supRes = await api.support.adminGetAll();
      setSupportTickets(supRes.tickets);
      setSupportStats({ openCount: supRes.openCount, inProgressCount: supRes.inProgressCount });
      triggerNotify('Ticket deleted.');
    } catch (e: any) {
      alert(e.message || 'Failed to delete ticket.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-xs text-slate-500">Loading Administrator Core Ledger...</p>
      </div>
    );
  }

  // Order history filtered by date range + search text.
  const filteredOrders = orderHistory.filter((o) => {
    const d = new Date(o.createdAt);
    if (orderDateFrom && d < new Date(orderDateFrom + 'T00:00:00')) return false;
    if (orderDateTo && d > new Date(orderDateTo + 'T23:59:59')) return false;
    if (orderSearch.trim()) {
      const q = orderSearch.trim().toLowerCase();
      const hay = `${o.userEmail} ${o.userName} ${o.packageName} ${o.couponCode} ${o.status} ${o.gateway}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-slate-200">
      
      {/* Sidebar Control Switcher */}
      <aside className="lg:col-span-3 space-y-2 bg-slate-900/20 border border-slate-900 p-4 rounded-3xl backdrop-blur-md">
        <div className="p-3 border-b border-slate-850 mb-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            Admin Panel
          </h4>
          <p className="text-[10px] text-slate-500 mt-1">Sarah Connor • Level 1 Core</p>
        </div>

        {[
          { id: 'stats', label: 'Dashboard Stats', icon: <Database className="w-4 h-4" /> },
          { id: 'users', label: 'User Management', icon: <Users className="w-4 h-4" /> },
          { id: 'orders', label: 'Order History', icon: <Receipt className="w-4 h-4" /> },
          { id: 'pricing', label: 'Pricing Manager', icon: <DollarSign className="w-4 h-4" /> },
          { id: 'coupons', label: 'Coupons', icon: <Ticket className="w-4 h-4" /> },
          { id: 'countries', label: 'Country Manager', icon: <Globe className="w-4 h-4" /> },
          { id: 'logs', label: 'System Audit Logs', icon: <Terminal className="w-4 h-4" /> },
          { id: 'settings', label: 'Global Settings', icon: <Settings className="w-4 h-4" /> },
          { id: 'notice', label: 'Notice Board', icon: <Megaphone className="w-4 h-4" /> },
          { id: 'support', label: 'Support Tickets', icon: <HelpCircle className="w-4 h-4" /> },
          { id: 'mobile-proxies', label: 'Mobile Proxies', icon: <Smartphone className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`w-full px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer ${
              activeTab === tab.id 
                ? 'bg-blue-500/10 border-l-4 border-blue-500 text-blue-400 font-bold' 
                : 'hover:bg-slate-900/50 text-slate-400 hover:text-white'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.id === 'support' && (supportStats.openCount > 0 || supportStats.inProgressCount > 0) && (
              <span className="ml-auto bg-amber-500 text-amber-950 text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                {supportStats.openCount + supportStats.inProgressCount}
              </span>
            )}
          </button>
        ))}

        <div className="pt-4 border-t border-slate-850 mt-4">
          <button 
            onClick={onLogout}
            className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Logout Session
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="lg:col-span-9 space-y-6">
        
        {successMessage && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-2xl animate-fade-in flex items-center gap-2">
            <Check className="w-4 h-4" />
            {successMessage}
          </div>
        )}

        {/* 1. STATS OVERVIEW TAB */}
        {activeTab === 'stats' && metrics && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-base font-black text-white">System Admin Metrics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              <div className="bg-slate-900/30 border border-slate-900 p-6 rounded-2xl">
                <DollarSign className="w-6 h-6 text-emerald-400 mb-3" />
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Gross Revenue</span>
                <p className="text-2xl font-black text-white mt-1">${metrics.totalRevenue || 0} USD</p>
              </div>

              <div className="bg-slate-900/30 border border-slate-900 p-6 rounded-2xl">
                <Users className="w-6 h-6 text-blue-400 mb-3" />
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Registers</span>
                <p className="text-2xl font-black text-white mt-1">{metrics.totalUsers || 0} Accounts</p>
              </div>

              <div className="bg-slate-900/30 border border-slate-900 p-6 rounded-2xl">
                <Server className="w-6 h-6 text-purple-400 mb-3" />
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Active Tunnels</span>
                <p className="text-2xl font-black text-white mt-1">{metrics.totalProxiesCount || 0} Live</p>
              </div>

            </div>

            <div className="bg-slate-900/30 border border-slate-900 p-6 rounded-3xl space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-widest">General Usage Statistics</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl">
                  <p className="text-xs text-slate-500 font-semibold">Total Pool Sold</p>
                  <p className="text-xl font-bold text-white mt-1">{metrics.totalGbPurchased || 0} GB</p>
                </div>
                <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl">
                  <p className="text-xs text-slate-500 font-semibold">Total Bandwidth Consumed</p>
                  <p className="text-xl font-bold text-white mt-1">{metrics.totalGbUsed || 0} GB</p>
                </div>
                <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl">
                  <p className="text-xs text-slate-500 font-semibold">Online Servers</p>
                  <p className="text-xl font-bold text-green-400 mt-1">{metrics.onlineProxiesCount || 0} / {metrics.totalProxiesCount || 0}</p>
                </div>
                <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl">
                  <p className="text-xs text-slate-500 font-semibold">System SLA</p>
                  <p className="text-xl font-bold text-white mt-1">99.99%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-md space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-base font-black text-white">Registered Accounts</h3>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="sm:w-80 h-10 bg-slate-950/80 border border-slate-700 rounded-lg text-sm text-white px-3 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-500 uppercase tracking-widest text-[9px] font-bold">
                    <th className="py-3">Name</th>
                    <th className="py-3">Email Address</th>
                    <th className="py-3">Role</th>
                    <th className="py-3">State</th>
                    <th className="py-3">Balance / Due</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60">
                  {usersList
                    .filter(usr =>
                      usr.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                      usr.email.toLowerCase().includes(userSearch.toLowerCase())
                    )
                    .map((usr) => (
                    <tr key={usr.id} className="hover:bg-slate-900/20">
                      <td className="py-3.5 font-semibold text-white">{usr.name}</td>
                      <td className="py-3.5 font-mono text-slate-400">{usr.email}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${usr.role === 'admin' ? 'bg-purple-500/10 text-purple-400' : 'bg-slate-800 text-slate-400'}`}>
                          {usr.role}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className={`text-[10px] font-bold ${usr.isActive ? 'text-green-400' : 'text-red-400'}`}>
                          {usr.isActive ? '● Active' : '● Blocked'}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <div className="space-y-1 text-[10px]">
                          <div className="text-emerald-400 font-bold">${((usr as any).walletBalance || 0).toFixed(2)}</div>
                          {((usr as any).walletDue || 0) > 0 && (
                            <div className="text-red-400 font-bold">Due: ${((usr as any).walletDue).toFixed(2)}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleToggleUserStatus(usr.id, usr.isActive)}
                          disabled={usr.id === 'usr_admin'}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded cursor-pointer ${
                            usr.isActive 
                              ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400' 
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {usr.isActive ? 'Block' : 'Activate'}
                        </button>
                        <button
                          onClick={() => {
                            const newPass = prompt(`Set new password for ${usr.name}:`);
                            if (newPass !== null) {
                              handleSetUserPassword(usr.id, newPass);
                            }
                          }}
                          disabled={usr.id === 'usr_admin'}
                          className="px-2.5 py-1 text-[10px] font-bold rounded cursor-pointer bg-blue-500/10 hover:bg-blue-500/20 text-blue-400"
                        >
                          Password
                        </button>
                        <button
                          onClick={() => handleSetUserDue(usr.id, (usr as any).walletDue || 0)}
                          className="px-2.5 py-1 text-[10px] font-bold rounded cursor-pointer bg-red-500/10 hover:bg-red-500/20 text-red-400"
                        >
                          Due{(usr as any).walletDue ? ` $${((usr as any).walletDue).toFixed(2)}` : ''}
                        </button>
                        <button
                          onClick={async () => {
                            const couponCode = prompt(`Create coupon for ${usr.name} (enter code or blank to auto-generate):`);
                            if (couponCode !== null) {
                              setActionLoading(true);
                              try {
                                const code = couponCode || `GIFT${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
                                await api.admin.createCoupon({ code, type: 'percent', value: 100, maxUses: 1 });
                                setCoupons(await api.admin.getCoupons());
                                alert(`Coupon created: ${code}`);
                              } catch (e: any) {
                                alert('Failed to create coupon: ' + (e.message || 'Unknown error'));
                              } finally {
                                setActionLoading(false);
                              }
                            }
                          }}
                          disabled={actionLoading}
                          className="px-2.5 py-1 text-[10px] font-bold rounded cursor-pointer bg-green-500/10 hover:bg-green-500/20 text-green-400 disabled:opacity-50"
                        >
                          Coupon
                        </button>
                        <button
                          onClick={() => handleDeleteUser(usr.id)}
                          disabled={usr.id === 'usr_admin'}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ORDER HISTORY */}
        {activeTab === 'orders' && (
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-md space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-400" /> Order History
                <span className="text-xs font-normal text-slate-500">({filteredOrders.length}{filteredOrders.length !== orderHistory.length ? ` / ${orderHistory.length}` : ''})</span>
              </h3>
              <button
                onClick={async () => { try { setOrderHistory(await api.admin.getOrderHistory()); } catch {} }}
                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer self-start"
              >
                <Loader2 className="w-3 h-3" /> Refresh
              </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase block">From date</label>
                <input type="date" value={orderDateFrom} onChange={(e) => setOrderDateFrom(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase block">To date</label>
                <input type="date" value={orderDateTo} onChange={(e) => setOrderDateTo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[9px] font-bold text-slate-500 uppercase block">Search (user / package / coupon / status)</label>
                <div className="flex gap-2">
                  <input type="text" value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} placeholder="e.g. gmail.com, completed, SAVE20"
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none" />
                  {(orderDateFrom || orderDateTo || orderSearch) && (
                    <button onClick={() => { setOrderDateFrom(''); setOrderDateTo(''); setOrderSearch(''); }}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-white rounded-lg cursor-pointer whitespace-nowrap">Clear</button>
                  )}
                </div>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">{orderHistory.length === 0 ? 'No orders yet.' : 'No orders match the filters.'}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[720px]">
                  <thead>
                    <tr className="text-[9px] uppercase tracking-wider text-slate-500 border-b border-slate-850">
                      <th className="py-2 pr-4 font-bold">Date</th>
                      <th className="py-2 pr-4 font-bold">Customer</th>
                      <th className="py-2 pr-4 font-bold">Package</th>
                      <th className="py-2 pr-4 font-bold">Amount</th>
                      <th className="py-2 pr-4 font-bold">Coupon</th>
                      <th className="py-2 pr-4 font-bold">Gateway</th>
                      <th className="py-2 pr-4 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((o) => (
                      <tr key={o.id} className="border-b border-slate-900/60 text-xs text-slate-300">
                        <td className="py-2.5 pr-4 text-slate-400 whitespace-nowrap">{new Date(o.createdAt).toLocaleDateString()} {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="py-2.5 pr-4">
                          <span className="text-white font-semibold block">{o.userName || o.userEmail}</span>
                          <span className="text-[10px] text-slate-500">{o.userEmail}</span>
                        </td>
                        <td className="py-2.5 pr-4 whitespace-nowrap">{o.packageName} <span className="text-slate-500">({o.bandwidthGb}GB)</span></td>
                        <td className="py-2.5 pr-4 font-bold text-white whitespace-nowrap">
                          ${o.amountUsd}
                          {o.discountUsd > 0 && <span className="text-[10px] text-emerald-400 ml-1">(-${o.discountUsd})</span>}
                        </td>
                        <td className="py-2.5 pr-4">{o.couponCode ? <span className="font-mono text-blue-400">{o.couponCode}</span> : <span className="text-slate-600">—</span>}</td>
                        <td className="py-2.5 pr-4 uppercase text-[10px] text-slate-400">{o.gateway === 'credit_card' ? 'ZiniPay' : o.gateway}</td>
                        <td className="py-2.5 pr-4">
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                            o.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : o.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>{o.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 3. PRICING MANAGEMENT */}
        {activeTab === 'pricing' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Add Pricing Form */}
              <form onSubmit={handleCreatePackage} className="md:col-span-5 bg-slate-900/40 border border-slate-900 p-6 rounded-3xl space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-widest">Create Pricing Package</h4>
                
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Package Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Starter Pack" 
                    value={newPkgName}
                    onChange={(e) => setNewPkgName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase block">Bandwidth (GB)</label>
                    <input 
                      type="number" 
                      value={newPkgGb}
                      onChange={(e) => setNewPkgGb(parseInt(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase block">Price ($ USD)</label>
                    <input 
                      type="number" 
                      value={newPkgPrice}
                      onChange={(e) => setNewPkgPrice(parseInt(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Features list (comma separated)</label>
                  <textarea 
                    value={newPkgFeatures}
                    onChange={(e) => setNewPkgFeatures(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-3 text-xs text-white focus:outline-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-xs font-bold text-white rounded-xl shadow-md cursor-pointer"
                >
                  Create Package Live
                </button>
              </form>

              {/* Active Pricing List */}
              <div className="md:col-span-7 bg-slate-900/40 border border-slate-900 p-6 rounded-3xl space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-widest">Active Packages ({packages.length})</h4>
                
                <div className="space-y-3">
                  {packages.map((pkg) => (
                    <div key={pkg.id} className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-white">{pkg.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{pkg.bandwidthGb} GB pool • ${pkg.priceUsd} USD</p>
                      </div>
                      <button
                        onClick={() => handleDeletePackage(pkg.id)}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* COUPONS */}
        {activeTab === 'coupons' && (
          <div className="space-y-6 animate-fade-in">
            {/* Create coupon */}
            <form onSubmit={handleCreateCoupon} className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-md space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Ticket className="w-4 h-4 text-blue-400" /> Create Coupon
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Code</label>
                  <input
                    type="text"
                    required
                    placeholder="SAVE20"
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none uppercase"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Type</label>
                  <select
                    value={newCouponType}
                    onChange={(e) => setNewCouponType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="percent">Percent (%)</option>
                    <option value="fixed">Fixed ($)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">{newCouponType === 'percent' ? 'Percent off' : 'Amount off ($)'}</label>
                  <input
                    type="number"
                    min={1}
                    max={newCouponType === 'percent' ? 100 : undefined}
                    value={newCouponValue}
                    onChange={(e) => setNewCouponValue(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Max uses (0 = ∞)</label>
                  <input
                    type="number"
                    min={0}
                    value={newCouponMaxUses}
                    onChange={(e) => setNewCouponMaxUses(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 disabled:opacity-50 rounded-xl text-xs font-bold text-white flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create Coupon
              </button>
            </form>

            {/* Coupon list */}
            <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-md space-y-4">
              <h3 className="text-base font-black text-white">Coupons ({coupons.length})</h3>
              {coupons.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4">No coupons yet. Create one above.</p>
              ) : (
                <div className="space-y-2">
                  {coupons.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-white text-sm bg-slate-900 px-2 py-1 rounded border border-slate-800">{c.code}</span>
                        <span className="text-xs text-slate-300">
                          {c.type === 'percent' ? `${c.value}% off` : `$${c.value} off`}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          used {c.usedCount}{c.maxUses > 0 ? ` / ${c.maxUses}` : ''}
                        </span>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${c.isActive ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                          {c.isActive ? 'Active' : 'Off'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleToggleCoupon(c.id)} title="Toggle active" className="text-slate-400 hover:text-white cursor-pointer">
                          {c.isActive ? <ToggleRight className="w-5 h-5 text-green-400" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                        <button onClick={() => handleDeleteCoupon(c.id)} title="Delete" className="text-slate-500 hover:text-red-400 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. COUNTRY MANAGER */}
        {activeTab === 'countries' && (
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-md space-y-6 animate-fade-in">
            <h3 className="text-base font-black text-white">Enable/Disable Country Nodes</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Disabling a country here instantly hides it from the client configuration forms.
            </p>

            <div className="space-y-3">
              {countries.map((c) => (
                <div key={c.code} className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{c.flag}</span>
                    <div>
                      <p className="font-bold text-white">{c.name} ({c.code})</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{c.totalServers} server connections configured</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleCountry(c.code, c.isEnabled)}
                    className="cursor-pointer"
                  >
                    {c.isEnabled ? (
                      <ToggleRight className="w-8 h-8 text-blue-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-600" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. AUDIT LOGS */}
        {activeTab === 'logs' && (
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-md space-y-6 animate-fade-in">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              Dynamic Audit Ledger Logs
            </h3>

            <div className="space-y-2.5 h-96 overflow-y-auto font-mono text-[11px] pr-2">
              {logs.map((lg) => (
                <div key={lg.id} className="p-2.5 bg-slate-950 border border-slate-850/80 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className={`font-bold ${
                      lg.level === 'error' ? 'text-red-400' : lg.level === 'security' ? 'text-purple-400' : 'text-blue-400'
                    }`}>
                      [{lg.level.toUpperCase()}] • {lg.category.toUpperCase()}
                    </span>
                    <span className="text-slate-500">{new Date(lg.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-300">{lg.message}</p>
                  {lg.ipAddress && <p className="text-[9px] text-slate-600">Origin IP: {lg.ipAddress}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. SETTINGS EDITOR */}
        {activeTab === 'settings' && apiSettings && paymentSettings && websiteSettings && (
          <form onSubmit={handleSaveSettings} className="space-y-6 animate-fade-in">
            
            {/* Global Branding settings */}
            <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                Global Branding & Features
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Site Display Name</label>
                  <input 
                    type="text" 
                    value={websiteSettings.siteName}
                    onChange={(e) => setWebsiteSettings({ ...websiteSettings, siteName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Support E-mail Contact</label>
                  <input
                    type="email"
                    value={websiteSettings.supportEmail}
                    onChange={(e) => setWebsiteSettings({ ...websiteSettings, supportEmail: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Google OAuth Client ID (for "Continue with Google")</label>
                  <input
                    type="text"
                    placeholder="xxxxxxxx.apps.googleusercontent.com"
                    value={websiteSettings.googleClientId || ''}
                    onChange={(e) => setWebsiteSettings({ ...websiteSettings, googleClientId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Create a Web OAuth Client ID in <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google Cloud Console</a> → Credentials. Add <span className="font-mono text-slate-400">https://proxygpt.online</span> to Authorized JavaScript origins. Leave blank to hide the Google button.
                  </p>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Video Tutorial — YouTube URL</label>
                  <input
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={websiteSettings.tutorialVideoUrl || ''}
                    onChange={(e) => setWebsiteSettings({ ...websiteSettings, tutorialVideoUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Shown in the client dashboard's <span className="text-slate-400">Video Tutorial</span> tab. Paste any YouTube link (watch, youtu.be, or embed). Leave blank to show a placeholder.
                  </p>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Pinned Countries — top of dropdown</label>
                  <input
                    type="text"
                    placeholder="US, GB, CA"
                    value={websiteSettings.pinnedCountries || ''}
                    onChange={(e) => setWebsiteSettings({ ...websiteSettings, pinnedCountries: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Comma-separated <span className="text-slate-400">ISO-2 country codes</span> (e.g. <span className="text-slate-400">US, GB, CA</span>) pinned to the top of the client's Create-Proxy country dropdown. The rest stay alphabetical.
                  </p>
                </div>
                <div className="space-y-1.5 sm:col-span-2 border-t border-slate-850 pt-4 mt-2">
                  <label className="text-[9px] font-bold text-blue-400 uppercase block">Change Administrator Password</label>
                  <input
                    type="password"
                    placeholder="Enter new administrator password to update..."
                    value={adminNewPassword}
                    onChange={(e) => setAdminNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Updates the administrator's profile password. Leave blank if you do not want to modify it.
                  </p>
                </div>
              </div>
            </div>

            {/* API Proxy configurations */}
            <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Code className="w-4 h-4 text-purple-400" />
                Proxy Provider API settings
              </h4>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Proxy API Endpoint URL</label>
                  <input 
                    type="text" 
                    value={apiSettings.proxyProviderUrl}
                    onChange={(e) => setApiSettings({ ...apiSettings, proxyProviderUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">API Secret / Authorization Token</label>
                  <input 
                    type="password" 
                    value={apiSettings.proxyProviderApiKey}
                    onChange={(e) => setApiSettings({ ...apiSettings, proxyProviderApiKey: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Geonode Reseller User ID (resellerUid UUID)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d"
                    value={apiSettings.resellerUid || ''}
                    onChange={(e) => setApiSettings({ ...apiSettings, resellerUid: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none" 
                  />
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Required for proxy provisioning. Find this on your Geonode Reseller Dashboard at <a href="https://app-api.geonode.com/api/reseller/v2/docs" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Geonode Reseller Portal</a>.
                  </p>
                </div>
              </div>
            </div>

            {/* Proxy-Seller Residential API — powers the landing pricing cards */}
            <div className="bg-slate-900/40 border border-emerald-500/20 p-6 rounded-3xl space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-400" />
                Proxy-Seller Residential API
              </h4>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Residential API Base URL</label>
                  <input
                    type="text"
                    placeholder="https://proxy-seller.com/personal/api/v1"
                    value={apiSettings.residentialApiUrl || ''}
                    onChange={(e) => setApiSettings({ ...apiSettings, residentialApiUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Personal API Key</label>
                  <input
                    type="password"
                    placeholder="Paste your Proxy-Seller personal API key"
                    value={apiSettings.residentialApiKey || ''}
                    onChange={(e) => setApiSettings({ ...apiSettings, residentialApiKey: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Powers the live landing pricing cards via <span className="font-mono text-slate-400">/resident/package</span> + <span className="font-mono text-slate-400">/resident/consumption</span>. Get your key from the <a href="https://proxy-seller.com/personal/api/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Proxy-Seller API panel</a> (docs: <a href="https://docs.proxy-seller.com/api-v1/residential-proxy" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">residential-proxy</a>). Leave blank to show demo rates. The key is embedded in the request URL path, so make sure your server IP is whitelisted in the Proxy-Seller panel.
                  </p>
                </div>
              </div>
            </div>

            {/* ZiniPay — Bangla QR / bKash / Nagad / card (powers "Pay with Card / Bangla QR") */}
            <div className="bg-slate-900/40 border border-emerald-500/20 p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  ZiniPay (Bangla QR / bKash / Nagad)
                </h4>
                {/* Show/hide the ZiniPay button at checkout */}
                <button
                  type="button"
                  onClick={() => setPaymentSettings({ ...paymentSettings, zinipayEnabled: !paymentSettings.zinipayEnabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${paymentSettings.zinipayEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
                  title={paymentSettings.zinipayEnabled ? 'ZiniPay button is SHOWN at checkout' : 'ZiniPay button is HIDDEN at checkout'}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${paymentSettings.zinipayEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                {paymentSettings.zinipayEnabled
                  ? 'The "Pay with ZiniPay" button is visible to customers at checkout.'
                  : 'The "Pay with ZiniPay" button is hidden — customers only see BDT Payment (PayStation).'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">ZiniPay API Key (Brand Key)</label>
                  <input
                    type="password"
                    placeholder="sandbox_test_... or live key"
                    value={paymentSettings.zinipayApiKey || ''}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, zinipayApiKey: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">USD → BDT rate</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="120"
                    value={paymentSettings.zinipayUsdToBdt ?? ''}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, zinipayUsdToBdt: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Get your Brand/API key from the <a href="https://dash.zinipay.com/login" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">ZiniPay dashboard</a> → Brands. Packages are priced in USD; ZiniPay charges in BDT, so amounts are converted using this rate. Docs: <a href="https://zinipay.com/docs" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">zinipay.com/docs</a>.
              </p>
            </div>

            {/* PayStation — bKash / Nagad / Rocket / card (Bangladesh) */}
            <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                PayStation (bKash / Nagad / Rocket / Card)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Store ID (Merchant ID)</label>
                  <input
                    type="text"
                    placeholder="5615-XXXXXXXXXX"
                    value={paymentSettings.paystationMerchantId || ''}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, paystationMerchantId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">API Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={paymentSettings.paystationPassword || ''}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, paystationPassword: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">API Base URL</label>
                  <input
                    type="text"
                    placeholder="https://api.paystation.com.bd"
                    value={paymentSettings.paystationBaseUrl || ''}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, paystationBaseUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">USD → BDT rate</label>
                  <input
                    type="number"
                    placeholder="120"
                    value={paymentSettings.paystationUsdToBdt ?? ''}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, paystationUsdToBdt: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Get your <span className="text-slate-400">Store ID</span> and <span className="text-slate-400">API password</span> from the <a href="https://www.paystation.com.bd" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">PayStation merchant panel</a>. Packages are priced in USD; PayStation charges in BDT, converted using this rate.
              </p>
            </div>

            {/* Cryptomus — crypto (USDT / BTC / ETH …) */}
            <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                Cryptomus (USDT / BTC / ETH — Crypto)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Merchant UUID</label>
                  <input
                    type="text"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={paymentSettings.cryptomusMerchantId || ''}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, cryptomusMerchantId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Payment API Key</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={paymentSettings.cryptomusApiKey || ''}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, cryptomusApiKey: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">API Base URL</label>
                  <input
                    type="text"
                    placeholder="https://api.cryptomus.com"
                    value={paymentSettings.cryptomusBaseUrl || ''}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, cryptomusBaseUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Get your <span className="text-slate-400">Merchant UUID</span> and <span className="text-slate-400">Payment API key</span> from the <a href="https://app.cryptomus.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Cryptomus dashboard</a> → Settings. Charged in USD; the customer pays in any supported crypto.
              </p>
            </div>

            {/* LTESocks — mobile (5G/LTE) proxies */}
            <div className="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                LTESocks (Mobile 5G/LTE Proxies)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Authorization Token</label>
                  <input
                    type="password"
                    placeholder="Bearer 1416|••••••••"
                    value={paymentSettings.ltesocksApiKey || ''}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, ltesocksApiKey: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">API Base URL</label>
                  <input
                    type="text"
                    placeholder="https://api.ltesocks.io/v2"
                    value={paymentSettings.ltesocksBaseUrl || ''}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, ltesocksBaseUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Price divisor (→ USD)</label>
                  <input
                    type="number"
                    placeholder="100"
                    value={paymentSettings.ltesocksPriceDivisor ?? ''}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, ltesocksPriceDivisor: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Max Speed (mbit/s)</label>
                  <input
                    type="number"
                    placeholder="30"
                    value={paymentSettings.ltesocksMaxSpeed ?? ''}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, ltesocksMaxSpeed: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Stock / IP Pool Size</label>
                  <input
                    type="number"
                    placeholder="30"
                    value={paymentSettings.ltesocksStock ?? ''}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, ltesocksStock: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Mobile Proxy Countries (ISO-2, comma-separated)</label>
                  <input
                    type="text"
                    placeholder="US, DE, FR, CA, GB, AU"
                    value={paymentSettings.ltesocksCountries || ''}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, ltesocksCountries: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Mobile Prices — days:USD (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="7:4.10, 15:8.15, 30:15.75"
                    value={paymentSettings.ltesocksPrices || ''}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, ltesocksPrices: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500">Custom resale price per duration (overrides LTESocks pass-through). Format <span className="text-slate-400">days:usd</span>, e.g. <span className="text-slate-400">7:4.10, 15:8.15, 30:15.75</span>.</p>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">In-Stock Plans (name fragments, comma-separated)</label>
                  <input
                    type="text"
                    placeholder="Bell Mobility, T-Mobile, Deutsche Telekom"
                    value={paymentSettings.ltesocksAvailablePlans || ''}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, ltesocksAvailablePlans: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500">Plans whose name contains any of these show as <span className="text-green-400">available</span>; all others show <span className="text-red-400">out of stock</span>. Leave blank to use live LTESocks availability. Available plans are sorted to the top.</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Get your token from the <a href="https://ltesocks.io" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">LTESocks dashboard</a> → API. Powers the client's <span className="text-slate-400">Mobile Proxies</span> tab (pass-through pricing, paid from wallet). Divisor converts LTESocks plan prices to USD (100 = prices are in cents). Keep your LTESocks account funded so orders succeed.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-xs font-bold text-white rounded-xl shadow-lg shadow-blue-950/40 cursor-pointer"
            >
              Save Configurations on VPS Server
            </button>
          </form>
        )}

        {/* NOTICE BOARD TAB */}
        {activeTab === 'notice' && (
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-black text-white">Notice Board Manager</h2>
              <span className="ml-auto text-[10px] text-slate-500 font-mono">{noticePosts.length} total posts</span>
            </div>

            {/* Create / Edit Form */}
            <form
              onSubmit={editingNotice ? handleUpdateNotice : handleCreateNotice}
              className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4 backdrop-blur-md"
            >
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                {editingNotice ? <Edit2 className="w-3.5 h-3.5 text-blue-400" /> : <Plus className="w-3.5 h-3.5 text-amber-400" />}
                {editingNotice ? 'Edit Notice Post' : 'Create New Notice'}
                {editingNotice && (
                  <button type="button" onClick={() => setEditingNotice(null)} className="ml-auto text-slate-500 hover:text-white cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </h3>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase block">Title *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. 🚀 New Feature Released — Residential Proxies v2"
                  value={editingNotice ? editingNotice.title : noticeForm.title}
                  onChange={(e) => editingNotice
                    ? setEditingNotice({ ...editingNotice, title: e.target.value })
                    : setNoticeForm({ ...noticeForm, title: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase block">Message Body *</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Write your announcement here. You can use line breaks for formatting."
                  value={editingNotice ? editingNotice.body : noticeForm.body}
                  onChange={(e) => editingNotice
                    ? setEditingNotice({ ...editingNotice, body: e.target.value })
                    : setNoticeForm({ ...noticeForm, body: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Tag / Category</label>
                  <select
                    value={editingNotice ? editingNotice.tag : noticeForm.tag}
                    onChange={(e) => editingNotice
                      ? setEditingNotice({ ...editingNotice, tag: e.target.value as NoticePost['tag'] })
                      : setNoticeForm({ ...noticeForm, tag: e.target.value as NoticePost['tag'] })
                    }
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="info">ℹ️ Info</option>
                    <option value="update">🔄 Update</option>
                    <option value="feature">✨ Feature</option>
                    <option value="maintenance">🔧 Maintenance</option>
                    <option value="alert">🚨 Alert</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Pin to Top</label>
                  <button
                    type="button"
                    onClick={() => editingNotice
                      ? setEditingNotice({ ...editingNotice, isPinned: !editingNotice.isPinned })
                      : setNoticeForm({ ...noticeForm, isPinned: !noticeForm.isPinned })
                    }
                    className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      (editingNotice ? editingNotice.isPinned : noticeForm.isPinned)
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                        : 'bg-slate-950 border-slate-850 text-slate-500 hover:text-white'
                    }`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                    {(editingNotice ? editingNotice.isPinned : noticeForm.isPinned) ? 'Pinned' : 'Not Pinned'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-xs font-bold text-black rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                {actionLoading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : editingNotice ? <><Save className="w-4 h-4" /> Save Changes</> : <><Plus className="w-4 h-4" /> Post Notice</>}
              </button>
            </form>

            {/* Existing Posts */}
            {noticePosts.length === 0 ? (
              <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-10 text-center">
                <Bell className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                <p className="text-xs text-slate-500">No notice posts yet. Create one above.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {noticePosts.map((post) => {
                  const tagColors: Record<string, string> = {
                    update: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                    maintenance: 'text-red-400 bg-red-500/10 border-red-500/20',
                    feature: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                    alert: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
                    info: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
                  };
                  return (
                    <div
                      key={post.id}
                      className={`relative bg-slate-900/40 border rounded-2xl p-5 backdrop-blur-md ${
                        post.isPinned ? 'border-amber-500/25' : 'border-slate-850'
                      }`}
                    >
                      {post.isPinned && (
                        <span className="absolute top-3 right-3 flex items-center gap-1 text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          <Pin className="w-2.5 h-2.5" /> Pinned
                        </span>
                      )}

                      <div className="flex items-start gap-3 pr-16">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                          <Bell className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${tagColors[post.tag] || tagColors.info}`}>
                              {post.tag}
                            </span>
                            <p className="text-xs font-bold text-white">{post.title}</p>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed mt-1 whitespace-pre-wrap">{post.body}</p>
                          <p className="text-[10px] text-slate-600 mt-2 font-mono">
                            {new Date(post.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      <div className="absolute bottom-4 right-4 flex items-center gap-2">
                        <button
                          onClick={() => setEditingNotice(post)}
                          className="p-1.5 bg-slate-900 border border-slate-800 hover:border-blue-500/30 rounded-lg text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteNotice(post.id)}
                          className="p-1.5 bg-slate-900 border border-slate-800 hover:border-red-500/30 rounded-lg text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SUPPORT TICKETS TAB */}
        {activeTab === 'support' && (
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-black text-white">Client Helpdesk Tickets</h2>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-slate-900/40 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Awaiting Triage</p>
                  <p className="text-2xl font-black text-white mt-1">{supportStats.openCount}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <div className="bg-slate-900/40 border border-blue-500/30 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">In Progress</p>
                  <p className="text-2xl font-black text-white mt-1">{supportStats.inProgressCount}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Terminal className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <div className="bg-slate-900/40 border border-green-500/30 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Total Resolved</p>
                  <p className="text-2xl font-black text-white mt-1">{supportTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {supportTickets.length === 0 ? (
                <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-10 text-center">
                  <HelpCircle className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                  <p className="text-xs text-slate-500">No support tickets found.</p>
                </div>
              ) : (
                supportTickets.map(t => (
                  <div key={t.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 backdrop-blur-md flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                          t.status === 'open'        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          : t.status === 'in-progress' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                          : t.status === 'resolved'    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                          : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
                        }`}>
                          {t.status.toUpperCase()}
                        </span>
                        <span className="font-mono text-xs font-bold text-white">{t.id}</span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-950 px-2 py-0.5 rounded-full capitalize border border-slate-800">
                          {t.category}
                        </span>
                      </div>
                      
                      <div className="bg-slate-950 border border-slate-850 rounded-xl p-4">
                        <p className="text-xs text-slate-300 whitespace-pre-wrap">{t.message}</p>
                      </div>
                      
                      <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono">
                        <span>From: <b className="text-slate-300">{t.userEmail}</b> ({t.userName})</span>
                        <span>•</span>
                        <span>Opened: {new Date(t.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="lg:w-72 shrink-0 bg-slate-950/50 rounded-xl p-4 border border-slate-800 flex flex-col gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Change Status</label>
                        <select 
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
                          value={t.status}
                          onChange={(e) => handleUpdateSupportTicket(t.id, e.target.value as any)}
                        >
                          <option value="open">Open (Awaiting Triage)</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>

                      <div className="space-y-1.5 flex-1 flex flex-col">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Admin Reply</label>
                        <textarea
                          placeholder={t.adminReply || "Type a reply to the client..."}
                          className="w-full flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 resize-none min-h-[80px]"
                          value={ticketReplies[t.id] ?? t.adminReply ?? ''}
                          onChange={(e) => setTicketReplies({ ...ticketReplies, [t.id]: e.target.value })}
                        />
                        <button 
                          disabled={actionLoading || (!ticketReplies[t.id] && ticketReplies[t.id] !== '')}
                          onClick={() => handleUpdateSupportTicket(t.id, t.status)}
                          className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          Save Reply
                        </button>
                      </div>
                      
                      <div className="pt-3 border-t border-slate-800">
                        <button
                          onClick={() => handleDeleteSupportTicket(t.id)}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer border border-red-500/20"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete Ticket
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* MOBILE PROXY MANAGEMENT TAB */}
        {activeTab === 'mobile-proxies' && (
          <MobileProxyAdmin />
        )}

      </main>
    </div>
  );
}
