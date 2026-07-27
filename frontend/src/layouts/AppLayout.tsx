import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Bot,
  LayoutDashboard,
  Ticket,
  BookOpen,
  MessageSquare,
  Building2,
  Users,
  Settings,
  Sun,
  Moon,
  LogOut,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
  Building,
  UserCheck
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user, organization, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Dynamic Navigation Items based on Role
  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'AGENT', 'EMPLOYEE']
    },
    {
      label: 'Ticket Workbench',
      path: '/tickets',
      icon: Ticket,
      roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'AGENT', 'EMPLOYEE']
    },
    {
      label: 'Knowledge Base',
      path: '/knowledge-base',
      icon: BookOpen,
      roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'AGENT', 'EMPLOYEE']
    },
    {
      label: 'Live Chat & Voice',
      path: '/chat',
      icon: MessageSquare,
      roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'AGENT', 'EMPLOYEE']
    },
    {
      label: 'Organizations',
      path: '/organizations',
      icon: Building2,
      roles: ['SUPER_ADMIN']
    },
    {
      label: 'Team & Users',
      path: '/users',
      icon: Users,
      roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER']
    },
    {
      label: 'System Settings',
      path: '/settings',
      icon: Settings,
      roles: ['SUPER_ADMIN', 'ORG_ADMIN']
    }
  ].filter((item) => item.roles.includes(user.role));

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    ORG_ADMIN: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    MANAGER: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    AGENT: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    EMPLOYEE: 'bg-slate-500/10 text-slate-300 border-slate-500/20'
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-indigo-500/20 selection:text-indigo-400">
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-slate-800/80 bg-slate-900/90 backdrop-blur-xl transition-all duration-300 relative z-40 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30">
              <Bot className="w-6 h-6 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="truncate">
                <h1 className="font-extrabold font-heading text-white text-base leading-tight">
                  ServiceHub AI
                </h1>
                <p className="text-[11px] text-slate-400 font-mono truncate">
                  {organization ? organization.name : 'Platform Owner'}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden md:block"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Tenant Organization Pill */}
        {!sidebarCollapsed && organization && (
          <div className="px-4 py-3 border-b border-slate-800/50 bg-slate-950/40">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-indigo-400" /> Organization:
              </span>
              <span className="font-bold text-indigo-300 font-mono uppercase bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {organization.org_code}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
          <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <img
                src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={user.name}
                className="w-9 h-9 rounded-xl object-cover border border-indigo-500/30 flex-shrink-0"
              />
              {!sidebarCollapsed && (
                <div className="truncate text-xs">
                  <p className="font-bold text-white truncate">{user.name}</p>
                  <span className={`inline-block px-1.5 py-0.2 text-[10px] font-bold rounded border uppercase font-mono ${roleColors[user.role]}`}>
                    {user.role.replace('_', ' ')}
                  </span>
                </div>
              )}
            </div>

            {!sidebarCollapsed && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 md:hidden"
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-72 bg-slate-900 border-r border-slate-800 z-50 md:hidden flex flex-col transform transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Bot className="w-5 h-5" />
            </div>
            <span className="font-extrabold font-heading text-white">ServiceHub AI</span>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-white md:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Global Search Bar */}
            <div className="relative hidden sm:block w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search tickets, docs, KB... (Cmd+K)"
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Switcher Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900 transition-colors relative"
              >
                <Bell className="w-4 h-4" />
                <span className="w-2 h-2 rounded-full bg-indigo-500 absolute top-1.5 right-1.5 ring-2 ring-slate-950" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 z-50 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-white">Notifications</span>
                    <span className="text-[10px] text-indigo-400 font-semibold cursor-pointer">Mark all read</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                      <p className="font-semibold text-slate-200">Ticket #SH-1001 Assigned</p>
                      <p className="text-[11px] text-slate-400">Global Protect VPN ticket assigned to John Miller.</p>
                      <span className="text-[10px] text-slate-500">10m ago</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Summary Header Button */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <img
                src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={user.name}
                className="w-8 h-8 rounded-lg object-cover border border-indigo-500/30"
              />
              <span className="text-xs font-bold text-slate-200 hidden lg:inline">{user.name}</span>
            </div>
          </div>
        </header>

        {/* Viewport Outlet */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
