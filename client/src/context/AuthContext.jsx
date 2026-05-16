import { createContext, useCallback, useContext, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading, null = unauthenticated
  const navigate = useNavigate();

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await api.get('/api/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    setUser(data.user);
    navigate(data.redirectTo);
    return data.user;
  }, [navigate]);

  const signup = useCallback(async (name, email, password, role) => {
    const { data } = await api.post('/api/auth/signup', { name, email, password, role });
    setUser(data.user);
    navigate(data.redirectTo);
    return data.user;
  }, [navigate]);

  const logout = useCallback(async () => {
    await api.post('/api/auth/logout');
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const value = useMemo(() => ({
    user,
    isLoading: user === undefined,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    refreshUser: fetchUser,
  }), [user, login, signup, logout, fetchUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
