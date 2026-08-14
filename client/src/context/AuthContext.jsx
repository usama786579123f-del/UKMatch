import { createContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { DEMO_MODE } from '../utils/demoMode';

export const AuthContext = createContext(null);

const DEMO_USERS = {
  buyer: {
    id: 'demo-buyer',
    name: 'Demo Buyer',
    email: 'buyer@demo.com',
    role: 'buyer',
    isEmailVerified: true,
    kycStatus: null,
    sellerTier: null,
  },
  seller: {
    id: 'demo-seller',
    name: 'Demo Seller',
    email: 'seller@demo.com',
    role: 'seller',
    isEmailVerified: true,
    kycStatus: 'verified',
    sellerTier: 'trusted',
    stripeConnectComplete: true,
  },
  admin: {
    id: 'demo-admin',
    name: 'Demo Admin',
    email: 'admin@demo.com',
    role: 'admin',
    isEmailVerified: true,
    kycStatus: null,
    sellerTier: null,
  },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    if (DEMO_MODE) {
      const stored = localStorage.getItem('matchpass_demo_user');
      setUser(stored ? JSON.parse(stored) : null);
      setLoading(false);
      return;
    }
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email) => {
    if (DEMO_MODE) {
      let persona = DEMO_USERS.buyer;
      if (email.toLowerCase().includes('seller')) persona = DEMO_USERS.seller;
      if (email.toLowerCase().includes('admin')) persona = DEMO_USERS.admin;

      localStorage.setItem('matchpass_demo_user', JSON.stringify(persona));
      localStorage.setItem('matchpass_token', 'demo-token');
      setUser(persona);
      return persona;
    }

    const response = await api.post('/auth/login', { email });
    localStorage.setItem('matchpass_token', response.data.data.token);
    setUser(response.data.data.user);
    return response.data.data.user;
  };

  const signup = async (payload) => {
    if (DEMO_MODE) {
      const base = DEMO_USERS[payload.role] || DEMO_USERS.buyer;
      const persona = { ...base, name: payload.name, email: payload.email };
      localStorage.setItem('matchpass_demo_user', JSON.stringify(persona));
      localStorage.setItem('matchpass_token', 'demo-token');
      setUser(persona);
      return persona;
    }

    const response = await api.post('/auth/signup', payload);
    localStorage.setItem('matchpass_token', response.data.data.token);
    setUser(response.data.data.user);
    return response.data.data.user;
  };

  const logout = async () => {
    if (DEMO_MODE) {
      localStorage.removeItem('matchpass_demo_user');
      localStorage.removeItem('matchpass_token');
      setUser(null);
      return;
    }
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('matchpass_token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, signup, logout, refetchUser: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
};