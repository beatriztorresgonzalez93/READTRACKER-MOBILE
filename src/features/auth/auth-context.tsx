import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useEffect, useMemo, useState } from "react";

import { getMe, login as apiLogin, register as apiRegister } from "@/shared/api/auth-api";
import type { LoginPayload, RegisterPayload, User } from "@/shared/types/auth";

const TOKEN_KEY = "readtracker_auth_token";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const bootstrap = useCallback(async () => {
    try {
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!storedToken) return;
      const me = await getMe(storedToken);
      setToken(storedToken);
      setUser(me);
    } catch {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setToken(null);
      setUser(null);
    } finally {
      setIsBootstrapping(false);
    }
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await apiLogin(payload);
    await SecureStore.setItemAsync(TOKEN_KEY, response.token);
    setToken(response.token);
    setUser(response.user);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await apiRegister(payload);
    await SecureStore.setItemAsync(TOKEN_KEY, response.token);
    setToken(response.token);
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isBootstrapping,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
    }),
    [token, user, isBootstrapping, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

