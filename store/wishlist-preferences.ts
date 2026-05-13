// Filtros de wishlist (tienda y orden) persistidos como en biblioteca.
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware.js";

import { zustandStateStorage } from "@/shared/lib/zustand-storage";

export type WishlistSortKey = "priority" | "title" | "recent";

type WishlistPreferencesState = {
  storeFilter: string;
  sortBy: WishlistSortKey;
  setStoreFilter: (value: string) => void;
  setSortBy: (value: WishlistSortKey) => void;
  clearWishlistFilters: () => void;
};

const defaultState = {
  storeFilter: "all",
  sortBy: "priority" as WishlistSortKey,
};

export const useWishlistPreferencesStore = create<WishlistPreferencesState>()(
  persist(
    (set) => ({
      ...defaultState,
      setStoreFilter: (storeFilter) => set({ storeFilter }),
      setSortBy: (sortBy) => set({ sortBy }),
      clearWishlistFilters: () =>
        set({
          storeFilter: defaultState.storeFilter,
          sortBy: defaultState.sortBy,
        }),
    }),
    {
      name: "wishlist-preferences-store",
      storage: createJSONStorage(() => zustandStateStorage),
      partialize: (state) => ({
        storeFilter: state.storeFilter,
        sortBy: state.sortBy,
      }),
    },
  ),
);
