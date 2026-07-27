import React from 'react';
import { Building, Users, Ticket, BookOpen, UserPlus, Layers, Settings, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const OrgAdminDashboard: React.FC = () => {
  const { organization } = useAuth();

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <Building className="w-3.5 h-3.5" />
            <span>Organization Admin Portal</span>
          </div>
          <h1 className="text-3xl font-black font-heading text-white">
            {organization ? organization.name : 'Organization Overview'}
          </h1>
          <p className="text-sm text-slate-400">Manage organization users, departments, service configuration, and AI knowledge base.</p>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all">
            <UserPlus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users</span>
            <Users className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-3xl font-black font-heading text-white">6</p>
          <p className="text-xs text-slate-400 mt-2">Active in Acme Enterprise</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Departments</span>
            <Layers className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-black font-heading text-white">4</p>
          <p className="text-xs text-slate-400 mt-2">IT, HR, Finance, Facilities</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Tickets</span>
            <Ticket className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-black font-heading text-white">3</p>
          <p className="text-xs text-slate-400 mt-2">2 Open, 1 Resolved</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">RAG Documents</span>
            <BookOpen className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-black font-heading text-white">2</p>
          <p className="text-xs text-emerald-400 mt-2">Indexed for AI Chatbot</p>
        </div>
      </div>

      {/* User Roster Table */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold font-heading text-white">Organization Users & Roles</h3>
          <span className="text-xs text-slate-400">Strict Tenant RBAC Access</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="p-3">User Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Department</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr className="hover:bg-slate-800/40">
                <td className="p-3 font-bold text-white">Alexander Wright</td>
                <td className="p-3 text-slate-400">admin@acme.com</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold font-mono">ORG_ADMIN</span></td>
                <td className="p-3">IT Support & Infrastructure</td>
                <td className="p-3 text-emerald-400 font-semibold">Active</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="p-3 font-bold text-white">Elena Rostova</td>
                <td className="p-3 text-slate-400">manager.it@acme.com</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold font-mono">MANAGER</span></td>
                <td className="p-3">IT Support & Infrastructure</td>
                <td className="p-3 text-emerald-400 font-semibold">Active</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="p-3 font-bold text-white">John Miller</td>
                <td className="p-3 text-slate-400">agent.john@acme.com</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold font-mono">AGENT</span></td>
                <td className="p-3">IT Support & Infrastructure</td>
                <td className="p-3 text-emerald-400 font-semibold">Active</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="p-3 font-bold text-white">Sarah Connor</td>
                <td className="p-3 text-slate-400">employee.sarah@acme.com</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold font-mono">EMPLOYEE</span></td>
                <td className="p-3">Finance & Billing</td>
                <td className="p-3 text-emerald-400 font-semibold">Active</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
