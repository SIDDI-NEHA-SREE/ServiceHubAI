import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Ticket, TicketStatus, TicketPriority } from '../../types';
import { TicketCreateModal } from './TicketCreateModal';
import { TicketDetailModal } from './TicketDetailModal';
import { Ticket as TicketIcon, Plus, Search, Filter, Clock, CheckCircle2, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';

export const TicketWorkbench: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'ALL') params.status_filter = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery;

      const res = await api.get('/tickets', { params });
      setTickets(res.data.tickets || []);
    } catch {
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, searchQuery]);

  const handleTicketCreated = (newTicket: Ticket) => {
    fetchTickets();
  };

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDetailOpen(true);
  };

  const priorityBadges: Record<TicketPriority, string> = {
    URGENT: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    HIGH: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    MEDIUM: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    LOW: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  const statusBadges: Record<TicketStatus, string> = {
    OPEN: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    IN_PROGRESS: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    RESOLVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    CLOSED: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <TicketIcon className="w-3.5 h-3.5" />
            <span>Enterprise Service Desk</span>
          </div>
          <h1 className="text-3xl font-black font-heading text-white">Ticket Management Workbench</h1>
          <p className="text-sm text-slate-400">Create, track, assign, and resolve multi-tenant support requests.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTickets}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Refresh Tickets"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Ticket</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {['ALL', 'OPEN', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === st ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Tickets Data Table */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="p-3">Ticket ID</th>
                <th className="p-3">Title & Category</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Status</th>
                <th className="p-3">Assignee</th>
                <th className="p-3">SLA Due</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No tickets found matching your filters.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => handleTicketClick(t)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="p-3 font-mono font-bold text-indigo-400">{t.ticket_number}</td>
                    <td className="p-3 max-w-xs">
                      <p className="font-bold text-white truncate">{t.title}</p>
                      <p className="text-[11px] text-slate-400">{t.category}</p>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${priorityBadges[t.priority]}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusBadges[t.status]}`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">
                      {t.assignee ? t.assignee.name : <span className="text-slate-500 italic">Unassigned</span>}
                    </td>
                    <td className="p-3 font-mono text-slate-400">
                      {t.sla_due_at ? new Date(t.sla_due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTicketClick(t);
                        }}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Ticket Modal */}
      <TicketCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleTicketCreated}
      />

      {/* Ticket Detail Modal */}
      <TicketDetailModal
        ticket={selectedTicket}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onUpdate={fetchTickets}
      />
    </div>
  );
};
