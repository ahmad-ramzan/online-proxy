/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Shield, Zap, Globe, Cpu, Check, ArrowRight, Server,
  Layers, Users, Lock, ChevronDown, CheckCircle, Star,
  RefreshCw, Radio, Gauge, Calendar
} from 'lucide-react';
import { ProxyPackage, ResidentialInfo } from '../types';
import { api } from '../services/api';

interface LandingPageProps {
  packages: ProxyPackage[];
  onNavigate: (page: string) => void;
  onBuyPackage: (pkg: ProxyPackage) => void;
  isAuthenticated: boolean;
}

const demoNodes = [
  {
    country: 'UK',
    flag: '🇬🇧',
    location: 'UK, USA and Canada',
    host: '45.138.22.107',
    latency: '24 ms',
    label: 'UK Node',
    count: '468M',
    colorClass: 'border-indigo-500/40 text-indigo-400'
  },
  {
    country: 'USA',
    flag: '🇺🇸',
    location: 'UK, USA and Canada',
    host: '85.162.130.85',
    latency: '38 ms',
    label: 'US Node',
    count: '125M',
    colorClass: 'border-blue-500/40 text-blue-400'
  },
  {
    country: 'CA',
    flag: '🇨🇦',
    location: 'UK, USA and Canada',
    host: '198.51.100.42',
    latency: '41 ms',
    label: 'CA Node',
    count: '42M',
    colorClass: 'border-purple-500/40 text-purple-400'
  }
];

export default function LandingPage({ packages, onNavigate, onBuyPackage, isAuthenticated }: LandingPageProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeNodeIdx, setActiveNodeIdx] = useState(0);

  // Live residential-package snapshot backing every pricing card.
  // Pulled from Proxy-Seller /resident/package + /resident/consumption.
  const [residential, setResidential] = useState<ResidentialInfo | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNodeIdx((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let active = true;
    api.settings
      .getResidentialInfo()
      .then((info) => { if (active) setResidential(info); })
      .catch(() => { /* card falls back to static package pricing */ });
    return () => { active = false; };
  }, []);

  const formatGb = (bytes: number | null | undefined): string | null => {
    if (bytes === null || bytes === undefined) return null;
    return `${(bytes / 1e9).toFixed(1)} GB`; // decimal GB (1 GB = 1000 MB)
  };

  // Card price is the fixed package price set by the admin.
  const cardPrice = (pkg: ProxyPackage): number => pkg.priceUsd;

  const rotationLabel = residential?.rotationSeconds != null
    ? (residential.rotationSeconds <= 0 ? 'Sticky endpoint' : `Rotates every ${residential.rotationSeconds}s`)
    : null;
  const trafficLeftLabel = formatGb(residential?.trafficLeftBytes);
  const isOutOfStock = residential && residential.live && residential.trafficLeftBytes !== null && residential.trafficLeftBytes <= 1024 * 1024;

  const stats = [
    { label: 'Global Proxies Online', value: '45,820+', desc: 'Across 3 continents' },
    { label: 'Average Response Speed', value: '< 45ms', desc: 'SLA backed routing' },
    { label: 'IP Network Purity', value: '99.8%', desc: 'No fraud or spam blocks' },
    { label: 'Uptime Reliability', value: '99.99%', desc: 'Failover high-availability' },
  ];

  const features = [
    {
      icon: <Globe className="w-6 h-6 text-blue-400" />,
      title: 'Global Geos Selection',
      desc: 'Deploy rotating residential and mobile nodes across Canada, USA, and UK instantly.'
    },
    {
      icon: <Zap className="w-6 h-6 text-purple-400" />,
      title: 'Incredibly Fast Throughput',
      desc: 'Equipped with dedicated 1Gbps ports and unlimited concurrent connections. Zero bandwidth throttling.'
    },
    {
      icon: <Shield className="w-6 h-6 text-indigo-400" />,
      title: 'Sophisticated IP Rotator',
      desc: 'Set custom rotation timers or trigger a fresh dynamic IP on-demand with HTTP/S & SOCKS5 support.'
    },
    {
      icon: <Cpu className="w-6 h-6 text-pink-400" />,
      title: 'Highly Modular API Layers',
      desc: 'Ready for full integration. Swap proxy providers or payment gateways cleanly without altering the code.'
    },
    {
      icon: <Lock className="w-6 h-6 text-emerald-400" />,
      title: 'Strict Privacy & Zero Logs',
      desc: 'Encrypted tunnel headers. Complete protection from traffic leaking or IP leak fingerprinting.'
    },
    {
      icon: <Layers className="w-6 h-6 text-amber-400" />,
      title: 'Dual-Stack IPv4 / IPv6',
      desc: 'Fully compatible with modern legacy systems and bleeding-edge web platforms.'
    }
  ];

  const testimonials = [
    {
      name: 'Marcus Vance',
      role: 'DevOps Lead, ScrapeLabs',
      text: 'ProxyGPT completely changed our pipeline. We rotate 500+ endpoints simultaneously for data intelligence without a single ban. The interface is stunning.',
      stars: 5
    },
    {
      name: 'Elena Rostova',
      role: 'Growth Hacker',
      text: 'The absolute best proxy provider on the market. Instant generation, extremely low latency, and superb developer-friendly modules.',
      stars: 5
    }
  ];

  const faqs = [
    {
      q: 'What makes ProxyGPT proxies different?',
      a: 'We provide hand-selected, highly pristine IP pools. Unlike other services that resell dirty public addresses or shared data, our Canada, USA, and UK nodes are completely premium rotating residential proxies with private pool allocation, maintaining maximum trust scores.'
    },
    {
      q: 'How does the modular API Integration Layer work?',
      a: 'ProxyGPT is designed with Clean Architecture. All proxy allocations and deletions are decoupled inside a dedicated API service. You can swap the upstream network to any provider in minutes!'
    },
    {
      q: 'Can I rotate my proxy IPs automatically?',
      a: 'Yes! When creating a proxy, you can select custom rotation intervals (e.g., 5, 15, or 30 minutes) or trigger an immediate renewal dynamically through the dashboard.'
    },
    {
      q: 'Which payment options are supported?',
      a: 'Initially, we support Stripe (Credit Cards), PayPal, and Crypto (USDT, BTC, ETH) with a modular backend ready to connect any other payment gateway.'
    }
  ];

  return (
    <div id="landing-container" className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden relative font-sans selection:bg-blue-500 selection:text-white">
      {/* Background glowing decorations to match the Sophisticated Dark design */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] left-[-10%] w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none"></div>
      <div className="absolute top-[40%] right-[10%] w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header / Navbar */}
      <nav id="navbar" className="border-b border-slate-900 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('home')}>
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-blue-500/20">
              <img src="/logo.jpeg" alt="ProxyGPT" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-black tracking-tight text-white bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              ProxyGPT <span className="text-xs font-semibold px-2 py-0.5 bg-blue-500/15 text-blue-400 rounded-md border border-blue-500/30 ml-1">ONLINE</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features-section" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing-section" className="hover:text-white transition-colors">Pricing Plans</a>
            <a href="#why-choose-us" className="hover:text-white transition-colors">Why ProxyGPT</a>
            <a href="#faq-section" className="hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <button
                id="btn-goto-dashboard"
                onClick={() => onNavigate('dashboard')}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl font-bold text-sm text-white flex items-center gap-2 hover:border-slate-700 transition-all cursor-pointer"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 text-blue-400" />
              </button>
            ) : (
              <>
                <button
                  id="btn-login-nav"
                  onClick={() => onNavigate('login')}
                  className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Log In
                </button>
                <button
                  id="btn-signup-nav"
                  onClick={() => onNavigate('signup')}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl font-bold text-sm text-white shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-full">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-ping"></span>
              <span className="text-xs font-semibold tracking-wider text-blue-400 uppercase">Version 2.4 Live • Instant Provisioning</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-none">
              Deploy Ultra-Pure <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Residential & Mobile Proxies
              </span> <br />
              With One Click.
            </h1>

            <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
              Unlock clean, blazing fast residential and mobile (5G/LTE) IP addresses across the UK, USA, and Canada.
              Built on our decoupled high-availability API network layer. Zero throttling, maximum privacy.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                id="btn-hero-explore"
                onClick={() => {
                  const section = document.getElementById('pricing-section');
                  section?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-90 rounded-xl font-extrabold text-white text-base shadow-xl shadow-blue-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                View Plans & Bandwidth
                <ArrowRight className="w-5 h-5 text-slate-200" />
              </button>
            </div>

            <div className="flex items-center flex-wrap gap-x-6 gap-y-4 pt-4 border-t border-slate-900">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-950 bg-slate-800 overflow-hidden flex items-center justify-center text-xs font-bold text-slate-300">
                    {['S', 'K', 'T', 'W'][i - 1]}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Loved by 1,400+ developers</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-xs text-slate-500 ml-2">4.9/5 Rating</span>
                </div>
              </div>

              {/* Trustpilot rating badge */}
              <a
                href="https://www.trustpilot.com/review/proxygpt.online"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <span className="text-sm font-bold text-white">Great</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4].map((i) => (
                    <span key={i} className="w-5 h-5 bg-[#00b67a] flex items-center justify-center">
                      <Star className="w-3.5 h-3.5 fill-white text-white" />
                    </span>
                  ))}
                  {/* 5th star ~30% filled for a 4.3 score */}
                  <span className="w-5 h-5 relative bg-[#dcdce6] flex items-center justify-center overflow-hidden">
                    <span className="absolute left-0 top-0 h-full bg-[#00b67a]" style={{ width: '30%' }}></span>
                    <Star className="w-3.5 h-3.5 fill-white text-white relative" />
                  </span>
                </div>
                <span className="text-sm text-slate-400">on</span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-[#00b67a] text-[#00b67a]" />
                  <span className="text-sm font-bold text-white">Trustpilot</span>
                </span>
              </a>
            </div>
          </div>

          {/* Premium 3D Glass Illustration */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-[420px] aspect-square rounded-3xl bg-slate-900/30 border border-slate-800/80 p-8 overflow-hidden backdrop-blur-md flex flex-col justify-between shadow-2xl shadow-blue-900/20 group">
              <div className="absolute pointer-events-none top-0 right-0 w-36 h-36 bg-blue-500/10 rounded-full blur-3xl"></div>
              <div className="absolute pointer-events-none bottom-0 left-0 w-36 h-36 bg-purple-500/10 rounded-full blur-3xl"></div>

              <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                  <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                </div>
                <span className="text-xs font-mono text-slate-500">proxygpt-terminal_v2.sh</span>
              </div>

              {/* Holographic Interactive Style Proxy Display */}
              <div className="my-6 space-y-4 font-mono text-xs text-slate-300 flex-1 flex flex-col justify-center">
                <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl space-y-2 relative overflow-hidden">
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-green-500/15 text-green-400 text-[9px] rounded font-bold uppercase tracking-widest border border-green-500/20 animate-pulse">
                    Online
                  </div>
                  <p className="text-slate-500">// Upstream Proxy Connected</p>
                  <p className="text-blue-400 font-semibold">Host: <span className="text-white">{demoNodes[activeNodeIdx].host}</span></p>
                  <p className="text-purple-400">Location: <span className="text-white">UK, USA and Canada</span></p>
                  <p className="text-indigo-400">Protocol: <span className="text-white">SOCKS5</span></p>
                  <p className="text-slate-500">Latency: <span className="text-green-400">{demoNodes[activeNodeIdx].latency}</span></p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {demoNodes.map((node, idx) => {
                    const isActive = idx === activeNodeIdx;
                    return (
                      <div
                        key={node.country}
                        className={`bg-slate-900/60 border p-2.5 rounded-xl text-center transition-all duration-300 ${isActive
                          ? node.colorClass + ' bg-slate-900/90 scale-[1.03] shadow-md shadow-blue-500/5'
                          : 'border-slate-850 hover:border-slate-800'
                          }`}
                      >
                        <p className={`text-[10px] uppercase tracking-widest font-sans font-bold transition-colors ${isActive ? (idx === 0 ? 'text-indigo-400' : idx === 1 ? 'text-blue-400' : 'text-purple-400') : 'text-slate-500'
                          }`}>
                          {node.label}
                        </p>
                        <p className="text-sm font-bold text-white mt-1">{node.count} IPs</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 p-3 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Server className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">99.99% Node Health</p>
                  <p className="text-[10px] text-slate-400">Continuous background failover check active</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proxy Statistics Counter */}
      <section id="statistics-counter" className="border-y border-slate-900 bg-slate-900/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center p-4 border-r last:border-r-0 border-slate-900/50">
                <p className="text-3xl sm:text-4xl font-extrabold text-white bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-sm font-bold text-slate-300 mt-1">{stat.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
          <span className="text-xs font-bold tracking-widest uppercase text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">FEATURES</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">Designed for Next-Gen Scale</h2>
          <p className="text-slate-400">
            Engineered with a modular architecture so developers can easily integrate their own proxy endpoints and payment channels cleanly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat, idx) => (
            <div key={idx} className="bg-slate-900/30 border border-slate-900 hover:border-slate-800 p-8 rounded-2xl transition-all duration-300 group hover:-translate-y-1 backdrop-blur-sm relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-purple-500/0 group-hover:from-blue-500/50 group-hover:via-indigo-500/50 group-hover:to-purple-500/50 rounded-t-2xl transition-all"></div>
              <div className="w-12 h-12 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center mb-6 shadow-md shadow-slate-950 group-hover:scale-110 transition-transform">
                {feat.icon}
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{feat.title}</h3>
              <p className="text-sm text-slate-400 mt-3 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="why-choose-us" className="bg-slate-900/25 border-y border-slate-900/60 backdrop-blur-md py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-bold tracking-widest uppercase text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-full border border-purple-500/20">WHY CHOOSE US</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">Built-in API Layer ready for the future.</h2>
              <p className="text-slate-400 leading-relaxed">
                Most platforms lock you into their own closed infrastructure.
                ProxyGPT Online is built with decoupled service micro-modules.
                You can buy traffic today, then swap the upstream API domain inside our dashboard parameters instantly.
              </p>

              <div className="space-y-4">
                {[
                  'Decoupled proxy provider API connectors',
                  'Modular payment integration block',
                  'Comprehensive admin configurations control panel',
                  'Robust audit logger for user actions and system status'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-slate-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl space-y-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-blue-400" />
                </div>
                <h4 className="text-base font-bold text-white">Instant Deployment</h4>
                <p className="text-xs text-slate-400 leading-relaxed">No phone verify or support tickets needed. Pay, configure your country node, SOCKS5 port, and deploy live proxies in under 4 seconds.</p>
              </div>

              <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl space-y-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-purple-400" />
                </div>
                <h4 className="text-base font-bold text-white">Extreme Security</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Passwords are securely stored inside our database schema, and standard authorization headers are used throughout sessions.</p>
              </div>

              <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl space-y-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-indigo-400" />
                </div>
                <h4 className="text-base font-bold text-white">Country Specific Controls</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Toggle USA, UK, or Canadian nodes dynamically. Forms are custom-built to match structural specifications of proxy providers.</p>
              </div>

              <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl space-y-4">
                <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-pink-400" />
                </div>
                <h4 className="text-base font-bold text-white">Full-Stack Scalability</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Runs on highly efficient Node.js & Express server. High database schema scalability ready to process thousands of transactions.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section id="pricing-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
          <span className="text-xs font-bold tracking-widest uppercase text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">PREMIUM PACKAGES</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">Choose Your Bandwidth</h2>
          <p className="text-slate-400">
            Pristine IP addresses with 30 days active access. Seamlessly top up your GB any time.
          </p>

          {/* Residential network status indicator */}
          {residential && (
            <div className="flex justify-center pt-2">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-semibold ${residential.live
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
                }`}>
                <Radio className={`w-3.5 h-3.5 ${residential.live ? 'animate-pulse' : ''}`} />
                {residential.live
                  ? <span>Live residential network — 200+ countries</span>
                  : <span>Demo mode — add a residential API key to go live</span>}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`bg-slate-900/30 border p-6 rounded-2xl flex flex-col justify-between backdrop-blur-sm relative group transition-all duration-300 hover:-translate-y-1 ${pkg.bandwidthGb === 10
                ? 'border-blue-500/50 shadow-lg shadow-blue-500/10 bg-slate-900/60'
                : 'border-slate-900 hover:border-slate-800'
                }`}
            >
              {pkg.bandwidthGb === 10 && (
                <span className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-blue-500 text-slate-950 text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full shadow-md">
                  POPULAR
                </span>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{pkg.name}</p>
                  {residential && (
                    <span className={`inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${residential.live
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                      }`}>
                      <Radio className="w-2.5 h-2.5" />
                      {residential.live ? 'Live' : 'Demo'}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1 mt-3">
                  <span className="text-4xl font-black text-white">${cardPrice(pkg)}</span>
                  <span className="text-xs text-slate-500">/ {pkg.bandwidthGb} GB</span>
                </div>

                <div className="w-full bg-slate-850 h-1 rounded-full my-4 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full" style={{ width: `${Math.min(pkg.bandwidthGb * 5, 100)}%` }}></div>
                </div>

                {/* Live residential-package metrics from /resident/package + /resident/consumption */}
                {residential && (
                  <div className="mb-4 p-3 bg-slate-950/50 border border-slate-850 rounded-xl space-y-2 text-[10px]">
                    {rotationLabel && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-500"><RefreshCw className="w-3 h-3 text-blue-400" /> Rotation</span>
                        <span className="font-semibold text-slate-200">{rotationLabel}</span>
                      </div>
                    )}
                    {trafficLeftLabel && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-500"><Gauge className="w-3 h-3 text-purple-400" /> Pool traffic left</span>
                        <span className="font-semibold text-slate-200">{trafficLeftLabel}</span>
                      </div>
                    )}
                    {residential.expiresAt && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-500"><Calendar className="w-3 h-3 text-indigo-400" /> Active until</span>
                        <span className="font-semibold text-slate-200">{residential.expiresAt}</span>
                      </div>
                    )}
                  </div>
                )}

                <ul className="space-y-2.5 text-xs text-slate-400">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span><strong>{pkg.bandwidthGb} GB</strong> Bandwidth pool</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Unlimited dynamic ports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>UK, USA, Canada Nodes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>{rotationLabel ? rotationLabel : 'Custom IP rotators'}</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6">
                <button
                  id={`btn-buy-package-${pkg.id}`}
                  onClick={() => onBuyPackage(pkg)}
                  disabled={isOutOfStock}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${isOutOfStock
                    ? 'bg-slate-800 text-slate-500 border border-slate-850 cursor-not-allowed opacity-50'
                    : pkg.bandwidthGb === 10
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:brightness-110'
                      : 'bg-slate-850 text-slate-200 hover:bg-slate-800 border border-slate-800'
                    }`}
                >
                  {isOutOfStock ? 'Out of Stock' : 'Buy Now'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-900">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-4 lg:pr-8">
            <span className="text-xs font-bold tracking-widest uppercase text-blue-400">SUCCESS STORIES</span>
            <h3 className="text-2xl font-bold text-white">Pristine IP network performance validated by customers.</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              We focus on absolute connection pureness. Here is what leading scraping engineers and digital professionals think about ProxyGPT.
            </p>
          </div>

          {testimonials.map((test, idx) => (
            <div key={idx} className="bg-slate-900/30 border border-slate-900 p-6 rounded-2xl flex flex-col justify-between backdrop-blur-sm">
              <p className="text-sm text-slate-300 italic leading-relaxed">"{test.text}"</p>
              <div className="mt-6 flex items-center justify-between border-t border-slate-850 pt-4">
                <div>
                  <h5 className="text-sm font-bold text-white">{test.name}</h5>
                  <p className="text-xs text-slate-500 mt-0.5">{test.role}</p>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(test.stars)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq-section" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-slate-900">
        <div className="text-center space-y-4 mb-16">
          <span className="text-xs font-bold tracking-widest uppercase text-blue-400">FAQ</span>
          <h2 className="text-3xl font-bold text-white">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-slate-900/30 border border-slate-900 rounded-2xl overflow-hidden backdrop-blur-sm transition-colors duration-300">
              <button
                id={`btn-faq-toggle-${idx}`}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-900/50 transition-colors"
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
              >
                <span className="font-semibold text-white text-sm sm:text-base">{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${activeFaq === idx ? 'rotate-180' : ''}`} />
              </button>

              <div className={`transition-all duration-300 overflow-hidden ${activeFaq === idx ? 'max-h-40 border-t border-slate-900' : 'max-h-0'}`}>
                <div className="px-6 py-5 text-sm text-slate-400 leading-relaxed bg-slate-950/20">
                  {faq.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="border-t border-slate-900 bg-slate-950 py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-blue-500/20">
                <img src="/logo.jpeg" alt="ProxyGPT" className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">ProxyGPT</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Premium high-speed proxy selling platform built with clean, modular, scalable backend configurations. Perfect for SEO tracking, web intelligence, and multi-node parsing.
            </p>
          </div>

          <div>
            <h5 className="text-sm font-bold text-white mb-4">Quick Links</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#features-section" className="hover:text-blue-400 transition-colors">Features</a></li>
              <li><a href="#pricing-section" className="hover:text-blue-400 transition-colors">Pricing Packages</a></li>
              <li><a href="#why-choose-us" className="hover:text-blue-400 transition-colors">Why Choose Us</a></li>
              <li><a href="#faq-section" className="hover:text-blue-400 transition-colors">FAQ Support</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-sm font-bold text-white mb-4">Legal & Support</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); onNavigate('privacy-policy'); }}
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); onNavigate('terms-of-service'); }}
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); onNavigate('refund-policy'); }}
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Return &amp; Refund Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); onNavigate('technical-compliance'); }}
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Technical &amp; Compliance
                </a>
              </li>
              <li>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); onNavigate('contact-support'); }}
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Contact Support
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-sm font-bold text-white mb-4">Developer Readiness</h5>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Decoupled Proxy API and Stripe/Crypto configurations. Upload your provider documentation to configure routes seamlessly.
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">
              <span>Status: Production Ready</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-900/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 ProxyGPT Online. All rights reserved. Raiyan Shoe Place, Trade License No. 814.</p>
          <div className="flex gap-6 mt-4 sm:mt-0 flex-wrap justify-center">
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); onNavigate('about-us'); }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              About Us
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); onNavigate('privacy-policy'); }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); onNavigate('terms-of-service'); }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Terms of Service
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); onNavigate('refund-policy'); }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Refund Policy
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); onNavigate('technical-compliance'); }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Compliance
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); onNavigate('contact-support'); }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Contact Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
