import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { router, useSegments, useRootNavigationState } from 'expo-router';
import { User, AuthResponse } from '@/src/types';
import { apiFetch } from './api';
import { storage } from './storage';
import { ENDPOINTS } from '@/src/constants/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function useProtectedRoute(user: User | null, isLoading: boolean) {
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (isLoading || !navigationState?.key) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inDetail = segments[0] === 'laporan' || segments[0] === 'chat';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      const dashboard = getRoleDashboard(user.role);
      router.replace(dashboard);
    }
  }, [user, isLoading, segments, navigationState?.key]);
}

export function getRoleDashboard(role: string): '/' {
  return '/';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useProtectedRoute(user, isLoading);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const storedToken = await storage.getToken();
      const storedUser = await storage.getUser<User>();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);

        try {
          const profile = await apiFetch<User>(ENDPOINTS.AUTH.PROFILE);
          setUser(profile);
          await storage.setUser(profile);
        } catch {
          await storage.clear();
          setToken(null);
          setUser(null);
        }
      }
    } catch {
      await storage.clear();
    } finally {
      setIsLoading(false);
    }
  }

  const login = useCallback(async (newToken: string, newUser: User) => {
    await storage.setToken(newToken);
    await storage.setUser(newUser);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    await storage.clear();
    setToken(null);
    setUser(null);
    router.replace('/(auth)/login');
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await apiFetch<User>(ENDPOINTS.AUTH.PROFILE);
      setUser(profile);
      await storage.setUser(profile);
    } catch {
      await logout();
    }
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        refreshProfile,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
