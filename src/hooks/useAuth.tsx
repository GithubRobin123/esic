import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, Location } from '../types';
import api from '../utils/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  selectedLocation: Location | null;
  needsLocationSelect: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setSelectedLocation: (loc: Location) => void;
  isAuthenticated: boolean;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('ediss_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('ediss_token')
  );
  // selectedLocation is session-only (not persisted across logins)
  const [selectedLocation, setSelectedLocationState] = useState<Location | null>(null);
  // needsLocationSelect is true whenever user is logged in but hasn't selected location this session
  const [needsLocationSelect, setNeedsLocationSelect] = useState<boolean>(() => {
    return !!localStorage.getItem('ediss_token');
  });

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password });
    const { token: t, user: u } = res.data;
    setToken(t);
    setUser(u);
    setSelectedLocationState(null);
    setNeedsLocationSelect(true); // force location select on every login
    localStorage.setItem('ediss_token', t);
    localStorage.setItem('ediss_user', JSON.stringify(u));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setSelectedLocationState(null);
    setNeedsLocationSelect(false);
    localStorage.removeItem('ediss_token');
    localStorage.removeItem('ediss_user');
  }, []);

  const setSelectedLocation = useCallback((loc: Location) => {
    setSelectedLocationState(loc);
    setNeedsLocationSelect(false);
  }, []);

  const hasRole = useCallback((roles: string[]) => {
    return !!user && roles.includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, token, selectedLocation, needsLocationSelect,
      login, logout, setSelectedLocation,
      isAuthenticated: !!token, hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
