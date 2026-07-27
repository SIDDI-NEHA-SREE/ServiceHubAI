import React, { useState } from 'react';
import { Ticket, TicketStatus, TicketPriority } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { X, Clock, CheckCircle2, MessageSquare, Shield, Star, UserCheck, Send, AlertCircle, FileText, Activity } from 'lucide-react';

interface TicketDetailModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({ ticket, isOpen, onClose, onUpdate }) => {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState('');

  if (!isOpen || !ticket) return null;

  const isAgentOrAdmin = user && ['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'AGENT'].includes(user.role);

  const handleStatusChange = async (newStatus: TicketStatus) => {
    try {
      await api.put(`/tickets/${ticket.id}`, { status: newStatus });
      onUpdate();
    } catch {
      alert('Failed to update status.');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    try {
      await api.post(`/tickets/${ticket.id}/comments`, {
        content: commentText,
        is_internal: isInternal
      });
      setCommentText('');
      onUpdate();
    } catch {
      alert('Failed to add comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRateResolution = async () => {
    try {
      await api.put(`/tickets/${ticket.id}`, {
        rating,
        feedback
      });
      onUpdate();
    } catch {
      alert('Failed to submit rating.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-end">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-2xl h-full shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-bold text-indigo-400 text-sm">{ticket.ticket_number}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                ticket.priority === 'URGENT' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                ticket.priority === 'HIGH' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400'
              }`}>
                {ticket.priority} Priority
              </span>
            </div>
            <h2 className="text-lg font-bold font-heading text-white line-clamp-1">{ticket.title}</h2>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Changer & SLA Banner */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Status</span>
              {isAgentOrAdmin ? (
                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                  className="mt-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="PENDING">PENDING</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              ) : (
                <span className="text-xs font-bold text-indigo-400 font-mono">{ticket.status}</span>
              )}
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Category</span>
              <span className="text-xs font-bold text-slate-200">{ticket.category}</span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Assigned Agent</span>
              <span className="text-xs font-bold text-emerald-400">
                {ticket.assignee ? ticket.assignee.name : 'Unassigned (In Queue)'}
              </span>
            </div>
          </div>

          {/* Ticket Description Box */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase font-mono">Description</span>
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* Resolution Rating Box (If Resolved) */}
          {ticket.status === 'RESOLVED' && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Resolution Survey
                </span>
                {ticket.rating && (
                  <span className="text-xs font-bold text-amber-400 font-mono">
                    Rating: {ticket.rating} / 5 Stars
                  </span>
                )}
              </div>

              {ticket.rating ? (
                <p className="text-xs text-slate-300 italic">"{ticket.feedback || 'Great resolution service!'}"</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-300">Rate the agent's resolution speed and service:</p>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRating(s)}
                        className={`p-1.5 rounded-lg border text-xs font-bold transition-all ${
                          rating >= s ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'
                        }`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    ))}
                    <button
                      onClick={handleRateResolution}
                      className="ml-auto px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                    >
                      Submit Rating
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Activity Logs & Comments Stream */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" /> Discussion & History Log
            </h3>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {ticket.comments?.map((c) => (
                <div
                  key={c.id}
                  className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                    c.is_internal
                      ? 'bg-amber-950/30 border-amber-500/30 text-amber-100'
                      : 'bg-slate-950 border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-indigo-300">
                      {c.user ? c.user.name : 'System'} {c.is_internal && '(Internal Note)'}
                    </span>
                    <span className="text-slate-500 font-mono">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p>{c.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Comment Post Box */}
        <form onSubmit={handleAddComment} className="p-4 border-t border-slate-800 bg-slate-950 space-y-3">
          {isAgentOrAdmin && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="internal_note"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0"
              />
              <label htmlFor="internal_note" className="text-xs text-amber-400 font-semibold cursor-pointer">
                Internal Agent Note (Visible to Agents/Managers only)
              </label>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              required
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={isInternal ? 'Type internal agent note...' : 'Type public reply to requester...'}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
