import { createContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

/**
 * DEMO_MODE: when true, login/signup never hit the real backend and
 * instead simulate success with a fake user. This lets the client
 * click through the entire app on a static Vercel deployment before
 * a real backend is paid for and connected. Set to false (or remove)
 * once a real backend URL is wired up via VITE_API_URL.
 */
const DEMO_MODE = true;

const DEMO_USERS = {
  buyer: { id: 'demo-buyer', name: 'Demo Buyer', email: 'buyer@demo.com', role: 'buyer', isEmailVerified: true, kycStatus: null, sellerTier: null },
  seller: { id: 'demo-seller', name: 'Demo Seller', email: 'seller@demo.com', role: 'seller', isEmailVerified: true, kycStatus: 'verified', sellerTier: 'trusted', stripeConnectComplete: true },
  admin: { id: 'demo-admin', name: 'Demo Admin', email: 'admin@demo.com', role: 'admin', isEmailVerified: true, kycStatus: null, sellerTier: null },
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
      const { data } = await api.get('/auth/me');
      setUser(data.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email, password) => {
    if (DEMO_MODE) {
      // Pick a demo persona based on the email typed, so the client can
      // preview all three roles without a real backend:
      //   anything with "seller" -> seller demo
      //   anything with "admin"  -> admin demo
      //   everything else        -> buyer demo
      let persona = DEMO_USERS.buyer;
      if (email.toLowerCase().includes('seller')) persona = DEMO_USERS.seller;
      if (email.toLowerCase().includes('admin')) persona = DEMO_USERS.admin;

      localStorage.setItem('matchpass_demo_user', JSON.stringify(persona));
      localStorage.setItem('matchpass_token', 'demo-token');
      setUser(persona);
      return persona;
    }

    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('matchpass_token', data.data.token);
    setUser(data.data.user);
    return data.data.user;
  };

  const signup = async (payload) => {
    if (DEMO_MODE) {
      const persona = { ...DEMO_USERS[payload.role] || DEMO_USERS.buyer, name: payload.name, email: payload.email };
      localStorage.setItem('matchpass_demo_user', JSON.stringify(persona));
      localStorage.setItem('matchpass_token', 'demo-token');
      setUser(persona);
      return persona;
    }

    const { data } = await api.post('/auth/signup', payload);
    localStorage.setItem('matchpass_token', data.data.token);
    setUser(data.data.user);
    return data.data.user;
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