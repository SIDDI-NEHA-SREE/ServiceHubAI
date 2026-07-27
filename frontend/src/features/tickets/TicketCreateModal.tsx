import React, { useState } from 'react';
import { api } from '../../services/api';
import { Ticket, TicketPriority } from '../../types';
import { Bot, Sparkles, X, Plus, AlertCircle, CheckCircle2, Paperclip, Loader2 } from 'lucide-react';

interface TicketCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTicket: Ticket) => void;
}

export const TicketCreateModal: React.FC<TicketCreateModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  
  const [isClassifying, setIsClassifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResult, setAiResult] = useState<{ suggested_category: string; suggested_priority: TicketPriority; confidence_score: number; reasoning: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAIClassify = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Please fill in both title and description before running AI Auto-Classification.');
      return;
    }
    setError(null);
    setIsClassifying(true);

    try {
      const res = await api.post('/tickets/ai-classify', {
        title,
        description,
        auto_classify_ai: true
      });
      setAiResult(res.data);
      setCategory(res.data.suggested_category);
      setPriority(res.data.suggested_priority);
    } catch {
      setError('AI classification service unavailable. You may manually select options below.');
    } finally {
      setIsClassifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await api.post<Ticket>('/tickets', {
        title,
        description,
        category,
        priority,
        auto_classify_ai: false
      });
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl p-6 sm:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading text-white">Submit New Support Ticket</h2>
              <p className="text-xs text-slate-400">Enterprise AI auto-detects department, category & priority.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Ticket Subject Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Ticket Title / Subject</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Global Protect VPN disconnects continuously on Windows 11"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Ticket Problem Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Detailed Description</label>
              <button
                type="button"
                onClick={handleAIClassify}
                disabled={isClassifying || !title.trim() || !description.trim()}
                className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isClassifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                <span>AI Auto-Classify</span>
              </button>
            </div>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what error messages appear, steps to reproduce, or hardware involved..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* AI Banner Prediction Result */}
          {aiResult && (
            <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" /> Gemini AI Suggestions ({Math.round(aiResult.confidence_score * 100)}% Confidence)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Model: Gemini 1.5 Flash</span>
              </div>
              <p className="text-xs text-slate-300 italic">{aiResult.reasoning}</p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                  Category: {aiResult.suggested_category}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30 uppercase">
                  Priority: {aiResult.suggested_priority}
                </span>
              </div>
            </div>
          )}

          {/* Category & Priority Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="IT Support & Network">IT Support & Network</option>
                <option value="Hardware Provisioning">Hardware Provisioning</option>
                <option value="Payroll & HR">Payroll & HR</option>
                <option value="Facilities & Workplace">Facilities & Workplace</option>
                <option value="General">General Support</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-bold"
              >
                <option value="LOW">LOW (SLA: 72h)</option>
                <option value="MEDIUM">MEDIUM (SLA: 24h)</option>
                <option value="HIGH">HIGH (SLA: 4h)</option>
                <option value="URGENT">URGENT (SLA: 2h)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? <span>Submitting...</span> : <span>Create Ticket</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
