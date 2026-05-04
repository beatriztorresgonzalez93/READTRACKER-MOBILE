// Gestiona sesión Firebase Auth y perfil de usuario desde la API.
import * as SecureStore from "expo-secure-store";
import {
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser
} from "firebase/auth";
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

import { getFirebaseAuth } from "@/shared/config/firebase";
import { getMe as apiGetMe, updateMe as apiUpdateMe } from "@/shared/api/auth-api";
import type { LoginPayload, RegisterPayload, User } from "@/shared/types/auth";

const TOKEN_KEY = "readtracker_auth_token";

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
  /** Error al enlazar Firebase con el perfil en la API (p. ej. email ya existente en BD). */
  syncError: string | null;
  clearSyncError: () => void;
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
  const [syncError, setSyncError] = useState<string | null>(null);

  const clearSyncError = useCallback(() => {
    setSyncError(null);
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      const auth = getFirebaseAuth();
      unsubscribe = onIdTokenChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        try {
          if (!firebaseUser) {
            await clearStoredToken();
            setToken(null);
            setUser(null);
            return;
          }
          const idToken = await firebaseUser.getIdToken();
          await setStoredToken(idToken);
          setToken(idToken);
          const me = await apiGetMe(idToken);
          setUser(me);
          setSyncError(null);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "No se pudo sincronizar tu cuenta con el servidor.";
          setSyncError(message);
          try {
            await signOut(auth);
          } catch {
            /* ignore */
          }
          await clearStoredToken();
          setToken(null);
          setUser(null);
        } finally {
          setIsBootstrapping(false);
        }
      });
    } catch {
      setIsBootstrapping(false);
    }
    return () => unsubscribe?.();
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const auth = getFirebaseAuth();
    await signInWithEmailAndPassword(auth, payload.email, payload.password);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const auth = getFirebaseAuth();
    const cred = await createUserWithEmailAndPassword(auth, payload.email, payload.password);
    await updateProfile(cred.user, { displayName: payload.name });
  }, []);

  const updateUserProfile = useCallback(
    async (payload: {
      name?: string;
      firstName?: string;
      lastName?: string;
      avatarUrl?: string | null;
    }) => {
      const auth = getFirebaseAuth();
      const firebaseUser = auth.currentUser;
      if (!firebaseUser || !user) {
        throw new Error("Sesion no disponible.");
      }

      const idToken = await firebaseUser.getIdToken();
      const updated = await apiUpdateMe(idToken, payload);
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
      setToken(idToken);
    },
    [user]
  );

  const logout = useCallback(async () => {
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
    } catch {
      /* ignore */
    }
    await clearStoredToken();
    setToken(null);
    setUser(null);
    setSyncError(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isBootstrapping,
      isAuthenticated: Boolean(token && user),
      syncError,
      clearSyncError,
      login,
      register,
      updateUserProfile,
      logout
    }),
    [token, user, isBootstrapping, syncError, clearSyncError, login, register, updateUserProfile, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
