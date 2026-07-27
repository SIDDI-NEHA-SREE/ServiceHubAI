import React from 'react';
import { Bot, Plus, Search, BookOpen, Sparkles, Ticket, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const EmployeePortal: React.FC = () => {
  const { user, organization } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      {/* Employee Welcome Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-purple-950/50 border border-indigo-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Self-Service Portal</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black font-heading text-white">
            How can we help you today, {user ? user.name : 'Employee'}?
          </h1>

          <p className="text-sm text-slate-300">
            Ask our instant AI Assistant for quick answers from {organization ? organization.name : 'company'} policies, or submit a new service ticket.
          </p>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Type your question (e.g., 'How to connect to VPN?' or 'Expense report steps')..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-950/90 border border-slate-700/80 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 shadow-xl transition-all"
            />
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid md:grid-cols-3 gap-6">
        <div
          onClick={() => navigate('/tickets')}
          className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1 font-heading">Submit New Ticket</h3>
          <p className="text-xs text-slate-400 mb-4">Create a request for IT, HR, Finance, or Facilities with instant AI classification.</p>
          <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
            Submit Request <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div
          onClick={() => navigate('/knowledge-base')}
          className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
            <Bot className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1 font-heading">Ask AI Assistant</h3>
          <p className="text-xs text-slate-400 mb-4">Chat with the RAG AI chatbot trained strictly on verified company documents.</p>
          <span className="text-xs font-bold text-purple-400 flex items-center gap-1">
            Launch AI Chat <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div
          onClick={() => navigate('/knowledge-base')}
          className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1 font-heading">Browse Policy Articles</h3>
          <p className="text-xs text-slate-400 mb-4">View official company guidelines, IT setup manuals, and benefits guides.</p>
          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
            View Articles <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* My Active Tickets Overview */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold font-heading text-white">My Submitted Service Tickets</h3>
          <button
            onClick={() => navigate('/tickets')}
            className="text-xs font-bold text-indigo-400 hover:underline"
          >
            View All My Tickets
          </button>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4 hover:border-slate-700 transition-colors">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-indigo-400">SH-1001</span>
                <span className="text-xs font-bold text-white">Global Protect VPN disconnects continuously on Windows 11</span>
              </div>
              <p className="text-xs text-slate-400">Assigned Agent: John Miller • Category: IT Support & Network</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold flex-shrink-0">
              IN_PROGRESS
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4 hover:border-slate-700 transition-colors">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-indigo-400">SH-1003</span>
                <span className="text-xs font-bold text-white">Direct Deposit Bank Account Update for Next Pay Cycle</span>
              </div>
              <p className="text-xs text-slate-400 font-semibold text-emerald-400">Resolved on July 27, 2026 • Rating: 5/5</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex-shrink-0">
              RESOLVED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
