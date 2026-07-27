import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Bot, LogOut, ShieldCheck, Building2, UserCheck, Sparkles, Layers, Ticket, MessageSquare, BookOpen, BarChart3, Clock, CheckCircle2 } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, organization, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Enterprise Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-xl px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold font-heading text-white">ServiceHub AI</h1>
              {organization && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase font-mono">
                  {organization.org_code}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {organization ? organization.name : 'Platform System Owner'}
            </p>
          </div>
        </div>

        {/* User Profile Bar */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
            <img
              src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={user.name}
              className="w-8 h-8 rounded-lg object-cover border border-indigo-500/30"
            />
            <div className="text-left text-xs">
              <p className="font-bold text-slate-100">{user.name}</p>
              <p className="text-[11px] font-semibold text-indigo-400 font-mono">{user.role}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8 flex-1 w-full">
        {/* Welcome Hero Banner */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/40 border border-indigo-500/20 shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>RBAC Session Verified</span>
            </div>
            <h2 className="text-3xl font-black font-heading tracking-tight text-white">
              Welcome back, {user.name}
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              You are authenticated as <span className="text-indigo-400 font-bold">{user.role}</span> in{' '}
              <span className="text-slate-100 font-semibold">{organization ? organization.name : 'Super Admin Workspace'}</span>.
            </p>
          </div>
        </div>

        {/* Role Overview Widgets */}
        <div className="grid md:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">User Role</span>
              <UserCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <p className="text-2xl font-black font-heading text-white">{user.role}</p>
            <p className="text-xs text-slate-400 mt-1">Tenant Role Access Level</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Organization</span>
              <Building2 className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-2xl font-black font-heading text-white truncate">
              {organization ? organization.org_code.toUpperCase() : 'PLATFORM'}
            </p>
            <p className="text-xs text-slate-400 mt-1">Isolated Tenant Context</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Auth Method</span>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-2xl font-black font-heading text-white">JWT Bearer</p>
            <p className="text-xs text-slate-400 mt-1">Multi-Tenant Header Inject</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</span>
              <CheckCircle2 className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-2xl font-black font-heading text-emerald-400">ACTIVE</p>
            <p className="text-xs text-slate-400 mt-1">Module 2 Complete</p>
          </div>
        </div>

        {/* Feature Modules Ready */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-lg font-bold font-heading text-white">Upcoming Enterprise Dashboards & Modules</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-3">
              <Ticket className="w-5 h-5 text-indigo-400" />
              <span className="text-sm font-medium">Ticket Management</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-medium">Live Chat & AI Bot</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-medium">RAG Knowledge Base</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-medium">Enterprise Analytics</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
