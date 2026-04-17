/* eslint-disable react-refresh/only-export-components -- context module exports hook + provider */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getCurrentUser,
  logoutUser,
  recoverUsername,
  registerUsername,
  rotateRecoveryCode as rotateRecoveryCodeRequest,
} from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('loading');
  const [user, setUser] = useState(null);
  const [recoveryCode, setRecoveryCode] = useState('');

  const refreshAuth = useCallback(async () => {
    try {
      const nextUser = await getCurrentUser();
      setUser(nextUser);
      setStatus(nextUser ? 'authenticated' : 'anonymous');
    } catch (error) {
      console.error('Failed to refresh auth state:', error);
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const register = useCallback(async (username) => {
    const payload = await registerUsername(username);
    setUser(payload.user || null);
    setRecoveryCode(payload.recoveryCode || '');
    setStatus(payload.user ? 'authenticated' : 'anonymous');
    return payload;
  }, []);

  const recover = useCallback(async (username, nextRecoveryCode) => {
    const payload = await recoverUsername(username, nextRecoveryCode);
    setUser(payload.user || null);
    setRecoveryCode(payload.recoveryCode || '');
    setStatus(payload.user ? 'authenticated' : 'anonymous');
    return payload;
  }, []);

  const rotateRecoveryCode = useCallback(async () => {
    const payload = await rotateRecoveryCodeRequest();
    setRecoveryCode(payload.recoveryCode || '');
    return payload;
  }, []);

  const clearRecoveryCode = useCallback(() => {
    setRecoveryCode('');
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
      setRecoveryCode('');
      setStatus('anonymous');
    }
  }, []);

  const value = useMemo(
    () => ({
      status,
      user,
      recoveryCode,
      isAuthenticated: status === 'authenticated' && Boolean(user),
      refreshAuth,
      register,
      recover,
      rotateRecoveryCode,
      clearRecoveryCode,
      logout,
    }),
    [status, user, recoveryCode, refreshAuth, register, recover, rotateRecoveryCode, clearRecoveryCode, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}