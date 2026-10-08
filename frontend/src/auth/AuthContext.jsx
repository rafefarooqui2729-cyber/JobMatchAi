import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import apiClient from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiClient
      .get('/auth/me')
      .then(({ data }) => {
        if (active) setUser(data.user);
      })
      .catch((error) => {
        if (active && error.response?.status !== 401) {
          console.error('Unable to restore the authentication session.', {
            status: error.response?.status,
          });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      async login(role, credentials) {
        const { data } = await apiClient.post(`/auth/${role}/login`, credentials);
        setUser(data.user);
        return data.user;
      },
      async register(role, details) {
        const { data } = await apiClient.post(`/auth/${role}/register`, details);
        setUser(data.user);
        return data.user;
      },
      async logout() {
        await apiClient.post('/auth/logout');
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
