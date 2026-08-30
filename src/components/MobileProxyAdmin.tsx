/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check, Loader2, ChevronDown } from 'lucide-react';
import { MobileProxy, MobileProxyOrder } from '../types';
import { api } from '../services/api';

interface MobileProxyAdminProps {
  onClose?: () => void;
}

export default function MobileProxyAdmin({ onClose }: MobileProxyAdminProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory'>('orders');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Orders state
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [availableProxies, setAvailableProxies] = useState<MobileProxy[]>([]);
  const [selectedProxyForOrder, setSelectedProxyForOrder] = useState<Record<string, string>>({});

  // Inventory form state
  const [newProxyForm, setNewProxyForm] = useState({
    ip: '',
    port: '',
    username: '',
    password: '',
    planName: '',
    countryCode: '',
    priceUsd: 0
  });

  // All proxies for inventory view
  const [allProxies, setAllProxies] = useState<MobileProxy[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const ordersRes = await api.admin.getMobileOrders();
      setPendingOrders(ordersRes.orders || []);
      setAvailableProxies(ordersRes.availableProxies || []);
      setAllProxies((ordersRes.allProxies || []).concat(ordersRes.availableProxies || []));
    } catch (e) {
      console.error('Failed to load mobile proxy data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const assignProxy = async (orderId: string) => {
    const proxyId = selectedProxyForOrder[orderId];
    if (!proxyId) return;

    setActionLoading(true);
    try {
      await api.admin.assignMobileProxy(orderId, proxyId);
      setSuccessMessage('Proxy assigned successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      loadData();
      setSelectedProxyForOrder({ ...selectedProxyForOrder, [orderId]: '' });
    } catch (e: any) {
      alert('Failed to assign proxy: ' + (e.message || 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

  const addProxy = async () => {
    if (!newProxyForm.ip || !newProxyForm.port || !newProxyForm.username || !newProxyForm.password) {
      alert('Please fill all fields');
      return;
    }

    setActionLoading(true);
    try {
      await api.admin.addMobileProxy(newProxyForm);
      setSuccessMessage('Proxy added to inventory!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setNewProxyForm({ ip: '', port: '', username: '', password: '', planName: '', countryCode: '', priceUsd: 0 });
      loadData();
    } catch (e: any) {
      alert('Failed to add proxy: ' + (e.message || 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

  const deleteProxy = async (proxyId: string) => {
    if (!confirm('Delete this proxy?')) return;

    setActionLoading(true);
    try {
      await api.admin.deleteMobileProxy(proxyId);
      setSuccessMessage('Proxy deleted!');
      setTimeout(() => setSuccessMessage(''), 3000);
      loadData();
    } catch (e: any) {
      alert('Failed to delete proxy: ' + (e.message || 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-2xl flex items-center gap-2">
          <Check className="w-4 h-4" />
          {successMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800">
        {[
          { id: 'orders' as const, label: 'Pending Orders' },
          { id: 'inventory' as const, label: 'Proxy Inventory' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* PENDING ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <h3 className="text-base font-black text-white">
            Pending Mobile Proxy Orders ({pendingOrders.length})
          </h3>

          {pendingOrders.length === 0 ? (
            <div className="p-6 bg-slate-900/30 border border-slate-800 rounded-xl text-slate-400 text-sm text-center">
              No pending orders
            </div>
          ) : (
            <div className="space-y-3">
              {pendingOrders.map(order => (
                <div key={order.id} className="p-4 bg-slate-900/30 border border-slate-800 rounded-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                    <div>
                      <p className="font-bold text-white text-sm">{order.userName || 'Unknown'}</p>
                      <p className="text-xs text-slate-400">{order.userEmail}</p>
                      <p className="text-xs text-slate-500 mt-1">Plan: {order.planName} • ${order.priceUsd} • Ordered: {new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:w-64">
                      <select
                        value={selectedProxyForOrder[order.id] || ''}
                        onChange={(e) => setSelectedProxyForOrder({ ...selectedProxyForOrder, [order.id]: e.target.value })}
                        className="h-10 bg-slate-950/80 border border-slate-700 rounded-lg text-sm text-white px-3 focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Select proxy to assign...</option>
                        {availableProxies.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.ip}:{p.port} ({p.planName})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => assignProxy(order.id)}
                        disabled={!selectedProxyForOrder[order.id] || actionLoading}
                        className="h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
                      >
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Assign'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* INVENTORY TAB */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Add Proxy Form */}
          <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-xl space-y-3">
            <h4 className="font-bold text-white text-sm">Add Proxy to Inventory</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="IP Address"
                value={newProxyForm.ip}
                onChange={(e) => setNewProxyForm({ ...newProxyForm, ip: e.target.value })}
                className="h-9 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white px-3 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Port"
                value={newProxyForm.port}
                onChange={(e) => setNewProxyForm({ ...newProxyForm, port: e.target.value })}
                className="h-9 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white px-3 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Username"
                value={newProxyForm.username}
                onChange={(e) => setNewProxyForm({ ...newProxyForm, username: e.target.value })}
                className="h-9 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white px-3 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
              <input
                type="password"
                placeholder="Password"
                value={newProxyForm.password}
                onChange={(e) => setNewProxyForm({ ...newProxyForm, password: e.target.value })}
                className="h-9 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white px-3 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Plan Name (e.g. Canada 5G)"
                value={newProxyForm.planName}
                onChange={(e) => setNewProxyForm({ ...newProxyForm, planName: e.target.value })}
                className="h-9 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white px-3 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Country Code (e.g. CA)"
                value={newProxyForm.countryCode}
                onChange={(e) => setNewProxyForm({ ...newProxyForm, countryCode: e.target.value.toUpperCase() })}
                className="h-9 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white px-3 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
              <input
                type="number"
                placeholder="Price USD"
                value={newProxyForm.priceUsd || ''}
                onChange={(e) => setNewProxyForm({ ...newProxyForm, priceUsd: parseFloat(e.target.value) || 0 })}
                className="h-9 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white px-3 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={addProxy}
              disabled={actionLoading}
              className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add to Inventory
            </button>
          </div>

          {/* Proxy List */}
          <div className="space-y-4">
            <h4 className="font-bold text-white text-sm">All Proxies ({allProxies.length})</h4>
            {allProxies.length === 0 ? (
              <div className="p-6 bg-slate-900/30 border border-slate-800 rounded-xl text-slate-400 text-sm text-center">
                No proxies in inventory
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allProxies.map(proxy => (
                  <div key={proxy.id} className="p-3 bg-slate-900/40 border border-slate-800 rounded-lg flex items-center justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-mono text-white">{proxy.ip}:{proxy.port}</p>
                      <p className="text-xs text-slate-400">{proxy.planName} • {proxy.countryCode} • ${proxy.priceUsd}</p>
                      <p className={`text-xs mt-1 ${
                        proxy.status === 'available'
                          ? 'text-emerald-400 font-bold'
                          : proxy.status === 'active'
                          ? 'text-blue-400'
                          : 'text-slate-500'
                      }`}>
                        Status: {proxy.status.toUpperCase()} {proxy.userId && proxy.status === 'active' && `(User: ${proxy.userId})`}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteProxy(proxy.id)}
                      disabled={actionLoading}
                      className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete proxy"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
