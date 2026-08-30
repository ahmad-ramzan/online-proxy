/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, Server, Flag } from 'lucide-react';
import { MobileProxy } from '../types';
import { api } from '../services/api';

export default function AdminMobileProxyList() {
  const [proxies, setProxies] = useState<MobileProxy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    ip: '',
    port: '',
    username: '',
    password: '',
    planName: '',
    countryCode: '',
    priceUsd: 0
  });
  const [quickPaste, setQuickPaste] = useState('');
  const [quickPasteError, setQuickPasteError] = useState('');

  // Parse "username:password@ip:port" into the individual fields.
  const handleQuickPaste = (value: string) => {
    setQuickPaste(value);
    const trimmed = value.trim();
    if (!trimmed) { setQuickPasteError(''); return; }
    const match = trimmed.match(/^([^:@]+):([^:@]+)@([^:@]+):(\d+)$/);
    if (!match) {
      setQuickPasteError('Expected format: username:password@ip:port');
      return;
    }
    const [, username, password, ip, port] = match;
    setFormData(f => ({ ...f, username, password, ip, port }));
    setQuickPasteError('');
  };

  // Load proxies
  useEffect(() => {
    loadProxies();
  }, []);

  const loadProxies = async () => {
    setLoading(true);
    try {
      const result = await api.admin.getMobileProxies();
      setProxies(result);
    } catch (e: any) {
      alert('Failed to load proxies');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ ip: '', port: '', username: '', password: '', planName: '', countryCode: '', priceUsd: 0 });
    setQuickPaste('');
    setQuickPasteError('');
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!formData.ip || !formData.port || !formData.username || !formData.password) {
      alert('Please fill all fields');
      return;
    }

    try {
      if (editingId) {
        await api.admin.updateMobileProxy(editingId, {
          ip: formData.ip,
          port: formData.port,
          username: formData.username,
          password: formData.password,
          planName: formData.planName || 'Standard',
          countryCode: formData.countryCode || 'US',
          priceUsd: parseFloat(formData.priceUsd.toString()) || 5
        });
        resetForm();
        await loadProxies();
        alert('Proxy updated successfully');
      } else {
        await api.admin.addMobileProxy({
          ip: formData.ip,
          port: formData.port,
          username: formData.username,
          password: formData.password,
          planName: formData.planName || 'Standard',
          countryCode: formData.countryCode || 'US',
          priceUsd: parseFloat(formData.priceUsd.toString()) || 5
        });
        resetForm();
        await loadProxies();
        alert('Proxy added successfully');
      }
    } catch (e: any) {
      alert(e.message || 'Failed to save proxy');
    }
  };

  const handleEdit = (proxy: MobileProxy) => {
    setEditingId(proxy.id);
    setFormData({
      ip: proxy.ip,
      port: proxy.port,
      username: proxy.username,
      password: proxy.password,
      planName: proxy.planName,
      countryCode: proxy.countryCode,
      priceUsd: proxy.priceUsd
    });
    setQuickPaste('');
    setQuickPasteError('');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this proxy?')) return;

    try {
      await api.admin.deleteMobileProxy(id);
      await loadProxies();
    } catch (e: any) {
      alert(e.message || 'Failed to delete proxy');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'available' ? 'inactive' : 'available';
    try {
      await api.admin.updateMobileProxyStatus(id, newStatus);
      await loadProxies();
    } catch (e: any) {
      alert(e.message || 'Failed to update proxy');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading proxies...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Server className="w-5 h-5 text-blue-400" />
          Mobile Proxy Pool
        </h3>
        <button
          onClick={() => { if (showForm) { resetForm(); } else { setShowForm(true); } }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Proxy
        </button>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
          <h4 className="font-bold text-white">{editingId ? 'Edit Mobile Proxy' : 'Add New Mobile Proxy'}</h4>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Quick paste (username:password@ip:port)</label>
            <input
              type="text"
              placeholder="dF9Powb7U0:Ae8FfVdKZD@143.110.160.236:10808"
              value={quickPaste}
              onChange={(e) => handleQuickPaste(e.target.value)}
              className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-sm text-white font-mono ${quickPasteError ? 'border-red-500' : 'border-slate-700'}`}
            />
            {quickPasteError && <p className="text-[10px] text-red-400">{quickPasteError}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="IP Address (e.g., 192.168.1.1)"
              value={formData.ip}
              onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            />
            <input
              type="text"
              placeholder="Port (e.g., 9999)"
              value={formData.port}
              onChange={(e) => setFormData({ ...formData, port: e.target.value })}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            />
            <input
              type="text"
              placeholder="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            />
            <input
              type="text"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            />
            <input
              type="text"
              placeholder="Plan Name (e.g., 5G Unlimited)"
              value={formData.planName}
              onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            />
            <input
              type="text"
              placeholder="Country Code (e.g., US)"
              value={formData.countryCode}
              onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            />
            <input
              type="number"
              placeholder="Price (USD)"
              value={formData.priceUsd}
              onChange={(e) => setFormData({ ...formData, priceUsd: parseFloat(e.target.value) })}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-lg"
            >
              {editingId ? 'Update' : 'Save'}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Proxies List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-widest text-[9px] font-bold">
              <th className="py-3 px-4">IP</th>
              <th className="py-3 px-4">Port</th>
              <th className="py-3 px-4">Username</th>
              <th className="py-3 px-4">Plan</th>
              <th className="py-3 px-4">Country</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850/60">
            {proxies.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-slate-500">
                  No proxies. Add one to get started.
                </td>
              </tr>
            ) : (
              proxies.map((proxy) => (
                <tr key={proxy.id} className="hover:bg-slate-900/20">
                  <td className="py-3 px-4 font-mono text-white">{proxy.ip}</td>
                  <td className="py-3 px-4">{proxy.port}</td>
                  <td className="py-3 px-4">{proxy.username}</td>
                  <td className="py-3 px-4">{proxy.planName}</td>
                  <td className="py-3 px-4 flex items-center gap-1">
                    <span>{proxy.countryCode}</span>
                  </td>
                  <td className="py-3 px-4">${proxy.priceUsd.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase ${
                      proxy.status === 'available' ? 'bg-green-500/10 text-green-400' :
                      proxy.status === 'assigned' ? 'bg-blue-500/10 text-blue-400' :
                      'bg-slate-500/10 text-slate-400'
                    }`}>
                      {proxy.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(proxy)}
                      className="px-2 py-1 text-[10px] font-bold rounded cursor-pointer bg-blue-500/10 hover:bg-blue-500/20 text-blue-400"
                    >
                      <Edit2 className="w-3 h-3 inline" /> Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(proxy.id, proxy.status)}
                      className="px-2 py-1 text-[10px] font-bold rounded cursor-pointer bg-slate-700 hover:bg-slate-600 text-slate-300"
                      disabled={proxy.status === 'assigned'}
                    >
                      {proxy.status === 'available' ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(proxy.id)}
                      className="px-2 py-1 text-[10px] font-bold rounded cursor-pointer bg-red-500/10 hover:bg-red-500/20 text-red-400"
                    >
                      <Trash2 className="w-3 h-3 inline" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-300">
        <p className="font-bold">📝 How it works:</p>
        <p className="mt-1">1. Add proxies manually to your pool</p>
        <p>2. When customer buys, they're assigned one from the available pool</p>
        <p>3. Mark as disabled to temporarily remove from rotation</p>
      </div>
    </div>
  );
}
