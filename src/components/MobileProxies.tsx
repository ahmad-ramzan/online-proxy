/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Smartphone, RefreshCw, Trash2, Loader2, Copy, Check, Zap, Wallet, ShoppingBag } from 'lucide-react';
import { api } from '../services/api';
import { copyToClipboard } from '../utils/clipboard';

interface MobileProxiesProps {
  walletBalance: number;
  onBalanceChange: () => void;
  onTopUp: () => void;
}

const flagEmoji = (code: string) => {
  if (!code || code.length !== 2) return '🌐';
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 127397 + c.charCodeAt(0)));
};

// LTESocks doesn't expose the operator as a field, so derive it from the plan
// name by stripping the country prefix and marketing words.
const operatorFromName = (name: string) => {
  const s = String(name || '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(true|5G|4G|LTE|speed|unlimited)\b/gi, ' ')
    .replace(/^\s*(United Kingdom|United States|USA|US|Canada|Germany|France|Spain|Italy|Netherlands|Poland|Sweden|Norway|Finland|Belgium|Austria|Switzerland|Portugal|Ireland|Denmark|Czechia|Czech Republic|Romania|Greece|Turkey|Ukraine|Russia|United Arab Emirates|UAE)\s+/i, ' ')
    .replace(/\s+/g, ' ').trim();
  return s || '—';
};

const durationLabel = (secs: number) => {
  if (secs < 3600) return `${Math.round(secs / 60)} min`;
  if (secs < 86400) return `${Math.round(secs / 3600)} hour${secs >= 7200 ? 's' : ''}`;
  return `${Math.round(secs / 86400)} day${secs >= 172800 ? 's' : ''}`;
};

// Traffic in GB; 0 (or an "unlimited" sentinel) shows the infinity sign.
const mobileTrafficLabel = (mb: number) => (!mb || mb <= 0 || mb >= 1048576) ? '∞ GB' : `${Math.round(mb / 1024)} GB`;

export default function MobileProxies({ walletBalance, onBalanceChange, onTopUp }: MobileProxiesProps) {
  const [configured, setConfigured] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [mine, setMine] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState('ALL');
  const [operator, setOperator] = useState('ALL');
  const [ptype, setPtype] = useState('ALL');
  const [selDur, setSelDur] = useState<Record<string, number>>({});
  const [ordering, setOrdering] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [p, m] = await Promise.all([api.mobile.getPlans(), api.mobile.getMy()]);
      setConfigured(p.configured);
      setPlans(p.plans || []);
      setMine(m || []);
    } catch (e: any) {
      setError(e.message || 'Could not load mobile proxies.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const uniqCountries: string[] = [];
  const uniqOperators: string[] = [];
  plans.forEach((p) => {
    const c = String(p.countryCode || ''); if (c && !uniqCountries.includes(c)) uniqCountries.push(c);
    const op = operatorFromName(p.name); if (op && op !== '—' && !uniqOperators.includes(op)) uniqOperators.push(op);
  });
  uniqOperators.sort();
  const countries: string[] = ['ALL', ...uniqCountries];
  const shown = plans.filter(p =>
    (country === 'ALL' || p.countryCode === country) &&
    (operator === 'ALL' || operatorFromName(p.name) === operator) &&
    (ptype === 'ALL' || ptype === 'Private')
  );

  const order = async (plan: any) => {
    const idx = selDur[plan.id] ?? 0;
    const trf = plan.tarifications[idx];
    if (!trf) return;
    if (walletBalance < trf.priceUsd) { onTopUp(); return; }
    setError(''); setOrdering(plan.id);
    try {
      await api.mobile.order(plan.id, idx);
      await load();
      onBalanceChange();
    } catch (e: any) {
      setError(e.message || 'Order failed.');
    } finally {
      setOrdering(null);
    }
  };

  const rotate = async (m: any) => {
    setBusyId(m.id); setError('');
    try { await api.mobile.reset(m.id); await load(); }
    catch (e: any) { setError(e.message || 'Rotate failed.'); }
    finally { setBusyId(null); }
  };
  const remove = async (m: any) => {
    if (!confirm('Release this mobile proxy? This cannot be undone.')) return;
    setBusyId(m.id); setError('');
    try { await api.mobile.remove(m.id); await load(); }
    catch (e: any) { setError(e.message || 'Delete failed.'); }
    finally { setBusyId(null); }
  };
  const copy = async (id: string, text: string) => {
    if (await copyToClipboard(text)) { setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); }
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  if (!configured) return (
    <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-10 text-center text-slate-400">
      <Smartphone className="w-10 h-10 mx-auto mb-3 text-slate-600" />
      Mobile proxies are not available yet. Please check back soon.
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in text-slate-200">
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold rounded-xl px-4 py-3">{error}</div>}

      {/* My mobile proxies */}
      {mine.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Smartphone className="w-4 h-4 text-purple-400" /> My Mobile Proxies</h3>
          <div className="space-y-3">
            {mine.map((m) => {
              const conn = `${m.ip}:${m.port}:${m.username}:${m.password}`;
              const expired = new Date(m.expiresAt).getTime() < Date.now();
              return (
                <div key={m.id} className="bg-slate-900/50 border border-slate-850 rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{flagEmoji(m.countryCode)}</span>
                      <div>
                        <p className="text-xs font-bold text-white">{m.planName}</p>
                        <p className="text-[10px] text-slate-500">{m.protocol.toUpperCase()} · {expired ? <span className="text-red-400">expired</span> : `expires ${new Date(m.expiresAt).toLocaleDateString()}`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => rotate(m)} disabled={busyId === m.id || expired} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 rounded-lg text-[11px] font-bold text-white flex items-center gap-1.5 cursor-pointer">
                        {busyId === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 text-blue-400" />} Rotate IP
                      </button>
                      <button onClick={() => remove(m)} disabled={busyId === m.id} className="p-1.5 bg-slate-800 hover:bg-red-900/40 border border-slate-700 rounded-lg text-slate-400 hover:text-red-300 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <button onClick={() => copy(m.id, conn)} className="mt-3 w-full flex items-center justify-between gap-3 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 cursor-pointer group">
                    <span className="font-mono text-[11px] text-slate-300 truncate">{conn}</span>
                    {copiedId === m.id ? <Check className="w-3.5 h-3.5 text-green-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-white shrink-0" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Browse & buy */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-emerald-400" /> Buy Mobile Proxy</h3>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-850 rounded-xl">
            <Wallet className="w-3.5 h-3.5 text-emerald-400" /><span className="text-xs font-bold text-white">${walletBalance.toFixed(2)}</span>
          </div>
        </div>

        {/* Filters — Country · Operator · Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase block">Country</label>
            <select value={country} onChange={(e) => { setCountry(e.target.value); setOperator('ALL'); }} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 cursor-pointer">
              {countries.map(c => <option key={c} value={c}>{c === 'ALL' ? 'All Countries' : `${flagEmoji(c)}  ${c}`}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase block">Operator</label>
            <select value={operator} onChange={(e) => setOperator(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 cursor-pointer">
              <option value="ALL">All Operators</option>
              {uniqOperators.map(op => <option key={op} value={op}>{op}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase block">Type</label>
            <select value={ptype} onChange={(e) => setPtype(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 cursor-pointer">
              <option value="ALL">All Types</option>
              <option value="Private">Private</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {shown.map((plan) => {
            const idx = selDur[plan.id] ?? 0;
            const trf = plan.tarifications[idx];
            const inStock = plan.availablePorts > 0;
            const operator = operatorFromName(plan.name);
            return (
              <div key={plan.id} className="bg-slate-950/60 border border-slate-850 hover:border-violet-500/40 rounded-2xl p-5 flex flex-col justify-between transition-colors">
                <div>
                  <div className="flex items-center gap-2.5 border-b border-slate-850 pb-3 mb-3">
                    <span className="text-2xl">{flagEmoji(plan.countryCode)}</span>
                    <p className="text-sm font-bold text-white leading-snug">{plan.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 text-[11px]">
                    <div><span className="text-slate-500">Country:</span> <span className="text-slate-200 font-semibold">{plan.countryCode}</span></div>
                    <div className="text-right"><span className="text-slate-500">IP Pool:</span> <span className="text-slate-200 font-semibold">{plan.availablePorts}</span></div>
                    <div><span className="text-slate-500">Operator:</span> <span className="text-slate-200 font-semibold">{operator}</span></div>
                    <div className="text-right"><span className="text-slate-500">VPN:</span> <span className="text-slate-200 font-semibold">{plan.vpnAccess ? 'Yes' : 'No'}</span></div>
                    <div><span className="text-slate-500">Type:</span> <span className="text-slate-200 font-semibold">Private</span></div>
                    <div className="text-right flex items-center justify-end gap-1.5">
                      <span className="text-slate-500">Stock:</span>
                      <span className={`w-2 h-2 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span className={inStock ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>{inStock ? 'available' : 'out'}</span>
                    </div>
                  </div>
                  <select
                    value={idx}
                    onChange={(e) => setSelDur({ ...selDur, [plan.id]: parseInt(e.target.value) })}
                    className="w-full mt-4 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                  >
                    {plan.tarifications.map((t: any, i: number) => (
                      <option key={i} value={i}>{durationLabel(t.time)} · {mobileTrafficLabel(t.trafficMb)} · ${t.priceUsd}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xl font-black text-white">${trf?.priceUsd ?? '—'}</span>
                  <button
                    onClick={() => order(plan)}
                    disabled={ordering === plan.id || !inStock}
                    className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:brightness-110 disabled:opacity-50 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    {ordering === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    {!inStock ? 'Out of stock' : (trf && walletBalance < trf.priceUsd ? 'Top Up' : 'Activate')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {shown.length === 0 && <p className="text-center text-slate-500 text-xs py-8">No plans available for this country.</p>}
      </div>
    </div>
  );
}
