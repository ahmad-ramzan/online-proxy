/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Smartphone, Trash2, Loader2, Copy, Check, Zap, Wallet, ShoppingBag } from 'lucide-react';
import { api } from '../services/api';
import { copyToClipboard } from '../utils/clipboard';

interface MobilePlanGroup {
  planName: string;
  countryCode: string;
  priceUsd: number;
  availableCount: number;
  operator?: string;
  poolSize?: string;
  maxSpeedMbps?: number;
  ipChangeDelaySec?: number;
  rotationMinutes?: number;
}

interface MobileProxiesProps {
  walletBalance: number;
  onBalanceChange: () => void;
  onTopUp: (amount?: number) => void;
  onCheckout: (planName: string, countryCode: string, subtitle: string, priceUsd: number) => void;
}

const flagEmoji = (code: string) => {
  if (!code || code.length !== 2) return '🌐';
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 127397 + c.charCodeAt(0)));
};

const countryDisplayNames = typeof Intl !== 'undefined' && (Intl as any).DisplayNames
  ? new (Intl as any).DisplayNames(['en'], { type: 'region' })
  : null;
const countryName = (code: string) => {
  if (!code) return '—';
  try { return countryDisplayNames?.of(code.toUpperCase()) || code; } catch { return code; }
};

export default function MobileProxies({ walletBalance, onTopUp, onCheckout }: MobileProxiesProps) {
  const [plans, setPlans] = useState<MobilePlanGroup[]>([]);
  const [mine, setMine] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState('ALL');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [p, m] = await Promise.all([api.mobile.getPlans(), api.mobile.getMy()]);
      setPlans(p.plans || []);
      setMine(m || []);
    } catch (e: any) {
      setError(e.message || 'Could not load mobile proxies.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  // Reload the owned-proxy list after a wallet purchase (balance changes).
  useEffect(() => { if (!loading) load(); /* eslint-disable-next-line */ }, [walletBalance]);

  const uniqCountries: string[] = [];
  plans.forEach((p) => { if (p.countryCode && !uniqCountries.includes(p.countryCode)) uniqCountries.push(p.countryCode); });
  const countries: string[] = ['ALL', ...uniqCountries];
  const shown = plans.filter(p => country === 'ALL' || p.countryCode === country);

  const buy = (plan: MobilePlanGroup) => {
    const subtitle = `${flagEmoji(plan.countryCode)} ${plan.planName} (${plan.countryCode})`;
    onCheckout(plan.planName, plan.countryCode, subtitle, plan.priceUsd);
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

  return (
    <div className="space-y-8 animate-fade-in text-slate-200">
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold rounded-xl px-4 py-3">{error}</div>}

      {/* My mobile proxies */}
      {mine.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Smartphone className="w-4 h-4 text-purple-400" /> My Mobile Proxies</h3>
          <div className="space-y-3">
            {mine.map((m) => {
              const conn = `${m.username}:${m.password}@${m.ip}:${m.port}`;
              return (
                <div key={m.id} className="bg-slate-900/50 border border-slate-850 rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{flagEmoji(m.countryCode)}</span>
                      <div>
                        <p className="text-xs font-bold text-white">{m.planName}</p>
                        <p className="text-[10px] text-slate-500">{(m.protocol || 'socks5').toUpperCase()}</p>
                      </div>
                    </div>
                    <button onClick={() => remove(m)} disabled={busyId === m.id} className="p-1.5 bg-slate-800 hover:bg-red-900/40 border border-slate-700 rounded-lg text-slate-400 hover:text-red-300 cursor-pointer">
                      {busyId === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
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

        {countries.length > 2 && (
          <div className="mb-4 space-y-1 max-w-xs">
            <label className="text-[9px] font-bold text-slate-500 uppercase block">Country</label>
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 cursor-pointer">
              {countries.map(c => <option key={c} value={c}>{c === 'ALL' ? 'All Countries' : `${flagEmoji(c)}  ${c}`}</option>)}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {shown.map((plan) => {
            const inStock = plan.availableCount > 0;
            return (
              <div key={`${plan.planName}::${plan.countryCode}`} className="bg-slate-950/60 border border-slate-850 hover:border-violet-500/40 rounded-2xl p-5 flex flex-col justify-between transition-colors">
                <div>
                  <div className="flex items-center gap-2.5 border-b border-slate-850 pb-3 mb-3">
                    <span className="text-2xl">{flagEmoji(plan.countryCode)}</span>
                    <p className="text-sm font-bold text-white leading-snug">{plan.planName}</p>
                  </div>
                  <div className="flex justify-between gap-4 text-[11px]">
                    <div className="space-y-1.5">
                      <div><span className="text-slate-500">Country:</span> <span className="text-slate-200 font-semibold">{countryName(plan.countryCode)}</span></div>
                      {plan.operator && <div><span className="text-slate-500">Operator:</span> <span className="text-slate-200 font-semibold">{plan.operator}</span></div>}
                      <div><span className="text-slate-500">Type:</span> <span className="text-slate-200 font-semibold">Private</span></div>
                    </div>
                    <div className="space-y-1.5 text-right">
                      {plan.poolSize && <div><span className="text-slate-500">IP Pool Size:</span> <span className="text-slate-200 font-semibold">{plan.poolSize}</span></div>}
                      {!!plan.maxSpeedMbps && <div><span className="text-slate-500">Max Speed:</span> <span className="text-slate-200 font-semibold">{plan.maxSpeedMbps} mbit/s</span></div>}
                      {plan.ipChangeDelaySec !== undefined && <div><span className="text-slate-500">IP Change Delay:</span> <span className="text-slate-200 font-semibold">{plan.ipChangeDelaySec}s</span></div>}
                      {!!plan.rotationMinutes && <div><span className="text-slate-500">IP Rotation:</span> <span className="text-slate-200 font-semibold">{plan.rotationMinutes} min</span></div>}
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-slate-500">Stock:</span>
                        <span className={`w-2 h-2 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className={inStock ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>{inStock ? `${plan.availableCount} available` : 'out of stock'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xl font-black text-white">${plan.priceUsd.toFixed(2)}</span>
                  <button
                    onClick={() => buy(plan)}
                    disabled={!inStock}
                    className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:brightness-110 disabled:opacity-50 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-4 h-4" />
                    {!inStock ? 'Out of stock' : 'Buy Now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {shown.length === 0 && <p className="text-center text-slate-500 text-xs py-8">No plans available right now. Please check back soon.</p>}
      </div>
    </div>
  );
}
