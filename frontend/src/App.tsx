import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { LoginPage } from './features/auth/LoginPage';
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { DashboardSwitcher } from './features/dashboard/DashboardSwitcher';
import { TicketWorkbench } from './features/tickets/TicketWorkbench';
import { ChatWindow } from './features/chat/ChatWindow';
import { KnowledgeBaseView } from './features/knowledgebase/KnowledgeBaseView';

function PlaceholderView({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 max-w-4xl">
      <h2 className="text-2xl font-bold font-heading text-white">{title}</h2>
      <p className="text-slate-400 text-sm">{description}</p>
      <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
        Module Layout Ready & Connected
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Enterprise Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardSwitcher />} />
                <Route path="/tickets" element={<TicketWorkbench />} />
                <Route path="/chat" element={<ChatWindow />} />
                <Route path="/knowledge-base" element={<KnowledgeBaseView />} />
                <Route path="/organizations" element={<PlaceholderView title="Multi-Tenant Organization Management" description="Platform Owner Organization Provisioning & Global Metrics." />} />
                <Route path="/users" element={<PlaceholderView title="User & Department Management" description="Organization User Roster, Role Assignment, and Department Setup." />} />
                <Route path="/settings" element={<PlaceholderView title="System & Tenant Settings" description="Configure Organization SLAs, Branding, and Security Controls." />} />
              </Route>
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
