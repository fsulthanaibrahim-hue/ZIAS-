// context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../api/api';
import { AUTH_STORAGE_EVENT, clearAuthStorage, readAuthSession, saveAuthSession } from '../utils/authStorage';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const initialSession = readAuthSession();
  const [user, setUser] = useState(initialSession.user);
  const [token, setToken] = useState(initialSession.token);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);
  const abortRef = useRef(null);

  // Sync between tabs — but DO NOT reset hasFetched
  useEffect(() => {
    const syncAuthSession = () => {
      const session = readAuthSession();
      setToken(session.token);
      setUser(session.user);
    };

    window.addEventListener(AUTH_STORAGE_EVENT, syncAuthSession);
    window.addEventListener('storage', syncAuthSession);

    return () => {
      window.removeEventListener(AUTH_STORAGE_EVENT, syncAuthSession);
      window.removeEventListener('storage', syncAuthSession);
    };
  }, []);

  useEffect(() => {
    const publicPaths = ["/login", "/admin/login", "/forgot-password", "/register", "/reset-password"];
    const currentPath = window.location.pathname;

    if (publicPaths.some(p => currentPath.startsWith(p))) {
      setLoading(false);
      return;
    }

    if (!token) {
      setLoading(false);
      return;
    }

    // Prevent duplicate /users/me/ calls
    if (hasFetched.current) {
      setLoading(false);
      return;
    }
    hasFetched.current = true;

    // Abort previous request if this effect re-runs
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    api.get('/users/me/', { signal: controller.signal })
      .then(res => {
        setUser(res.data);
      })
      .catch((err) => {
        if (err.name === 'CanceledError' || err.name === 'AbortError') return;
        console.error("Error fetching user:", err);
        clearAuthStorage();
        setToken(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => {
      // Don't abort on unmount — only on re-run of the effect
    };
  }, [token]);

  const login = async (loginId, password) => {
    try {
      const res = await api.post('/login/', {
        login: loginId,
        password: password,
      });

      const { access, refresh, user: userData } = res.data;

      saveAuthSession({ access, refresh, user: userData });

      setToken(access);
      setUser(userData);
      hasFetched.current = true; // mark as fetched since we already have the user

      return userData;
    } catch (error) {
      console.error("Login API error:", error);
      throw error;
    }
  };

  const logout = () => {
    if (abortRef.current) abortRef.current.abort();
    clearAuthStorage();
    setToken(null);
    setUser(null);
    hasFetched.current = false;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};