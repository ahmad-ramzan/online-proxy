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
  showZinipay?: boolean;
  walletBalance?: number;
  subtitle?: string;
  allowCoupon?: boolean;
  onWalletPay?: (couponCode: string) => void;
  onClose: () => void;
  onProceed: (couponCode: string, gateway: 'credit_card' | 'paystation' | 'cryptomus', phone: string) => void;
}

export default function CheckoutModal({ pkg, loading, showZinipay = false, walletBalance = 0, subtitle, allowCoupon = true, onWalletPay, onClose, onProceed }: CheckoutModalProps) {
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
  const displayPrice = Number.isInteger(finalPrice) ? finalPrice.toString() : finalPrice.toFixed(2);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-3 sm:p-6 animate-fade-in">
      <div className="bg-[#111a2f] border border-slate-800/80 rounded-[2rem] p-6 sm:p-9 max-w-[868px] w-full max-h-[calc(100vh-24px)] overflow-y-auto relative shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-8 mb-10">
          <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider">Checkout</h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white cursor-pointer w-12 h-12 flex items-center justify-center bg-slate-950/70 hover:bg-slate-900 rounded-full transition-colors"
            aria-label="Close checkout"
          >
            <X className="w-8 h-8" />
          </button>
        </div>

        {/* Package summary */}
        <div className="p-7 sm:p-8 bg-slate-950/60 border-2 border-white/90 rounded-[1.875rem] mb-9">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="min-w-0">
              <p className="text-2xl sm:text-3xl font-black text-white leading-tight">{pkg.name}</p>
              <p className="text-xl sm:text-2xl text-slate-400 mt-2 leading-snug">
                {subtitle || `${pkg.bandwidthGb} GB residential bandwidth · 30 days`}
              </p>
            </div>
            <div className="text-left sm:text-right shrink-0">
              {hasDiscount && (
                <p className="text-base text-slate-500 line-through">${pkg.priceUsd}</p>
              )}
              <p className="text-5xl sm:text-6xl font-black text-white tracking-tight">${displayPrice}</p>
            </div>
          </div>
        </div>

        {/* Coupon */}
        {allowCoupon && (<>
        <label className="text-xl font-black text-slate-400 uppercase tracking-[0.22em] block mb-4">Coupon code</label>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Tag className="w-8 h-8 text-slate-500 absolute left-6 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setApplied(null); }}
              placeholder="Enter code"
              className="w-full h-[76px] bg-slate-950/80 border-2 border-white/90 rounded-[1.375rem] pl-[72px] pr-5 text-2xl font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400 uppercase"
            />
          </div>
          <button
            type="button"
            onClick={applyCoupon}
            disabled={checking || !code.trim()}
            className="h-[76px] px-8 bg-slate-800/80 hover:bg-slate-700 disabled:hover:bg-slate-800/80 disabled:opacity-60 text-2xl font-black text-slate-300 rounded-[1.375rem] cursor-pointer transition-colors flex items-center justify-center sm:min-w-[134px]"
          >
            {checking ? <Loader2 className="w-7 h-7 animate-spin" /> : 'Apply'}
          </button>
        </div>

        {applied && (
          <p className={`text-sm mt-3 flex items-center gap-1.5 font-semibold ${applied.valid ? 'text-emerald-400' : 'text-red-400'}`}>
            {applied.valid && <Check className="w-4 h-4" />}
            {applied.message}
          </p>
        )}
        </>)}

        {/* Phone (required for PayStation) */}
        <label className="text-xl font-black text-slate-400 uppercase tracking-[0.22em] block mb-4 mt-8">Phone number</label>
        <div className="relative">
          <Phone className="w-8 h-8 text-slate-500 absolute left-6 top-1/2 -translate-y-1/2" />
          <input
            type="tel"
            value={phone}
            onChange={(e) => { setPhone(e.target.value.replace(/[^0-9+]/g, '')); setPhoneError(''); }}
            placeholder="01XXXXXXXXX"
            className="w-full h-[76px] bg-slate-950/80 border-2 border-white/90 rounded-[1.375rem] pl-[72px] pr-5 text-2xl font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400"
          />
        </div>
        {phoneError && <p className="text-sm text-red-400 mt-3 font-semibold">{phoneError}</p>}

        {/* Payment method buttons */}
        <div className="mt-10 space-y-5">
          {onWalletPay && walletBalance >= finalPrice && (
            <button
              type="button"
              onClick={() => onWalletPay(applied?.valid ? code.trim() : '')}
              disabled={loading}
              className="w-full h-24 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:brightness-110 disabled:opacity-50 rounded-[1.375rem] font-black text-lg sm:text-3xl text-white shadow-lg shadow-fuchsia-900/40 flex items-center justify-center gap-4 cursor-pointer transition-all"
            >
              {loading ? <><Loader2 className="w-7 h-7 animate-spin" /> Processing…</> : <>Pay ${displayPrice} from Wallet <ArrowRight className="w-8 h-8" /></>}
            </button>
          )}
          {showZinipay && (
          <button
            type="button"
            onClick={() => onProceed(applied?.valid ? code.trim() : '', 'credit_card', phone.trim())}
            disabled={loading}
            className="w-full h-24 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 disabled:opacity-50 rounded-[1.375rem] font-black text-lg sm:text-3xl text-white shadow-lg shadow-blue-900/40 flex items-center justify-center gap-4 cursor-pointer transition-all"
          >
            {loading ? <><Loader2 className="w-7 h-7 animate-spin" /> Redirecting…</> : <>Pay ${displayPrice} with ZiniPay <ArrowRight className="w-8 h-8" /></>}
          </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (!phone.trim()) { setPhoneError('Phone number is required for BDT Payment.'); return; }
              onProceed(applied?.valid ? code.trim() : '', 'paystation', phone.trim());
            }}
            disabled={loading}
            className="w-full h-24 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 disabled:opacity-50 rounded-[1.375rem] font-black text-lg sm:text-3xl text-white shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-4 cursor-pointer transition-all"
          >
            {loading ? <><Loader2 className="w-7 h-7 animate-spin" /> Redirecting…</> : <>Pay ${displayPrice} via BDT Payment <ArrowRight className="w-8 h-8" /></>}
          </button>
          <button
            type="button"
            onClick={() => onProceed(applied?.valid ? code.trim() : '', 'cryptomus', phone.trim())}
            disabled={loading}
            className="w-full h-24 bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 disabled:opacity-50 rounded-[1.375rem] font-black text-lg sm:text-3xl text-white shadow-lg shadow-orange-900/40 flex items-center justify-center gap-4 cursor-pointer transition-all"
          >
            {loading ? <><Loader2 className="w-7 h-7 animate-spin" /> Redirecting…</> : <>Pay ${displayPrice} with Crypto <ArrowRight className="w-8 h-8" /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
