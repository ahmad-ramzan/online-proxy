/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Server, RefreshCw, Info,
  CheckCircle, ArrowRight, Loader2, Copy, Check, Radio, Globe
} from 'lucide-react';
import { ProxyOrder, CreatedProxy, ResidentialGeoCountry, ResidentialProxyOptions } from '../types';
import { api } from '../services/api';
import { copyToClipboard } from '../utils/clipboard';

interface CreateProxyProps {
  orders: ProxyOrder[];
  onProxyCreated: () => void;
  pinnedCountries?: string; // comma-separated ISO-2 codes to pin at the top
}

export default function CreateProxy({ orders, onProxyCreated, pinnedCountries }: CreateProxyProps) {
  // Filters active orders only
  const activeOrders = orders.filter(o => o.status === 'active');

  const [selectedOrderId, setSelectedOrderId] = useState(activeOrders[0]?.id || '');
  const [protocol, setProtocol] = useState<'http' | 'socks5'>('socks5');
  const [proxyType, setProxyType] = useState<'residential' | 'isp'>('residential');
  const [rotation, setRotation] = useState<number>(10);
  const [ports, setPorts] = useState<number>(1);

  // Proxy-Seller residential GEO tree (country -> region -> city -> ISP)
  const [geo, setGeo] = useState<ResidentialGeoCountry[]>([]);
  const [geoLive, setGeoLive] = useState<boolean | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);

  // Form options (protocols, proxy types, ports, rotation) served by the backend.
  const [options, setOptions] = useState<ResidentialProxyOptions | null>(null);

  const [countryCode, setCountryCode] = useState('');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [isp, setIsp] = useState('');

  const [loading, setLoading] = useState(false);
  const [successProxy, setSuccessProxy] = useState<CreatedProxy | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Real per-order bandwidth from Proxy-Seller, keyed by order id. The local
  // `bandwidthUsedGb` on an order is never updated, so it would always report
  // the full package as remaining — this is the authoritative figure.
  const [usageByOrder, setUsageByOrder] = useState<Record<string, { usedGb: number; limitGb: number }>>({});

  useEffect(() => {
    let active = true;
    api.proxy.getUsage()
      .then((u) => {
        if (!active || !u.live) return;
        const map: Record<string, { usedGb: number; limitGb: number }> = {};
        for (const p of u.perOrder) map[p.orderId] = { usedGb: p.usedGb, limitGb: p.limitGb };
        setUsageByOrder(map);
      })
      .catch(() => { /* keep the local fallback below */ });
    return () => { active = false; };
  }, [orders]);

  /** "0.24 GB" / "241 MB" remaining for an order — real usage when available. */
  const formatGbLeft = (ord: ProxyOrder) => {
    const u = usageByOrder[ord.id];
    const leftGb = u ? Math.max(0, u.limitGb - u.usedGb) : ord.bandwidthGb - ord.bandwidthUsedGb;
    return leftGb < 1 ? `${Math.round(leftGb * 1024)} MB` : `${Math.round(leftGb * 100) / 100} GB`;
  };

  // Load residential locations once
  useEffect(() => {
    let active = true;
    api.proxy.getResidentialGeo()
      .then(({ live, geo, options }) => {
        if (!active) return;
        // Pin the admin-configured countries to the top; the rest stay alphabetical.
        const PRIORITY = (pinnedCountries || 'US,GB,CA')
          .split(',').map(c => c.trim().toUpperCase()).filter(Boolean);
        const sortedGeo = [...geo].sort((a, b) => {
          const ra = PRIORITY.indexOf(a.code) === -1 ? 99 : PRIORITY.indexOf(a.code);
          const rb = PRIORITY.indexOf(b.code) === -1 ? 99 : PRIORITY.indexOf(b.code);
          return ra !== rb ? ra - rb : a.name.localeCompare(b.name);
        });
        setGeo(sortedGeo);
        setGeoLive(live);
        if (options) {
          setOptions(options);
          setProtocol(options.protocols[0]?.value ?? 'socks5');
          setProxyType(options.proxyTypes[0]?.value ?? 'residential');
          setPorts(options.ports.default);
          setRotation(options.rotation.defaultMinutes);
        }
        if (sortedGeo.length) applyCountry(sortedGeo, sortedGeo[0].code);
      })
      .catch(() => { if (active) setError('Could not load residential locations.'); })
      .finally(() => { if (active) setGeoLoading(false); });
    return () => { active = false; };
  }, []);

  // Auto-select the first active plan once orders load (they arrive asynchronously).
  useEffect(() => {
    if (activeOrders.length && !activeOrders.some(o => o.id === selectedOrderId)) {
      setSelectedOrderId(activeOrders[0].id);
    }
  }, [orders]);

  // Cascading select helpers (each picks the first child of the new parent)
  const applyCountry = (tree: ResidentialGeoCountry[], code: string) => {
    const c = tree.find(x => x.code === code);
    const r = c?.regions[0];
    const ct = r?.cities[0];
    setCountryCode(code);
    setRegion(r?.name || '');
    setCity(ct?.name || '');
    setIsp(ct?.isps[0] || '');
  };
  const applyRegion = (name: string) => {
    const c = geo.find(x => x.code === countryCode);
    const r = c?.regions.find(x => x.name === name);
    const ct = r?.cities[0];
    setRegion(name);
    setCity(ct?.name || '');
    setIsp(ct?.isps[0] || '');
  };
  const applyCity = (name: string) => {
    const c = geo.find(x => x.code === countryCode);
    const r = c?.regions.find(x => x.name === region);
    const ct = r?.cities.find(x => x.name === name);
    setCity(name);
    setIsp(ct?.isps[0] || '');
  };

  // Derived option lists for the current selection
  const countryObj = geo.find(c => c.code === countryCode);
  const regionObjs = countryObj?.regions || [];
  const cityObjs = regionObjs.find(r => r.name === region)?.cities || [];
  const ispObjs = cityObjs.find(ct => ct.name === city)?.isps || [];

  // Backend-provided form options (with safe fallbacks until they load)
  const protocolOpts = options?.protocols ?? [{ value: 'socks5' as const, label: 'SOCKS5' }, { value: 'http' as const, label: 'HTTP' }];
  const proxyTypeOpts = options?.proxyTypes ?? [{ value: 'residential' as const, label: 'Residential (Rotating Pool)' }, { value: 'isp' as const, label: 'ISP (Static Residential)' }];
  const portsCfg = options?.ports ?? { min: 1, max: 1000, default: 1 };
  const rotationCfg = options?.rotation ?? { minMinutes: 0, maxMinutes: 60, stepMinutes: 5, presetMinutes: [0, 10, 30], defaultMinutes: 10 };

  const handleCopy = async (text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessProxy(null);

    if (!selectedOrderId) {
      setError('You need an active bandwidth order package to allocate proxies. Purchase or activate one first.');
      return;
    }
    if (!countryCode) {
      setError('Please select a target country.');
      return;
    }

    setLoading(true);
    try {
      const newProxy = await api.proxy.createProxy({
        orderId: selectedOrderId,
        country: countryCode,
        countryName: countryObj?.name,
        region,
        city,
        isp,
        ports,
        type: proxyType,
        protocol,
        rotationMinutes: rotation
      });

      setSuccessProxy(newProxy);
      onProxyCreated();
    } catch (err: any) {
      setError(err.message || 'An error occurred during upstream allocation.');
    } finally {
      setLoading(false);
    }
  };

  const isSimulated = (p: CreatedProxy) => p.id.startsWith('sim_');

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Introduction Card */}
      <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md">
        <div className="absolute pointer-events-none top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-2xl"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-400" />
              Create residential proxies
            </h2>
            <p className="text-xs text-slate-400">
              Allocate geo-targeted residential IPs via the ProxyGpt <span className="font-mono text-slate-300">/resident/list/add</span> endpoint.
            </p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl ${
            geoLive ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'
          }`}>
            <Radio className={`w-3 h-3 ${geoLive ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300">
              {geoLive === null ? 'Connecting…' : geoLive ? 'Proxy Gpt Online' : 'Demo Locations'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Creation Form Block */}
        <form onSubmit={handleDeploy} className="lg:col-span-7 bg-slate-900/40 border border-slate-900 p-8 rounded-3xl backdrop-blur-md space-y-6">

          {/* Order Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Select Active Plan Slot</label>
            {activeOrders.length === 0 ? (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300">
                You do not have any active proxy order packages. Please purchase bandwidth from the Pricing page first.
              </div>
            ) : (
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-850 focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                {activeOrders.map((ord) => (
                  <option key={ord.id} value={ord.id}>
                    {ord.packageName} ({formatGbLeft(ord)} left / #{ord.id.slice(-5)})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* GEO targeting — real cascading dropdowns from /resident/geo */}
          <div className="p-5 bg-slate-950/60 border border-slate-850/80 rounded-2xl space-y-4">
            <h4 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              Geo Targeting
            </h4>

            {geoLoading ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-4">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading locations…
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Country</label>
                  <select
                    value={countryCode}
                    onChange={(e) => applyCountry(geo, e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 rounded-lg px-3 py-2 text-[11px] text-white focus:outline-none cursor-pointer"
                  >
                    {geo.map((c) => (
                      <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Region / State</label>
                  <select
                    value={region}
                    onChange={(e) => applyRegion(e.target.value)}
                    disabled={!regionObjs.length}
                    className="w-full bg-slate-900 border border-slate-850 rounded-lg px-3 py-2 text-[11px] text-white focus:outline-none cursor-pointer disabled:opacity-50"
                  >
                    {regionObjs.map((r) => (
                      <option key={r.name} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">City</label>
                  <select
                    value={city}
                    onChange={(e) => applyCity(e.target.value)}
                    disabled={!cityObjs.length}
                    className="w-full bg-slate-900 border border-slate-850 rounded-lg px-3 py-2 text-[11px] text-white focus:outline-none cursor-pointer disabled:opacity-50"
                  >
                    {cityObjs.map((ct) => (
                      <option key={ct.name} value={ct.name}>{ct.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">ISP</label>
                  <select
                    value={isp}
                    onChange={(e) => setIsp(e.target.value)}
                    disabled={!ispObjs.length}
                    className="w-full bg-slate-900 border border-slate-850 rounded-lg px-3 py-2 text-[11px] text-white focus:outline-none cursor-pointer disabled:opacity-50"
                  >
                    {ispObjs.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Protocol + Type + Ports */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Protocol</label>
              <div className="flex gap-2">
                {protocolOpts.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setProtocol(p.value)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                      protocol === p.value
                        ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                        : 'bg-slate-950/40 border-slate-850 text-slate-300 hover:border-slate-850'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Proxy Type</label>
              <select
                value={proxyType}
                onChange={(e) => setProxyType(e.target.value as any)}
                className="w-full bg-slate-950/80 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
              >
                {proxyTypeOpts.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Ports (IPs)</label>
              <input
                type="number"
                min={portsCfg.min}
                max={portsCfg.max}
                value={ports}
                onChange={(e) => setPorts(Math.max(portsCfg.min, Math.min(portsCfg.max, parseInt(e.target.value) || portsCfg.min)))}
                className="w-full bg-slate-950/80 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Rotation Timer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Automatic IP Rotation</label>
              <span className="text-[10px] font-semibold font-mono text-purple-400">
                {rotation === 0 ? 'Sticky Endpoint (No Rotation)' : `Rotates every ${rotation} mins`}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={rotationCfg.minMinutes}
                max={rotationCfg.maxMinutes}
                step={rotationCfg.stepMinutes}
                value={rotation}
                onChange={(e) => setRotation(parseInt(e.target.value))}
                className="w-full accent-blue-500 h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex gap-1.5 shrink-0">
                {rotationCfg.presetMinutes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setRotation(t)}
                    className="px-2 py-1 bg-slate-950 hover:bg-slate-900 text-[10px] rounded font-semibold text-slate-400 hover:text-white border border-slate-850 cursor-pointer"
                  >
                    {t === 0 ? 'Sticky' : `${t}m`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">{error}</p>
          )}

          {/* Action Trigger */}
          <button
            type="submit"
            disabled={loading || activeOrders.length === 0}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-sm text-white shadow-lg shadow-blue-900/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating list via /resident/list/add…
              </>
            ) : (
              <>
                Create {countryObj?.name || 'residential'} proxy
                <ArrowRight className="w-4 h-4 text-slate-300" />
              </>
            )}
          </button>
        </form>

        {/* Deploy Outcome Display / Info Block */}
        <div className="lg:col-span-5 space-y-6">

          {successProxy ? (
            <div className="bg-slate-900 border border-blue-500/40 p-6 rounded-3xl relative overflow-hidden animate-fade-in shadow-xl shadow-blue-950/40">
              <div className="absolute pointer-events-none top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>

              <div className="flex items-center justify-between gap-3 mb-5 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Proxy Created!</h4>
                    <p className="text-[10px] text-slate-500">Residential list allocated</p>
                  </div>
                </div>
                {!isSimulated(successProxy) ? (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                    Live API
                  </span>
                ) : (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-amber-500/10 border-amber-500/20 text-amber-400">
                    Sandbox Sim
                  </span>
                )}
              </div>

              {/* Host and connection format info */}
              <div className="space-y-4">
                <div>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block mb-1">Connection String (host:port:user:pass)</span>
                  <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-slate-200 truncate select-all">
                      {successProxy.ip}:{successProxy.port}:{successProxy.username}:{successProxy.passwordHash}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(`${successProxy.ip}:${successProxy.port}:${successProxy.username}:${successProxy.passwordHash}`)}
                      className="text-slate-500 hover:text-white cursor-pointer"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl space-y-0.5">
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Proxy Type</span>
                    <span className="font-bold text-white uppercase">{successProxy.type}</span>
                  </div>
                  <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl space-y-0.5">
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Protocol</span>
                    <span className="font-bold text-white uppercase">{successProxy.protocol}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/30 border border-slate-850 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Location:</span>
                    <span className="font-semibold text-white text-right">
                      {successProxy.country}{successProxy.city ? `, ${successProxy.city}` : ''}
                    </span>
                  </div>
                  {successProxy.isp && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">ISP:</span>
                      <span className="font-semibold text-white">{successProxy.isp}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ports / IPs:</span>
                    <span className="font-semibold text-white">{successProxy.ports ?? 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rotation:</span>
                    <span className="font-semibold text-white">{successProxy.rotationMinutes === 0 ? 'Sticky' : `${successProxy.rotationMinutes} mins`}</span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 mt-5 italic text-center">
                Connect at <span className="font-mono text-slate-300">{successProxy.ip}:{successProxy.port}</span> with the login &amp; password above.
              </p>
              <p className="text-[11px] text-yellow-400/95 font-bold mt-2 text-center animate-pulse">
                The proxy will be ready for use within 2 minutes after creation
              </p>
            </div>
          ) : (
            <div className="bg-slate-900/30 border border-slate-900 p-6 rounded-3xl space-y-6 backdrop-blur-md">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                How provisioning works
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your geolocation is assigned to one IP at a time. No shared IP, Premium category.
              </p>

              <div className="border-t border-slate-850 pt-4 space-y-3 text-xs text-slate-400">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded bg-slate-900 flex items-center justify-center text-[10px] font-bold text-blue-400 border border-slate-800">1</div>
                  <span>Pick Country → Region → City → ISP from the live <span className="font-mono">/resident/geo</span> tree.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded bg-slate-900 flex items-center justify-center text-[10px] font-bold text-blue-400 border border-slate-800">2</div>
                  <span>We call <span className="font-mono">/resident/list/add</span> with your geo, ports &amp; rotation.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded bg-slate-900 flex items-center justify-center text-[10px] font-bold text-blue-400 border border-slate-800">3</div>
                  <span>The returned login/password is saved and shown as a connection string.</span>
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl text-[10px] text-slate-500 font-mono space-y-1.5">
                <p className="text-slate-400 font-bold uppercase tracking-wider mb-1">// Gateway</p>
                <p>Host: <span className="text-slate-300">185.162.130.85</span></p>
                <p>Ports: <span className="text-slate-300">10000–10999</span></p>
              </div>
            </div>
          )}

          <div className="p-5 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 border border-indigo-500/20 rounded-2xl space-y-2">
            <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-purple-400" />
              Dynamic Rotation
            </h5>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Sticky keeps one exit IP; a timer rotates it automatically. Rotation is applied on the list at creation time.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
