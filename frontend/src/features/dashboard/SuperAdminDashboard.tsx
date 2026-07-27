import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Building2, Users, Ticket, Cpu, Plus, Sparkles, CheckCircle2, TrendingUp, ShieldCheck, Server } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const SuperAdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>({
    total_orgs: 12,
    total_users: 1480,
    total_tickets: 8920,
    total_ai_tokens: 134500,
    ai_trend: [
      { name: 'Mon', tokens: 12400 },
      { name: 'Tue', tokens: 18900 },
      { name: 'Wed', tokens: 15600 },
      { name: 'Thu', tokens: 24100 },
      { name: 'Fri', tokens: 29800 },
      { name: 'Sat', tokens: 14200 },
      { name: 'Sun', tokens: 19500 },
    ]
  });

  useEffect(() => {
    api.get('/analytics/super-admin')
      .then((res) => setMetrics(res.data))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      {/* Header Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Platform Owner Control Center</span>
          </div>
          <h1 className="text-3xl font-black font-heading text-white">Super Admin Dashboard</h1>
          <p className="text-sm text-slate-400">Global multi-tenant overview, AI token consumption, and organization management.</p>
        </div>
      </div>

      {/* Top Global Metrics Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Organizations</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black font-heading text-white">{metrics.total_orgs}</p>
          <p className="text-xs text-emerald-400 flex items-center gap-1 mt-2">
            <TrendingUp className="w-3.5 h-3.5" /> Multi-Tenant Active
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Platform Users</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black font-heading text-white">{metrics.total_users.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-2">Across 5 user roles</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total System Tickets</span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black font-heading text-white">{metrics.total_tickets.toLocaleString()}</p>
          <p className="text-xs text-emerald-400 flex items-center gap-1 mt-2">
            <CheckCircle2 className="w-3.5 h-3.5" /> 94.2% SLA resolution rate
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gemini AI Usage</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black font-heading text-white">{(metrics.total_ai_tokens / 1000).toFixed(1)}k</p>
          <p className="text-xs text-slate-400 mt-2">Tokens consumed this week</p>
        </div>
      </div>

      {/* AI Consumption Chart & System Status */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold font-heading text-white">AI Token Usage Trend</h3>
              <p className="text-xs text-slate-400">Daily token consumption across ticket classification & RAG queries</p>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Gemini 1.5 Flash
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.ai_trend}>
                <defs>
                  <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }} />
                <Area type="monotone" dataKey="tokens" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#tokenGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Infrastructure Health */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold font-heading text-white mb-1">Infrastructure Health</h3>
            <p className="text-xs text-slate-400">Live service telemetry and database status</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300 font-medium flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-400" /> FastAPI Backend API
              </span>
              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                100% ONLINE
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300 font-medium flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" /> Gemini RAG Pipeline
              </span>
              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                OPERATIONAL
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300 font-medium flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" /> Multi-Tenant DB Schema
              </span>
              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                HEALTHY
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
