/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CreditCard, Wallet, ShieldCheck, CheckCircle2, Loader2, ArrowLeft, Code } from 'lucide-react';
import { api } from '../services/api';

interface CheckoutSimulatorProps {
  transactionId: string;
  orderId: string;
  amount: number;
  gateway: 'stripe' | 'crypto' | 'paypal' | 'credit_card';
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

export default function CheckoutSimulator({ transactionId, orderId, amount, gateway, onPaymentSuccess, onCancel }: CheckoutSimulatorProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cryptoAddress, setCryptoAddress] = useState('0x71C7656EC7ab88b098defB751B7401B5f6d8976F');

  const handleSimulatePayment = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.payment.simulateComplete(transactionId);
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onPaymentSuccess();
        }, 1800);
      } else {
        setError(response.message || 'Payment simulation failed.');
      }
    } catch (e: any) {
      setError(e.message || 'Payment simulation endpoint failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative font-sans">
      {/* Decorative Blur */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-2xl bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl relative z-10 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-6 mb-6">
          <button 
            onClick={onCancel}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancel Payment
          </button>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Transaction ID</span>
            <p className="text-xs font-mono text-slate-300">{transactionId}</p>
          </div>
        </div>

        {/* Success Screen */}
        {success ? (
          <div className="py-12 text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-bounce" />
            </div>
            <h2 className="text-2xl font-black text-white">Payment Received!</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Simulated payment of <strong className="text-white">${amount.toFixed(2)}</strong> via {gateway.toUpperCase()} was validated successfully on the server ledger.
            </p>
            <p className="text-xs text-blue-400 animate-pulse">Unlocking order & allocating country proxies... Please wait.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* Payment Details Input Mock */}
            <div className="md:col-span-7 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">ProxyGPT Checkout</h2>
                <p className="text-xs text-slate-400 mt-1">Modular payment integration test portal</p>
              </div>

              {gateway === 'crypto' ? (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-slate-300">Deposit Address (USDT/BTC/ETH)</span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 break-all bg-slate-950 p-2 rounded-lg border border-slate-900 select-all">
                      {cryptoAddress}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-500 italic">
                    The transaction is mapped on the ledger in a 'pending' state. Click below to simulate instant blockchain confirmations on-chain.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-2">Card Details (Simulation)</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={cardNumber} 
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-slate-950/60 border border-slate-850 focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500" 
                      />
                      <CreditCard className="w-4 h-4 text-slate-500 absolute top-3.5 right-4" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-2">Expiry Date</label>
                      <input 
                        type="text" 
                        defaultValue="12/29" 
                        className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-4 py-3 text-xs text-white focus:outline-none" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-2">CVC Code</label>
                      <input 
                        type="text" 
                        defaultValue="•••" 
                        className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-4 py-3 text-xs text-white focus:outline-none" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button
                id="btn-confirm-simulated-payment"
                onClick={handleSimulatePayment}
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    Verifying Transaction Ledger...
                  </>
                ) : (
                  `Pay $${amount.toFixed(2)} USD Now`
                )}
              </button>

              <div className="flex items-center gap-2 text-[10px] text-slate-500 justify-center">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Secured via ProxyGPT modular isolation sandbox</span>
              </div>
            </div>

            {/* Modular explanation block for developer future integration */}
            <div className="md:col-span-5 bg-slate-950/40 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <Code className="w-4 h-4 text-blue-400" />
                  <span>Developer Integration</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  To swap this simulation with your live payment API:
                </p>
                <ol className="text-[10px] text-slate-500 list-decimal pl-4 space-y-2">
                  <li>Edit <code className="text-slate-300">/server/paymentService.ts</code>.</li>
                  <li>Import <code className="text-slate-300">stripe</code> or your own SDK client.</li>
                  <li>In <code className="text-slate-300">createCheckoutSession</code>, generate a real session.</li>
                  <li>Feed webhooks to <code className="text-slate-300">completePaymentTransaction()</code>.</li>
                </ol>
              </div>

              <div className="border-t border-slate-900 pt-4 mt-4 text-[10px] text-slate-500 space-y-1">
                <p><strong>Order Mapping:</strong> {orderId}</p>
                <p><strong>Gateway Module:</strong> {gateway}</p>
                <p><strong>Environment:</strong> Local VPS Sandbox</p>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
