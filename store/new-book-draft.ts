// Store temporal para el borrador del formulario de nuevo libro.
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware.js";

import { zustandStateStorage } from "@/shared/lib/zustand-storage";

type NewBookDraftState = {
  title: string;
  author: string;
  pages: string;
  publishedYear: string;
  genre: string;
  publisher: string;
  description: string;
  coverOptions: string[];
  selectedCoverUrl: string;
  setTitle: (value: string) => void;
  setAuthor: (value: string) => void;
  setPages: (value: string) => void;
  setPublishedYear: (value: string) => void;
  setGenre: (value: string) => void;
  setPublisher: (value: string) => void;
  setDescription: (value: string) => void;
  setCoverOptions: (value: string[]) => void;
  setSelectedCoverUrl: (value: string) => void;
  resetDraft: () => void;
};

const defaultDraft = {
  title: "",
  author: "",
  pages: "",
  publishedYear: "",
  genre: "",
  publisher: "",
  description: "",
  coverOptions: [] as string[],
  selectedCoverUrl: "",
};

export const useNewBookDraftStore = create<NewBookDraftState>()(
  persist(
    (set) => ({
      ...defaultDraft,
      setTitle: (title) => set({ title }),
      setAuthor: (author) => set({ author }),
      setPages: (pages) => set({ pages }),
      setPublishedYear: (publishedYear) => set({ publishedYear }),
      setGenre: (genre) => set({ genre }),
      setPublisher: (publisher) => set({ publisher }),
      setDescription: (description) => set({ description }),
      setCoverOptions: (coverOptions) => set({ coverOptions }),
      setSelectedCoverUrl: (selectedCoverUrl) => set({ selectedCoverUrl }),
      resetDraft: () => set(defaultDraft),
    }),
    {
      name: "new-book-draft-store",
      storage: createJSONStorage(() => zustandStateStorage),
      partialize: (state) => ({
        title: state.title,
        author: state.author,
        pages: state.pages,
        publishedYear: state.publishedYear,
        genre: state.genre,
        publisher: state.publisher,
        description: state.description,
        coverOptions: state.coverOptions,
        selectedCoverUrl: state.selectedCoverUrl,
      }),
    },
  ),
);

