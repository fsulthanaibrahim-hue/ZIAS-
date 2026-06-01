import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../api/api';
import { AUTH_STORAGE_EVENT, clearAuthStorage, readAuthSession, saveAuthSession } from '../utils/authStorage';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const initialSession = readAuthSession();
  const [user, setUser] = useState(initialSession.user);
  const [token, setToken] = useState(initialSession.token);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);   // 👈 prevent duplicate fetch

  useEffect(() => {
    const syncAuthSession = () => {
      const session = readAuthSession();
      setToken(session.token);
      setUser(session.user);
      hasFetched.current = false;
    };

    window.addEventListener(AUTH_STORAGE_EVENT, syncAuthSession);
    window.addEventListener('storage', syncAuthSession);

    return () => {
      window.removeEventListener(AUTH_STORAGE_EVENT, syncAuthSession);
      window.removeEventListener('storage', syncAuthSession);
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    if (hasFetched.current) return;   // already fetched
    hasFetched.current = true;

    api.get('/users/me/')
      .then(res => setUser(res.data))
      .catch(() => {
        clearAuthStorage();
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (username, password) => {
    const res = await api.post('/login/', { username, password });
    const { access, refresh, user: userData } = res.data;
    saveAuthSession({ access, refresh, user: userData });
    setToken(access);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    clearAuthStorage();
    setToken(null);
    setUser(null);
    hasFetched.current = false;   // reset for next login
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
