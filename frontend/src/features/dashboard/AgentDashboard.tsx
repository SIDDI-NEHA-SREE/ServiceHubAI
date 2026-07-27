import React, { useState } from 'react';
import { Ticket, Clock, CheckCircle2, AlertCircle, Filter, ArrowUpRight, MessageSquare, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AgentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <Ticket className="w-3.5 h-3.5" />
            <span>Service Agent Queue & Workbench</span>
          </div>
          <h1 className="text-3xl font-black font-heading text-white">Agent Workbench</h1>
          <p className="text-sm text-slate-400">Manage your assigned ticket queue, track SLA deadlines, and resolve customer issues.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/tickets')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all"
          >
            <span>Open All Queue Tickets</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Urgent Ticket Alert Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-400">SLA Warning Alert</p>
            <p className="text-xs text-amber-200">Ticket <span className="font-mono font-bold">#SH-1001</span> Global Protect VPN disconnect issue has 3h 45m remaining before SLA breach.</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/tickets')}
          className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors flex-shrink-0"
        >
          View Ticket
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned To Me</span>
            <Ticket className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-3xl font-black font-heading text-white">2</p>
          <p className="text-xs text-slate-400 mt-2">1 High, 1 Medium priority</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending SLA</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-3xl font-black font-heading text-amber-400">1</p>
          <p className="text-xs text-slate-400 mt-2">Due in &lt; 4 hours</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resolved Today</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-black font-heading text-emerald-400">4</p>
          <p className="text-xs text-slate-400 mt-2">100% CSAT 5-star rating</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Chat Threads</span>
            <MessageSquare className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-black font-heading text-white">1</p>
          <p className="text-xs text-slate-400 mt-2">Live chat session active</p>
        </div>
      </div>

      {/* Ticket Queue Workbench Table */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-bold font-heading text-white">My Assigned Ticket Queue</h3>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {['ALL', 'IN_PROGRESS', 'OPEN', 'RESOLVED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterStatus === st ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="p-3">Ticket ID</th>
                <th className="p-3">Title & Category</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Status</th>
                <th className="p-3">SLA Due</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3 font-mono font-bold text-indigo-400">SH-1001</td>
                <td className="p-3">
                  <p className="font-bold text-white">Global Protect VPN disconnects continuously on Windows 11</p>
                  <p className="text-[11px] text-slate-400">Category: IT Support & Network • Creator: Sarah Connor</p>
                </td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold uppercase">
                    HIGH
                  </span>
                </td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold uppercase">
                    IN_PROGRESS
                  </span>
                </td>
                <td className="p-3 font-mono text-amber-400 font-bold">3h 45m left</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => navigate('/tickets')}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors"
                  >
                    Open Workbench
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
