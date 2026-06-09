import { act, fireEvent } from "@testing-library/react-native";
import { router } from "expo-router";

import LibraryScreen from "../../../app/(app)/(tabs)/index";
import { useBooksFeed } from "@/features/books/use-books";
import { renderWithGluestack } from "@/shared/ui/gluestack-test-utils";
import type { BooksSortKey, LibraryShelfFilter, LibraryStatusFilter } from "@/shared/types/books";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jest.mock("expo-constants", () => ({
  appOwnership: "expo",
}));

jest.mock("expo-router", () => {
  const React = require("react");
  const { Pressable } = require("react-native");
  return {
    router: {
      push: jest.fn(),
    },
    useRouter: () => ({
      push: jest.fn(),
    }),
    Link: ({
      children,
      asChild,
    }: {
      children: React.ReactNode;
      asChild?: boolean;
    }) =>
      asChild && React.isValidElement(children)
        ? children
        : React.createElement(Pressable, null, children),
  };
});

jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(View, props, children),
  };
});

type LibraryStoreState = {
  searchDraft: string;
  status: LibraryStatusFilter;
  shelf: LibraryShelfFilter;
  genre: string | null;
  sort: BooksSortKey;
  setSearchDraft: (value: string) => void;
  setStatus: (value: LibraryStatusFilter) => void;
  setShelf: (value: LibraryShelfFilter) => void;
  setGenre: (value: string | null) => void;
  setSort: (value: BooksSortKey) => void;
};

const mockLibraryStoreListeners = new Set<() => void>();

function mockEmitLibraryStore() {
  mockLibraryStoreListeners.forEach((listener) => listener());
}

function createMockLibraryStoreState(): LibraryStoreState {
  const base = {
    searchDraft: "",
    status: "todos" as LibraryStatusFilter,
    shelf: "todos" as LibraryShelfFilter,
    genre: null as string | null,
    sort: "recientes" as BooksSortKey,
  };

  return {
    ...base,
    setSearchDraft: (searchDraft) => {
      mockLibraryStoreState = { ...mockLibraryStoreState, searchDraft };
      mockEmitLibraryStore();
    },
    setStatus: (status) => {
      mockLibraryStoreState = { ...mockLibraryStoreState, status };
      mockEmitLibraryStore();
    },
    setShelf: (shelf) => {
      mockLibraryStoreState = { ...mockLibraryStoreState, shelf };
      mockEmitLibraryStore();
    },
    setGenre: (genre) => {
      mockLibraryStoreState = { ...mockLibraryStoreState, genre };
      mockEmitLibraryStore();
    },
    setSort: (sort) => {
      mockLibraryStoreState = { ...mockLibraryStoreState, sort };
      mockEmitLibraryStore();
    },
  };
}

let mockLibraryStoreState = createMockLibraryStoreState();

jest.mock("@store/library-preferences", () => {
  const React = require("react");
  return {
    useLibraryPreferencesStore: (selector: (state: LibraryStoreState) => unknown) =>
      React.useSyncExternalStore(
        (onStoreChange: () => void) => {
          mockLibraryStoreListeners.add(onStoreChange);
          return () => mockLibraryStoreListeners.delete(onStoreChange);
        },
        () => selector(mockLibraryStoreState),
      ),
  };
});

jest.mock("@/features/auth/use-auth", () => ({
  useAuth: () => ({ token: "token-test" }),
}));

const mockFeedResult = {
  isPending: false,
  data: {
    pages: [
      {
        items: [
          {
            id: "book-1",
            title: "Dune",
            author: "Frank Herbert",
            status: "leyendo",
            coverUrl: null,
            rating: 5,
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        hasMore: false,
        offset: 0,
        limit: 20,
      },
    ],
  },
  hasNextPage: false,
  isFetchingNextPage: false,
  isRefetching: false,
  refetch: jest.fn(),
  fetchNextPage: jest.fn(),
};

jest.mock("@/features/books/use-books", () => ({
  useBooksFeed: jest.fn(() => mockFeedResult),
  getLibraryPrefetchThresholdIndex: jest.requireActual("@/features/books/use-books")
    .getLibraryPrefetchThresholdIndex,
}));

describe("LibraryScreen flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockLibraryStoreState = createMockLibraryStoreState();
    mockEmitLibraryStore();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it("debounces search and queries the feed with the typed term", () => {
    const { getByTestId } = renderWithGluestack(<LibraryScreen />);

    fireEvent.changeText(getByTestId("library-searchbar"), "asimov");

    act(() => {
      jest.advanceTimersByTime(399);
    });
    expect(useBooksFeed).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: "" }),
    );

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(useBooksFeed).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: "asimov" }),
    );
  });

  it("shows active status filter chip and clears it on remove", () => {
    mockLibraryStoreState = { ...createMockLibraryStoreState(), status: "leyendo" };
    mockEmitLibraryStore();

    const { getByText, getByLabelText } = renderWithGluestack(<LibraryScreen />);

    expect(getByText("Leyendo")).toBeTruthy();
    fireEvent.press(getByLabelText("Quitar filtro Leyendo"));

    expect(mockLibraryStoreState.status).toBe("todos");
  });

  it("navigates to library filters from the header button", () => {
    const { getByLabelText } = renderWithGluestack(<LibraryScreen />);

    fireEvent.press(getByLabelText("Abrir filtros de biblioteca"));

    expect(router.push).toHaveBeenCalledWith("/(app)/library-filters");
  });
});
