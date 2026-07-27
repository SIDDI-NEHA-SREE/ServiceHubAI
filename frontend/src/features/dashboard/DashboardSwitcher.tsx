import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { OrgAdminDashboard } from './OrgAdminDashboard';
import { ManagerDashboard } from './ManagerDashboard';
import { AgentDashboard } from './AgentDashboard';
import { EmployeePortal } from './EmployeePortal';

export const DashboardSwitcher: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'SUPER_ADMIN':
      return <SuperAdminDashboard />;
    case 'ORG_ADMIN':
      return <OrgAdminDashboard />;
    case 'MANAGER':
      return <ManagerDashboard />;
    case 'AGENT':
      return <AgentDashboard />;
    case 'EMPLOYEE':
    default:
      return <EmployeePortal />;
  }
};
