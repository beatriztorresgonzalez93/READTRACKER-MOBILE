import {
  useBookDetail,
  useBooksFeed,
  useBooksSummary,
  useCreateBook,
  useCreateReadingSession,
  useDeleteBook,
  useLeyendoPreview,
  useUpdateBook,
  useUpdateBookStatus,
} from "@/features/books/use-books";
import {
  createBook,
  createReadingSession,
  deleteBook,
  getBookById,
  getBooksPage,
  getBooksSummary,
  updateBook,
  updateBookStatus,
} from "@/shared/api/books-api";
import type { LibraryBooksQuery } from "@/shared/types/books";

const mockInvalidateQueries = jest.fn(async () => undefined);
const mockRemoveQueries = jest.fn(async () => undefined);
const mockUseInfiniteQuery = jest.fn((config: unknown) => config);
const mockUseQuery = jest.fn((config: unknown) => config);
const mockUseAuth = jest.fn(() => ({ token: "token-test" }));

jest.mock("@/features/auth/use-auth", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("@/shared/api/books-api", () => ({
  createBook: jest.fn(async () => ({ id: "book-1" })),
  createReadingSession: jest.fn(async () => undefined),
  deleteBook: jest.fn(async () => undefined),
  getBookById: jest.fn(async () => ({ id: "book-1", title: "Dune" })),
  getBooksPage: jest.fn(async () => ({ items: [], hasMore: false, offset: 0, limit: 10 })),
  getBooksSummary: jest.fn(async () => ({ total: 0, leido: 0 })),
  updateBook: jest.fn(async () => ({ id: "book-1" })),
  updateBookStatus: jest.fn(async () => ({ id: "book-1", status: "leido" })),
}));

jest.mock("@tanstack/react-query", () => ({
  keepPreviousData: {},
  useInfiniteQuery: (config: unknown) => mockUseInfiniteQuery(config),
  useQuery: (config: unknown) => mockUseQuery(config),
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
    removeQueries: mockRemoveQueries,
  }),
  useMutation: (config: unknown) => config,
}));

describe("useCreateReadingSession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls API with token, bookId and payload", async () => {
    const mutation = useCreateReadingSession("book-1") as unknown as {
      mutationFn: (payload: { currentPage: number; previousPage: number }) => Promise<unknown>;
    };

    await mutation.mutationFn({ currentPage: 42, previousPage: 30 });

    expect(createReadingSession).toHaveBeenCalledWith("token-test", {
      bookId: "book-1",
      currentPage: 42,
      previousPage: 30,
    });
  });

  it("invalidates all dependent queries on success", async () => {
    const mutation = useCreateReadingSession("book-1") as unknown as { onSuccess: () => Promise<void> };
    await mutation.onSuccess();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["reading-sessions", "list"] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["history", "monthly"] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["stats", "reading"] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["books", "feed"] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["books", "detail", "book-1"] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["books", "summary"] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["books", "leyendo-preview"] });
  });

  it("propagates API errors and does not invalidate caches", async () => {
    (createReadingSession as jest.Mock).mockRejectedValueOnce(new Error("network down"));
    const mutation = useCreateReadingSession("book-1") as unknown as {
      mutationFn: (payload: { currentPage: number; previousPage: number }) => Promise<unknown>;
    };

    await expect(
      mutation.mutationFn({ currentPage: 42, previousPage: 30 }),
    ).rejects.toThrow("network down");

    expect(mockInvalidateQueries).not.toHaveBeenCalled();
  });
});

describe("books hooks query/mutation wiring", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ token: "token-test" });
  });

  it("configures library feed query with filters in key", () => {
    const query = {
      search: "asimov",
      status: "leyendo",
      shelf: "main",
      genre: "Sci-Fi",
      sort: "updated_desc",
    } as unknown as LibraryBooksQuery;

    useBooksFeed(query);

    expect(mockUseInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["books", "feed", "asimov", "leyendo", "main", "Sci-Fi", "updated_desc"],
        enabled: true,
        initialPageParam: 0,
      }),
    );
  });

  it("handles getNextPageParam branches for hasMore true/false", () => {
    const query = {
      search: "",
      status: "all",
      shelf: "all",
      genre: "",
      sort: "updated_desc",
    } as unknown as LibraryBooksQuery;

    const feedConfig = useBooksFeed(query) as unknown as {
      getNextPageParam: (lastPage: { hasMore: boolean; offset: number; limit: number }) => number | undefined;
    };

    expect(feedConfig.getNextPageParam({ hasMore: true, offset: 10, limit: 10 })).toBe(20);
    expect(feedConfig.getNextPageParam({ hasMore: false, offset: 10, limit: 10 })).toBeUndefined();
  });

  it("configures summary, detail and preview queries", () => {
    useBooksSummary();
    useBookDetail("book-99");
    useLeyendoPreview();

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["books", "summary"], enabled: true }),
    );
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["books", "detail", "book-99"], enabled: true }),
    );
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["books", "leyendo-preview"], enabled: true }),
    );
  });

  it("disables queries when token is missing", () => {
    mockUseAuth.mockReturnValue({ token: null });
    const query = {
      search: "a",
      status: "leyendo",
      shelf: "all",
      genre: "",
      sort: "updated_desc",
    } as unknown as LibraryBooksQuery;

    useBooksFeed(query);
    useBooksSummary();
    useBookDetail("book-1");
    useLeyendoPreview();

    expect(mockUseInfiniteQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["books", "summary"], enabled: false }),
    );
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["books", "detail", "book-1"], enabled: false }),
    );
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["books", "leyendo-preview"], enabled: false }),
    );
  });

  it("runs API query functions with auth token", async () => {
    const summaryQuery = useBooksSummary() as unknown as { queryFn: () => Promise<unknown> };
    const detailQuery = useBookDetail("book-99") as unknown as { queryFn: () => Promise<unknown> };
    const previewQuery = useLeyendoPreview() as unknown as { queryFn: () => Promise<unknown> };

    await summaryQuery.queryFn();
    await detailQuery.queryFn();
    await previewQuery.queryFn();

    expect(getBooksSummary).toHaveBeenCalledWith("token-test");
    expect(getBookById).toHaveBeenCalledWith("token-test", "book-99");
    expect(getBooksPage).toHaveBeenCalledWith(
      "token-test",
      0,
      6,
      expect.objectContaining({ status: "leyendo" }),
    );
  });

  it("invalidates caches after status/create/update/delete mutations", async () => {
    const updateStatus = useUpdateBookStatus("book-1") as unknown as {
      mutationFn: (status: "leido" | "leyendo" | "pendiente") => Promise<unknown>;
      onSuccess: () => Promise<void>;
    };
    const createBookMutation = useCreateBook() as unknown as {
      mutationFn: (payload: { title: string }) => Promise<unknown>;
      onSuccess: () => Promise<void>;
    };
    const updateBookMutation = useUpdateBook("book-1") as unknown as {
      mutationFn: (payload: { title: string }) => Promise<unknown>;
      onSuccess: () => Promise<void>;
    };
    const deleteBookMutation = useDeleteBook("book-1") as unknown as {
      mutationFn: () => Promise<unknown>;
      onSuccess: () => Promise<void>;
    };

    await updateStatus.mutationFn("leido");
    await createBookMutation.mutationFn({ title: "Neuromancer" });
    await updateBookMutation.mutationFn({ title: "Dune Messiah" });
    await deleteBookMutation.mutationFn();

    expect(updateBookStatus).toHaveBeenCalledWith("token-test", "book-1", "leido");
    expect(createBook).toHaveBeenCalledWith("token-test", { title: "Neuromancer" });
    expect(updateBook).toHaveBeenCalledWith("token-test", "book-1", { title: "Dune Messiah" });
    expect(deleteBook).toHaveBeenCalledWith("token-test", "book-1");

    await updateStatus.onSuccess();
    await createBookMutation.onSuccess();
    await updateBookMutation.onSuccess();
    await deleteBookMutation.onSuccess();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["books", "feed"] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["books", "detail", "book-1"] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["books", "summary"] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["books", "leyendo-preview"] });
    expect(mockRemoveQueries).toHaveBeenCalledWith({ queryKey: ["books", "detail", "book-1"] });
  });
});
