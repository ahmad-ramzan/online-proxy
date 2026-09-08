/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, PackageSearch, ClipboardList } from 'lucide-react';
import { api } from '../services/api';

interface PreOrderSlot {
  id: string;
  countryCode: string;
  carrier: string;
  durationDays: number;
  priceUsd: number;
  totalSlots: number;
  remainingSlots: number;
  status: 'open' | 'closed';
  createdAt: string;
}

export default function AdminPreOrderManagement() {
  const [tab, setTab] = useState<'slots' | 'orders'>('slots');

  const [slots, setSlots] = useState<PreOrderSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ countryCode: '', carrier: '', durationDays: 30, priceUsd: 0, totalSlots: 1 });

  const [orders, setOrders] = useState<any[]>([]);
  const [allProxies, setAllProxies] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedProxy, setSelectedProxy] = useState<Record<string, string>>({});
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const loadSlots = async () => {
    setLoadingSlots(true);
    try { setSlots(await api.admin.getMobilePreOrderSlots()); }
    catch { alert('Failed to load pre-order slots'); }
    finally { setLoadingSlots(false); }
  };

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const data = await api.admin.getMobileOrders();
      setOrders((data.orders || []).filter((o: any) => o.preOrderSlotId));
      setAllProxies(data.allProxies?.length ? data.allProxies : data.availableProxies || []);
    } catch { alert('Failed to load pre-orders'); }
    finally { setLoadingOrders(false); }
  };

  useEffect(() => { loadSlots(); loadOrders(); }, []);

  const resetForm = () => {
    setFormData({ countryCode: '', carrier: '', durationDays: 30, priceUsd: 0, totalSlots: 1 });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!formData.countryCode || !formData.carrier || !formData.priceUsd || !formData.totalSlots) {
      alert('Please fill country, carrier, price and slots');
      return;
    }
    try {
      if (editingId) {
        await api.admin.updateMobilePreOrderSlot(editingId, formData);
      } else {
        await api.admin.createMobilePreOrderSlot(formData);
      }
      resetForm();
      await loadSlots();
    } catch (e: any) {
      alert(e.message || 'Failed to save pre-order slot');
    }
  };

  const handleEdit = (slot: PreOrderSlot) => {
    setEditingId(slot.id);
    setFormData({
      countryCode: slot.countryCode, carrier: slot.carrier, durationDays: slot.durationDays,
      priceUsd: slot.priceUsd, totalSlots: slot.totalSlots
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this pre-order slot? Existing paid pre-orders are not affected.')) return;
    try { await api.admin.deleteMobilePreOrderSlot(id); await loadSlots(); }
    catch (e: any) { alert(e.message || 'Failed to delete slot'); }
  };

  const toggleStatus = async (slot: PreOrderSlot) => {
    try { await api.admin.updateMobilePreOrderSlot(slot.id, { status: slot.status === 'open' ? 'closed' : 'open' }); await loadSlots(); }
    catch (e: any) { alert(e.message || 'Failed to update slot'); }
  };

  const assignProxy = async (order: any) => {
    const proxyId = selectedProxy[order.id];
    if (!proxyId) { alert('Select a proxy first'); return; }
    setAssigningId(order.id);
    try {
      await api.admin.assignMobileProxy(order.id, proxyId);
      await loadOrders();
    } catch (e: any) {
      alert(e.message || 'Failed to assign proxy');
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <PackageSearch className="w-5 h-5 text-blue-400" />
          Mobile Pre-Order Management
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('slots')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${tab === 'slots' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            Slots
          </button>
          <button
            onClick={() => setTab('orders')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 ${tab === 'orders' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            Pending Pre-Orders
            {orders.length > 0 && <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded-full text-[9px]">{orders.length}</span>}
          </button>
        </div>
      </div>

      {tab === 'slots' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => { if (showForm) { resetForm(); } else { setShowForm(true); } }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Slot
            </button>
          </div>

          {showForm && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
              <h4 className="font-bold text-white">{editingId ? 'Edit Pre-Order Slot' : 'Add New Pre-Order Slot'}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text" placeholder="Country Code (e.g., US)"
                  value={formData.countryCode}
                  onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                />
                <input
                  type="text" placeholder="Mobile Carrier / ISP (e.g., T-Mobile)"
                  value={formData.carrier}
                  onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                />
                <input
                  type="number" placeholder="Duration (days)"
                  value={formData.durationDays || ''}
                  onChange={(e) => setFormData({ ...formData, durationDays: parseFloat(e.target.value) || 0 })}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                />
                <input
                  type="number" placeholder="Price (USD)"
                  value={formData.priceUsd || ''}
                  onChange={(e) => setFormData({ ...formData, priceUsd: parseFloat(e.target.value) || 0 })}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                />
                <input
                  type="number" placeholder="Available Slots"
                  value={formData.totalSlots || ''}
                  onChange={(e) => setFormData({ ...formData, totalSlots: parseInt(e.target.value, 10) || 0 })}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSave} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-lg">
                  {editingId ? 'Update' : 'Save'}
                </button>
                <button onClick={resetForm} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-lg">
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-widest text-[9px] font-bold">
                  <th className="py-3 px-4">Country</th>
                  <th className="py-3 px-4">Carrier</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Slots</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60">
                {loadingSlots ? (
                  <tr><td colSpan={7} className="py-6 text-center text-slate-500">Loading...</td></tr>
                ) : slots.length === 0 ? (
                  <tr><td colSpan={7} className="py-6 text-center text-slate-500">No pre-order slots. Add one to get started.</td></tr>
                ) : slots.map((slot) => (
                  <tr key={slot.id} className="hover:bg-slate-900/20">
                    <td className="py-3 px-4">{slot.countryCode}</td>
                    <td className="py-3 px-4 font-mono text-white">{slot.carrier}</td>
                    <td className="py-3 px-4">{slot.durationDays} days</td>
                    <td className="py-3 px-4">${slot.priceUsd.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={slot.remainingSlots === 0 ? 'text-red-400 font-bold' : 'text-white'}>{slot.remainingSlots}</span>
                      <span className="text-slate-500"> / {slot.totalSlots}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase ${slot.status === 'open' ? 'bg-green-500/10 text-green-400' : 'bg-slate-500/10 text-slate-400'}`}>
                        {slot.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button onClick={() => handleEdit(slot)} className="px-2 py-1 text-[10px] font-bold rounded cursor-pointer bg-blue-500/10 hover:bg-blue-500/20 text-blue-400">
                        <Edit2 className="w-3 h-3 inline" /> Edit
                      </button>
                      <button onClick={() => toggleStatus(slot)} className="px-2 py-1 text-[10px] font-bold rounded cursor-pointer bg-slate-700 hover:bg-slate-600 text-slate-300">
                        {slot.status === 'open' ? 'Close' : 'Open'}
                      </button>
                      <button onClick={() => handleDelete(slot.id)} className="px-2 py-1 text-[10px] font-bold rounded cursor-pointer bg-red-500/10 hover:bg-red-500/20 text-red-400">
                        <Trash2 className="w-3 h-3 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className="space-y-3">
          {loadingOrders ? (
            <p className="text-center text-slate-500 text-sm py-8">Loading...</p>
          ) : orders.length === 0 ? (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-sm text-blue-300 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 shrink-0" /> No pre-orders waiting for assignment.
            </div>
          ) : orders.map((order) => {
            const matching = allProxies.filter((p) => p.status === 'available' && p.operator === order.carrier && p.countryCode === order.countryCode);
            return (
              <div key={order.id} className="bg-slate-900/50 border border-slate-850 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-white">{order.userName || order.userEmail}</p>
                  <p className="text-[11px] text-slate-500">{order.carrier} · {order.countryCode} · {order.durationDays} days · ${order.priceUsd.toFixed(2)}</p>
                  <p className="text-[10px] text-amber-400 font-bold mt-1">Waiting for Proxy Assignment</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedProxy[order.id] || ''}
                    onChange={(e) => setSelectedProxy({ ...selectedProxy, [order.id]: e.target.value })}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white min-w-[220px]"
                  >
                    <option value="">
                      {matching.length === 0 ? `No available ${order.carrier} proxies` : `Select a ${order.carrier} proxy...`}
                    </option>
                    {matching.map((p) => (
                      <option key={p.id} value={p.id}>{p.ip}:{p.port} — {p.planName}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => assignProxy(order)}
                    disabled={!selectedProxy[order.id] || assigningId === order.id}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    {assigningId === order.id ? 'Assigning...' : 'Assign Proxy'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
