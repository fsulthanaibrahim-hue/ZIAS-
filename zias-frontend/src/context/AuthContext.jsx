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
    if (hasFetched.current) return;
    hasFetched.current = true;

    api.get('/users/me/')
      .then(res => {
        console.log("Fetched user from /users/me/:", res.data);
        setUser(res.data);
      })
      .catch((err) => {
        console.error("Error fetching user:", err);
        clearAuthStorage();
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (loginId, password) => {
    try {
      const res = await api.post('/login/', { 
        email: loginId,
        username: loginId,
        login: loginId,
        password: password 
      });
      
      console.log("Login API response:", res.data);
      
      const { access, refresh, user: userData } = res.data;
      
      // Debug: Check what role data we received
      console.log("User data from login:", userData);
      console.log("is_accounts value:", userData.is_accounts);
      console.log("is_student value:", userData.is_student);
      console.log("role value:", userData.role);
      
      // Save to storage
      saveAuthSession({ access, refresh, user: userData });
      
      // Update state
      setToken(access);
      setUser(userData);
      
      return userData;
    } catch (error) {
      console.error("Login API error:", error);
      throw error;
    }
  };

  const logout = () => {
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