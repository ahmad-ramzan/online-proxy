/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Receipt, Search, Check, X, RefreshCw } from 'lucide-react';
import { DueLedgerEntry } from '../types';
import { api } from '../services/api';

type Filter = 'all' | 'not-updated' | 'admin' | 'payments';

const money = (n: number | null) => (n === null || n === undefined ? '—' : `$${n.toFixed(2)}`);
const change = (a: number | null, b: number | null) =>
  a === null && b === null ? '—' : a === b ? `${money(a)} (unchanged)` : `${money(a)} → ${money(b)}`;

export default function AdminDueLedger() {
  const [entries, setEntries] = useState<DueLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const load = async (q: string) => {
    setLoading(true);
    try { setEntries(await api.admin.getDueLedger(q, 1000)); }
    catch { alert('Failed to load due ledger'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(''); }, []);
  // Debounced server-side email search.
  useEffect(() => {
    const t = setTimeout(() => load(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const shown = entries.filter((e) => {
    if (filter === 'not-updated') return !e.balanceUpdated;
    if (filter === 'admin') return e.source !== 'gateway-payment';
    if (filter === 'payments') return e.source === 'gateway-payment';
    return true;
  });

  const chip = (id: Filter, label: string) => (
    <button
      key={id}
      onClick={() => setFilter(id)}
      className={`px-3 py-1.5 text-[11px] font-bold rounded-lg cursor-pointer ${filter === id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Receipt className="w-5 h-5 text-blue-400" />
          Due Ledger
        </h3>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white"
            />
          </div>
          <button onClick={() => load(query)} title="Refresh" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 cursor-pointer">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {chip('all', 'All')}
        {chip('not-updated', 'Balance not updated')}
        {chip('admin', 'Admin actions')}
        {chip('payments', 'Payments')}
        <span className="text-[10px] text-slate-500 ml-1">{shown.length} rows</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-widest text-[9px] font-bold">
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-3">Email</th>
              <th className="py-3 px-3">Action</th>
              <th className="py-3 px-3">Amount</th>
              <th className="py-3 px-3">Due</th>
              <th className="py-3 px-3">Main Balance</th>
              <th className="py-3 px-3">Balance updated?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850/60">
            {loading && entries.length === 0 ? (
              <tr><td colSpan={7} className="py-6 text-center text-slate-500">Loading...</td></tr>
            ) : shown.length === 0 ? (
              <tr><td colSpan={7} className="py-6 text-center text-slate-500">No entries{query ? ` for "${query}"` : ''}.</td></tr>
            ) : shown.map((e) => (
              <tr key={e.id} className="hover:bg-slate-900/20 align-top">
                <td className="py-3 px-3 text-[10px] text-slate-400 whitespace-nowrap">{new Date(e.createdAt).toLocaleString()}</td>
                <td className="py-3 px-3 font-mono text-white">{e.userEmail}</td>
                <td className="py-3 px-3">
                  <div className="font-semibold text-slate-200">{e.action}</div>
                  <div className="text-[10px] text-slate-500">
                    {e.source === 'gateway-payment' ? `Payment${e.gateway ? ` · ${e.gateway}` : ''}` : e.source === 'admin-due' ? 'Admin · Due edit' : 'Admin · Balance edit'}
                  </div>
                </td>
                <td className="py-3 px-3 whitespace-nowrap">{money(e.amountUsd)}</td>
                <td className="py-3 px-3 whitespace-nowrap">{change(e.dueBefore, e.dueAfter)}</td>
                <td className="py-3 px-3 whitespace-nowrap">{change(e.mainBefore, e.mainAfter)}</td>
                <td className="py-3 px-3">
                  {e.balanceUpdated ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-green-500/10 text-green-400">
                      <Check className="w-3 h-3" /> Updated
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-red-500/10 text-red-400">
                      <X className="w-3 h-3" /> Not updated{e.status === 'pending' ? ' — payment pending' : e.status === 'failed' ? ' — payment failed' : ''}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-slate-500">
        Rows from before this ledger existed show Due/Balance as "—" (only Pay Due payment attempts could be reconstructed; earlier admin edits weren't recorded in structured form).
      </p>
    </div>
  );
}
