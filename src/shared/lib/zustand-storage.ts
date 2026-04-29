// Storage seguro para persistencia de Zustand con fallback en memoria.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { StateStorage } from "zustand/middleware";

const memoryStorage = new Map<string, string>();

const inMemoryStateStorage: StateStorage = {
  getItem: async (name) => memoryStorage.get(name) ?? null,
  setItem: async (name, value) => {
    memoryStorage.set(name, value);
  },
  removeItem: async (name) => {
    memoryStorage.delete(name);
  },
};

const safeNativeStateStorage: StateStorage = {
  getItem: async (name) => {
    try {
      return await AsyncStorage.getItem(name);
    } catch {
      return inMemoryStateStorage.getItem(name);
    }
  },
  setItem: async (name, value) => {
    try {
      await AsyncStorage.setItem(name, value);
    } catch {
      await inMemoryStateStorage.setItem(name, value);
    }
  },
  removeItem: async (name) => {
    try {
      await AsyncStorage.removeItem(name);
    } catch {
      await inMemoryStateStorage.removeItem(name);
    }
  },
};

const safeWebStateStorage: StateStorage = {
  getItem: async (name) => {
    try {
      return globalThis.localStorage?.getItem(name) ?? null;
    } catch {
      return inMemoryStateStorage.getItem(name);
    }
  },
  setItem: async (name, value) => {
    try {
      globalThis.localStorage?.setItem(name, value);
    } catch {
      await inMemoryStateStorage.setItem(name, value);
    }
  },
  removeItem: async (name) => {
    try {
      globalThis.localStorage?.removeItem(name);
    } catch {
      await inMemoryStateStorage.removeItem(name);
    }
  },
};

export const zustandStateStorage: StateStorage =
  Platform.OS === "web" ? safeWebStateStorage : safeNativeStateStorage;
