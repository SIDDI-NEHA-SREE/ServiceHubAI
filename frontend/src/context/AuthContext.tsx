import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Organization, AuthResponse, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, orgCode?: string) => Promise<void>;
  logout: () => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('servicehub_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Hydrate user on load if token exists
  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem('servicehub_token');
      if (storedToken) {
        try {
          const res = await api.get<AuthResponse>('/auth/me');
          setUser(res.data.user);
          setOrganization(res.data.organization || null);
          setToken(res.data.access_token);
          localStorage.setItem('servicehub_token', res.data.access_token);
        } catch {
          // Invalid or expired token
          localStorage.removeItem('servicehub_token');
          setUser(null);
          setOrganization(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    }
    initAuth();
  }, []);

  const login = async (email: string, password: string, orgCode?: string) => {
    setIsLoading(true);
    try {
      const res = await api.post<AuthResponse>('/auth/login', {
        email,
        password,
        org_code: orgCode || undefined
      });
      const { access_token, user: userData, organization: orgData } = res.data;
      
      localStorage.setItem('servicehub_token', access_token);
      setToken(access_token);
      setUser(userData);
      setOrganization(orgData || null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('servicehub_token');
    setUser(null);
    setOrganization(null);
    setToken(null);
  };

  const hasRole = (roles: UserRole | UserRole[]) => {
    if (!user) return false;
    const allowed = Array.isArray(roles) ? roles : [roles];
    return allowed.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, organization, token, isLoading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
