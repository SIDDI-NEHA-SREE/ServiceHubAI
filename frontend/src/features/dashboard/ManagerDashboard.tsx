import React from 'react';
import { BarChart3, Clock, CheckCircle2, AlertTriangle, Users, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const ticketPriorityData = [
  { name: 'Low', count: 1, color: '#10b981' },
  { name: 'Medium', count: 1, color: '#3b82f6' },
  { name: 'High', count: 1, color: '#f59e0b' },
  { name: 'Urgent', count: 0, color: '#ef4444' },
];

const teamPerformanceData = [
  { agent: 'John Miller', resolved: 14, open: 2, avgTime: '1.2h' },
  { agent: 'Sarah Jenkins', resolved: 18, open: 1, avgTime: '0.8h' },
];

export const ManagerDashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Team & Service Operations Management</span>
          </div>
          <h1 className="text-3xl font-black font-heading text-white">Manager Analytics & Performance</h1>
          <p className="text-sm text-slate-400">Department SLA tracking, agent workload distribution, and ticket resolution velocity.</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">SLA Adherence Rate</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-black font-heading text-emerald-400">96.8%</p>
          <p className="text-xs text-slate-400 mt-2">Target: 95.0%</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg First Response</span>
            <Clock className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-3xl font-black font-heading text-white">12m</p>
          <p className="text-xs text-emerald-400 mt-2">⚡ 4m faster than last week</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Team Agents</span>
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-black font-heading text-white">2</p>
          <p className="text-xs text-slate-400 mt-2">Tier 1 & Tier 2 IT Agents</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Customer CSAT</span>
            <TrendingUp className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-3xl font-black font-heading text-amber-400">4.9 / 5.0</p>
          <p className="text-xs text-slate-400 mt-2">Based on resolution surveys</p>
        </div>
      </div>

      {/* Visual Analytics */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-lg font-bold font-heading text-white">Ticket Distribution by Priority</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ticketPriorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Agent Leaderboard Table */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="text-lg font-bold font-heading text-white">Service Agent Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3">Agent Name</th>
                  <th className="p-3">Resolved</th>
                  <th className="p-3">In Queue</th>
                  <th className="p-3">Avg Resolution Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {teamPerformanceData.map((agent) => (
                  <tr key={agent.agent} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-white">{agent.agent}</td>
                    <td className="p-3 text-emerald-400 font-bold">{agent.resolved}</td>
                    <td className="p-3 text-amber-400 font-bold">{agent.open}</td>
                    <td className="p-3 font-mono text-slate-400">{agent.avgTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
