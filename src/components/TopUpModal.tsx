/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { Wallet, Loader2, X, ArrowRight, Phone } from 'lucide-react';
import { api } from '../services/api';

interface TopUpModalProps {
  showZinipay?: boolean;
  defaultAmount?: number;
  onClose: () => void;
}

const PRESETS = [5, 10, 20, 50];

export default function TopUpModal({ showZinipay = false, defaultAmount, onClose }: TopUpModalProps) {
  const [amount, setAmount] = useState(defaultAmount && defaultAmount > 0 ? String(defaultAmount) : '10');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const amountInputRef = useRef<HTMLInputElement>(null);

  const amt = parseFloat(amount) || 0;
  const isCustomAmount = amount.trim() !== '' && !PRESETS.includes(amt);

  const topup = async (gateway: 'credit_card' | 'paystation' | 'cryptomus') => {
    if (amt < 1) { setError('Minimum top-up is $1.'); return; }
    if (gateway === 'paystation' && !phone.trim()) { setError('Phone number is required for BDT Payment.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await api.wallet.topup(amt, gateway, phone.trim() || undefined);
      if (res.external || /^https?:\/\//i.test(res.checkoutUrl)) {
        window.location.href = res.checkoutUrl;
        return;
      }
      window.location.href = res.checkoutUrl;
    } catch (e: any) {
      setError(e.message || 'Top-up could not be started.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full relative shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-400" /> Top Up Wallet
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white cursor-pointer w-6 h-6 flex items-center justify-center bg-slate-950 rounded-full border border-slate-800/60">
            <X className="w-4 h-4" />
          </button>
        </div>

        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Amount (USD)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">$</span>
          <input
            ref={amountInputRef}
            type="number" min="1" step="1" value={amount}
            onChange={(e) => { setAmount(e.target.value); setError(''); }}
            className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-7 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="grid grid-cols-5 gap-2 mt-2">
          {PRESETS.map((p) => (
            <button key={p} type="button" onClick={() => { setAmount(String(p)); setError(''); }}
              className={`py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${amt === p ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
              ${p}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setError('');
              amountInputRef.current?.focus();
              amountInputRef.current?.select();
            }}
            className={`py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${isCustomAmount ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            Custom
          </button>
        </div>

        {/* Phone (required for BDT Payment) */}
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 mt-4">Phone number</label>
        <div className="relative">
          <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="tel" value={phone}
            onChange={(e) => { setPhone(e.target.value.replace(/[^0-9+]/g, '')); setError(''); }}
            placeholder="01XXXXXXXXX"
            className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {error && <p className="text-[11px] text-red-400 mt-2">{error}</p>}

        <div className="mt-5 space-y-2.5">
          {showZinipay && (
            <button type="button" onClick={() => topup('credit_card')} disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 disabled:opacity-50 rounded-xl font-bold text-sm text-white shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2 cursor-pointer transition-all">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</> : <>Add ${amt || 0} via ZiniPay <ArrowRight className="w-4 h-4" /></>}
            </button>
          )}
          <button type="button" onClick={() => topup('paystation')} disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 disabled:opacity-50 rounded-xl font-bold text-sm text-white shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 cursor-pointer transition-all">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</> : <>Add ${amt || 0} via BDT Payment <ArrowRight className="w-4 h-4" /></>}
          </button>
          <button type="button" onClick={() => topup('cryptomus')} disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 disabled:opacity-50 rounded-xl font-bold text-sm text-white shadow-lg shadow-orange-900/40 flex items-center justify-center gap-2 cursor-pointer transition-all">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</> : <>Add ${amt || 0} with Crypto <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
        <p className="text-[10px] text-slate-500 text-center mt-3">Funds are added to your wallet balance in USD after payment.</p>
      </div>
    </div>
  );
}
