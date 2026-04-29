// Gestiona sesion, usuario autenticado y acciones de autenticacion.
import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

import {
  getMe,
  login as apiLogin,
  register as apiRegister,
  updateMe as apiUpdateMe,
} from "@/shared/api/auth-api";
import type { LoginPayload, RegisterPayload, User } from "@/shared/types/auth";

const TOKEN_KEY = "readtracker_auth_token";

async function getStoredToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return globalThis.localStorage?.getItem(TOKEN_KEY) ?? null;
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function setStoredToken(token: string): Promise<void> {
  if (Platform.OS === "web") {
    globalThis.localStorage?.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

async function clearStoredToken(): Promise<void> {
  if (Platform.OS === "web") {
    globalThis.localStorage?.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  updateUserProfile: (payload: {
    name?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string | null;
  }) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const bootstrap = useCallback(async () => {
    try {
      const storedToken = await getStoredToken();
      if (!storedToken) return;
      const me = await getMe(storedToken);
      setToken(storedToken);
      setUser(me);
    } catch {
      await clearStoredToken();
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
    await setStoredToken(response.token);
    setToken(response.token);
    setUser(response.user);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await apiRegister(payload);
    await setStoredToken(response.token);
    setToken(response.token);
    setUser(response.user);
  }, []);

  const updateUserProfile = useCallback(
    async (payload: {
      name?: string;
      firstName?: string;
      lastName?: string;
      avatarUrl?: string | null;
    }) => {
      if (!token || !user) {
        throw new Error("Sesion no disponible.");
      }

      try {
        const updated = await apiUpdateMe(token, payload);
        setUser((prev) => {
          const base = { ...(prev ?? user), ...updated };
          return {
            ...base,
            ...(payload.firstName !== undefined ? { firstName: payload.firstName } : {}),
            ...(payload.lastName !== undefined ? { lastName: payload.lastName } : {}),
            ...(payload.name !== undefined ? { name: payload.name } : {}),
            ...(payload.avatarUrl !== undefined ? { avatarUrl: payload.avatarUrl } : {}),
          };
        });
      } catch {
        // If backend profile endpoint is unavailable, keep UX functional locally.
        setUser((prev) => ({ ...(prev ?? user), ...payload }));
      }
    },
    [token, user],
  );

  const logout = useCallback(async () => {
    await clearStoredToken();
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
      updateUserProfile,
      logout,
    }),
    [token, user, isBootstrapping, login, register, updateUserProfile, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

