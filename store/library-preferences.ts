// Store global con filtros y preferencias de vista de biblioteca.
import { create } from "zustand";

import type { BooksSortKey, LibraryShelfFilter, LibraryStatusFilter } from "@/shared/types/books";

type LibraryPreferencesState = {
  searchDraft: string;
  status: LibraryStatusFilter;
  shelf: LibraryShelfFilter;
  genre: string | null;
  sort: BooksSortKey;
  showFilters: boolean;
  setSearchDraft: (value: string) => void;
  setStatus: (value: LibraryStatusFilter) => void;
  setShelf: (value: LibraryShelfFilter) => void;
  setGenre: (value: string | null) => void;
  setSort: (value: BooksSortKey) => void;
  setShowFilters: (value: boolean) => void;
  toggleShowFilters: () => void;
  clearFilters: () => void;
};

const defaultState = {
  searchDraft: "",
  status: "todos" as LibraryStatusFilter,
  shelf: "todos" as LibraryShelfFilter,
  genre: null as string | null,
  sort: "recientes" as BooksSortKey,
  showFilters: false,
};

export const useLibraryPreferencesStore = create<LibraryPreferencesState>((set) => ({
  ...defaultState,
  setSearchDraft: (searchDraft) => set({ searchDraft }),
  setStatus: (status) => set({ status }),
  setShelf: (shelf) => set({ shelf }),
  setGenre: (genre) => set({ genre }),
  setSort: (sort) => set({ sort }),
  setShowFilters: (showFilters) => set({ showFilters }),
  toggleShowFilters: () => set((state) => ({ showFilters: !state.showFilters })),
  clearFilters: () =>
    set({
      searchDraft: defaultState.searchDraft,
      status: defaultState.status,
      shelf: defaultState.shelf,
      genre: defaultState.genre,
      sort: defaultState.sort,
    }),
}));

