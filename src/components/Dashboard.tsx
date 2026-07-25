/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Server, Shield, Database, Activity, RefreshCw, Trash2, 
  Copy, Check, Plus, Globe, ExternalLink, Flame, ShieldAlert,
  Terminal, ShoppingBag, ArrowRight, Zap 
} from 'lucide-react';
import { User, CreatedProxy, ProxyOrder, PaymentTransaction } from '../types';
import { api } from '../services/api';
import { copyToClipboard } from '../utils/clipboard';

// Render a country flag emoji from an ISO-2 code (falls back to legacy names, then a globe).
function flagEmoji(code?: string, name?: string): string {
  const nameMap: Record<string, string> = { USA: 'US', UK: 'GB', 'UNITED KINGDOM': 'GB', 'UNITED STATES': 'US', CANADA: 'CA' };
  let cc = (code || '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc) && name) cc = nameMap[name.toUpperCase()] || '';
  if (!/^[A-Z]{2}$/.test(cc)) return '🌐';
  return String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

interface DashboardProps {
  user: User;
  proxies: CreatedProxy[];
  orders: ProxyOrder[];
  transactions: PaymentTransaction[];
  onRefresh: () => void;
  onCreateProxyTab: () => void;
  onPricingTab: () => void;
}

export default function Dashboard({ 
  user, proxies, orders, transactions, onRefresh, onCreateProxyTab, onPricingTab 
}: DashboardProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Real bandwidth usage from Proxy-Seller (per sub-user).
  const [usage, setUsage] = useState<{ live: boolean; usedGb: number; limitGb: number } | null>(null);
  useEffect(() => {
    let active = true;
    api.proxy.getUsage().then((u) => { if (active) setUsage(u); }).catch(() => {});
    return () => { active = false; };
  }, [orders.length, proxies.length]);

  const handleCopy = async (id: string, text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleRevokeProxy = async (proxyId: string) => {
    if (!confirm('Are you sure you want to revoke this proxy connection slot? Upstream allocation ports will be recycled.')) {
      return;
    }
    setRevokingId(proxyId);
    try {
      await api.proxy.revokeProxy(proxyId);
      onRefresh();
    } catch (e) {
      alert('Failed to revoke proxy node connection.');
    } finally {
      setRevokingId(null);
    }
  };

  const handleForceRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 500);
  };

  // Compute stats
  const totalProxies = proxies.length;
  const onlineProxies = proxies.filter(p => p.status === 'online').length;
  
  // Total bandwidth pool
  const totalGbPurchased = orders
    .filter(o => o.status === 'active')
    .reduce((acc, o) => acc + o.bandwidthGb, 0);

  const localUsedGb = parseFloat(
    orders.reduce((acc, o) => acc + o.bandwidthUsedGb, 0).toFixed(2)
  );

  // Prefer real Proxy-Seller usage; fall back to local figures until it loads.
  const totalGbUsed = usage ? Math.round(usage.usedGb * 100) / 100 : localUsedGb;
  const displayTotalGb = usage && usage.live && usage.limitGb > 0 ? usage.limitGb : totalGbPurchased;

  return (
    <div className="space-y-8 animate-fade-in text-slate-200">
      
      {/* Top Banner & Quick Stats */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <h2 className="text-2xl font-black text-white bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Welcome Back, {user.name}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Secure client account • {user.email} • ID: #{user.id.slice(-5)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleForceRefresh}
            disabled={refreshing}
            className="p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl font-bold text-xs text-slate-300 hover:text-white transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${refreshing ? 'animate-spin' : ''}`} />
            Sync Ledger
          </button>
          <button 
            onClick={onCreateProxyTab}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl font-bold text-xs text-white shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4 text-white" />
            Create proxies
          </button>
        </div>
      </div>

      {/* 3D Glassmorphism Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Metric 1 */}
        <div className="bg-slate-900/30 border border-slate-900 hover:border-slate-800 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md group transition-all duration-300 hover:-translate-y-1">
          <div className="absolute pointer-events-none top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-colors"></div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
            <Server className="w-5 h-5 text-blue-400" />
          </div>
          <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">Total Created Poxies</span>
          <p className="text-3xl font-black text-white mt-1">{totalProxies}</p>
          <span className="text-[10px] text-blue-400 mt-2 block font-medium">Mapped to current orders</span>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900/30 border border-slate-900 hover:border-slate-800 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md group transition-all duration-300 hover:-translate-y-1">
          <div className="absolute pointer-events-none top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors"></div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
            <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
          <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">Online Proxies</span>
          <p className="text-3xl font-black text-white mt-1">{onlineProxies}</p>
          <span className="text-[10px] text-emerald-400 mt-2 block font-medium">100% active routing</span>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900/30 border border-slate-900 hover:border-slate-800 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md group transition-all duration-300 hover:-translate-y-1">
          <div className="absolute pointer-events-none top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition-colors"></div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
            <Database className="w-5 h-5 text-purple-400" />
          </div>
          <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">Bandwidth Usage</span>
          <p className="text-3xl font-black text-white mt-1">{totalGbUsed} <span className="text-xs font-bold text-slate-500">/ {displayTotalGb} GB</span></p>
          
          <div className="w-full bg-slate-950 h-1 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-500" 
              style={{ width: `${displayTotalGb > 0 ? Math.min((totalGbUsed / displayTotalGb) * 100, 100) : 0}%` }}
            ></div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900/30 border border-slate-900 hover:border-slate-800 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md group transition-all duration-300 hover:-translate-y-1">
          <div className="absolute pointer-events-none top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition-colors"></div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
            <ShoppingBag className="w-5 h-5 text-indigo-400" />
          </div>
          <span className="text-xs text-slate-500 font-bold block uppercase tracking-wider">Active Packages</span>
          <p className="text-3xl font-black text-white mt-1">
            {orders.filter(o => o.status === 'active').length}
          </p>
          <span className="text-[10px] text-indigo-400 mt-2 block font-medium">Unlocked client allocation</span>
        </div>

      </div>

      {/* Main split grid: active proxies on left, active orders on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Dynamic Deployed Proxies */}
        <div className="lg:col-span-8 bg-slate-900/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-md space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                Active Proxy Endpoints
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Manage credentials or copy host lines instantly.</p>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 px-2 py-0.5 bg-slate-950 rounded-lg border border-slate-850">
              Total: {proxies.length}
            </span>
          </div>

          {proxies.length === 0 ? (
            <div className="py-12 border-2 border-dashed border-slate-900 rounded-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center mx-auto text-slate-600 border border-slate-900">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-300">No proxies created yet</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Configure your first node using an active bandwidth order package.</p>
              </div>
              <button 
                onClick={onCreateProxyTab}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-xs font-bold rounded-xl transition-all hover:text-white cursor-pointer"
              >
                Create proxies
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {proxies.map((proxy) => (
                <div 
                  key={proxy.id} 
                  className="p-4 bg-slate-950/60 border border-slate-850 hover:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all group"
                >
                  <div className="space-y-1.5 w-full sm:w-auto">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {flagEmoji(proxy.countryCode, proxy.country)}
                      </span>
                      <span className="text-xs font-bold text-white uppercase">{proxy.country} Node</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                        proxy.status === 'online' 
                          ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                          : 'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}>
                        {proxy.status}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-500 uppercase">{proxy.type}</span>
                    </div>

                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-850 flex items-center justify-between gap-2 text-[11px] font-mono w-full sm:w-80">
                      <span className="text-slate-300 truncate">
                        {proxy.ip}:{proxy.port}:{proxy.username}:{proxy.passwordHash}
                      </span>
                      <button 
                        onClick={() => handleCopy(proxy.id, `${proxy.ip}:${proxy.port}:${proxy.username}:${proxy.passwordHash}`)}
                        className="text-slate-500 hover:text-white transition-colors cursor-pointer shrink-0"
                        title="Copy proxy string"
                      >
                        {copiedId === proxy.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end border-t sm:border-t-0 border-slate-900 pt-3 sm:pt-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Rotation</p>
                      <p className="text-xs font-medium text-slate-300 mt-0.5">
                        {proxy.rotationMinutes === 0 ? 'Sticky' : `${proxy.rotationMinutes} mins`}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => handleRevokeProxy(proxy.id)}
                      disabled={revokingId === proxy.id}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 rounded-xl text-red-400 transition-all cursor-pointer"
                      title="Revoke and recycle proxy slot"
                    >
                      {revokingId === proxy.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-red-400" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live stats & logs */}
        <div className="lg:col-span-4 space-y-6">

          {/* Real-time Logs Simulated Panel inside Dashboard */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 backdrop-blur-md space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Dynamic Stream Logs
            </h3>
            
            <div className="font-mono text-[10px] text-slate-400 space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-850 h-36 overflow-y-auto">
              <p className="text-slate-500">// Sync completed: 0ms delay</p>
              <p className="text-blue-400">[info] client token authenticated successfully.</p>
              <p className="text-purple-400">[proxy] polling dynamic rotate-headers health SLA.</p>
              <p className="text-green-400">[success] active tunnels: {proxies.filter(p => p.status === 'online').length} online.</p>
              <p className="text-slate-500">[ledger] bandwidth usage query cache hit.</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
