/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Tag, Loader2, Check, X, ArrowRight, Phone } from 'lucide-react';
import { ProxyPackage } from '../types';
import { api } from '../services/api';

interface CheckoutModalProps {
  pkg: ProxyPackage;
  loading: boolean;
  onClose: () => void;
  onProceed: (couponCode: string, gateway: 'credit_card' | 'paystation', phone: string) => void;
}

export default function CheckoutModal({ pkg, loading, onClose, onProceed }: CheckoutModalProps) {
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [applied, setApplied] = useState<{ valid: boolean; finalUsd?: number; discountUsd?: number; message: string } | null>(null);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const applyCoupon = async () => {
    const c = code.trim();
    if (!c) { setApplied(null); return; }
    setChecking(true);
    try {
      const r = await api.payment.validateCoupon(c, pkg.id);
      setApplied({ valid: r.valid, finalUsd: r.finalUsd, discountUsd: r.discountUsd, message: r.message });
    } catch (e: any) {
      setApplied({ valid: false, message: e.message || 'Could not validate coupon.' });
    } finally {
      setChecking(false);
    }
  };

  const hasDiscount = !!applied?.valid && applied.finalUsd != null;
  const finalPrice = hasDiscount ? applied!.finalUsd! : pkg.priceUsd;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full relative shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Checkout</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white cursor-pointer w-6 h-6 flex items-center justify-center bg-slate-950 rounded-full border border-slate-800/60">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Package summary */}
        <div className="p-4 bg-slate-950/50 border border-slate-850 rounded-2xl mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">{pkg.name}</p>
              <p className="text-[11px] text-slate-400">{pkg.bandwidthGb} GB residential bandwidth · 30 days</p>
            </div>
            <div className="text-right">
              {hasDiscount && (
                <p className="text-[11px] text-slate-500 line-through">${pkg.priceUsd}</p>
              )}
              <p className="text-2xl font-black text-white">${finalPrice}</p>
            </div>
          </div>
        </div>

        {/* Coupon */}
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Coupon code</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setApplied(null); }}
              placeholder="Enter code"
              className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 uppercase"
            />
          </div>
          <button
            type="button"
            onClick={applyCoupon}
            disabled={checking || !code.trim()}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-bold text-white rounded-xl cursor-pointer transition-colors"
          >
            {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
          </button>
        </div>

        {applied && (
          <p className={`text-[11px] mt-2 flex items-center gap-1.5 ${applied.valid ? 'text-emerald-400' : 'text-red-400'}`}>
            {applied.valid && <Check className="w-3.5 h-3.5" />}
            {applied.message}
          </p>
        )}

        {/* Phone (required for PayStation) */}
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 mt-4">Phone number</label>
        <div className="relative">
          <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="tel"
            value={phone}
            onChange={(e) => { setPhone(e.target.value.replace(/[^0-9+]/g, '')); setPhoneError(''); }}
            placeholder="01XXXXXXXXX"
            className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        {phoneError && <p className="text-[11px] text-red-400 mt-1.5">{phoneError}</p>}

        {/* Payment method buttons */}
        <div className="mt-5 space-y-2.5">
          <button
            type="button"
            onClick={() => onProceed(applied?.valid ? code.trim() : '', 'credit_card', phone.trim())}
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 disabled:opacity-50 rounded-xl font-bold text-sm text-white shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</> : <>Pay ${finalPrice} with ZiniPay <ArrowRight className="w-4 h-4" /></>}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!phone.trim()) { setPhoneError('Phone number is required for PayStation.'); return; }
              onProceed(applied?.valid ? code.trim() : '', 'paystation', phone.trim());
            }}
            disabled={loading}
            className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</> : <>Pay ${finalPrice} via BDT Payment <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
