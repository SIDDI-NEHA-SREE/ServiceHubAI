import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Bot, Building2, Lock, Mail, Sparkles, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle, UserCheck } from 'lucide-react';

interface DemoAccount {
  name: string;
  email: string;
  role: string;
  org_code: string;
  org_name: string;
  password_hint: string;
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [activeTab, setActiveTab] = useState<'tenant' | 'superadmin'>('tenant');
  const [orgCode, setOrgCode] = useState('acme');
  const [email, setEmail] = useState('admin@acme.com');
  const [password, setPassword] = useState('Password123!');
  
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orgVerification, setOrgVerification] = useState<{ exists: boolean; name?: string } | null>({ exists: true, name: 'Acme Enterprise Corporation' });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch demo accounts
  useEffect(() => {
    api.get('/auth/demo-accounts')
      .then((res) => {
        setDemoAccounts(res.data.accounts || []);
      })
      .catch(() => {});
  }, []);

  // Verify Organization Code dynamically on blur
  const handleOrgCodeBlur = async () => {
    if (!orgCode.trim()) return;
    try {
      const res = await api.post('/auth/tenant-check', { org_code: orgCode });
      setOrgVerification(res.data.exists ? { exists: true, name: res.data.name } : { exists: false });
    } catch {
      setOrgVerification({ exists: false });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await login(
        email,
        password,
        activeTab === 'tenant' ? orgCode : undefined
      );
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to authenticate. Please check your credentials.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoAccount = (acc: DemoAccount) => {
    if (acc.role === 'SUPER_ADMIN') {
      setActiveTab('superadmin');
      setEmail(acc.email);
      setPassword(acc.password_hint);
      setOrgCode('');
    } else {
      setActiveTab('tenant');
      setOrgCode(acc.org_code);
      setEmail(acc.email);
      setPassword(acc.password_hint);
      setOrgVerification({ exists: true, name: acc.org_name });
    }
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-indigo-500/20 selection:text-indigo-400">
      {/* Dynamic Background Glow Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Demo Account Selection Banner */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-xl px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Interactive Demo Accounts:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => fillDemoAccount(acc)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                  email === acc.email
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                    : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>{acc.name}</span>
                <span className="opacity-60 text-[10px] uppercase font-mono">({acc.role.replace('_', ' ')})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Login Box */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Header Branding */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 shadow-xl shadow-indigo-500/30 mb-2">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black font-heading tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
              ServiceHub AI
            </h1>
            <p className="text-sm text-slate-400">Enterprise Service Desk & Multi-Tenant AI Platform</p>
          </div>

          {/* Login Card */}
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative">
            {/* Tab Selector */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950 border border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('tenant');
                  setOrgCode('acme');
                  setEmail('admin@acme.com');
                  setErrorMessage(null);
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'tenant'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Organization Portal</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('superadmin');
                  setEmail('servicehubai.2026@gmail.com');
                  setPassword('SuperAdmin@2026');
                  setErrorMessage(null);
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'superadmin'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Super Admin</span>
              </button>
            </div>

            {errorMessage && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Organization Code Field (For Tenant Portal) */}
              {activeTab === 'tenant' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Organization Code</span>
                    {orgVerification && (
                      <span className={`text-[11px] font-medium flex items-center gap-1 ${orgVerification.exists ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {orgVerification.exists ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> {orgVerification.name}
                          </>
                        ) : (
                          'Org code not found'
                        )}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={orgCode}
                      onChange={(e) => setOrgCode(e.target.value)}
                      onBlur={handleOrgCodeBlur}
                      placeholder="e.g. acme"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors uppercase font-mono tracking-wide"
                    />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Work Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to ServiceHub</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
              <p className="text-xs text-slate-500">
                Protected by Enterprise Multi-Tenant JWT Isolation & RBAC
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-600 border-t border-slate-900">
        © 2026 ServiceHub AI Inc. All rights reserved.
      </footer>
    </div>
  );
};
