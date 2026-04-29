import { useCreateReadingSession } from "@/features/books/use-books";
import { createReadingSession } from "@/shared/api/books-api";

const mockInvalidateQueries = jest.fn(async () => undefined);

jest.mock("@/features/auth/use-auth", () => ({
  useAuth: () => ({ token: "token-test" }),
}));

jest.mock("@/shared/api/books-api", () => ({
  createReadingSession: jest.fn(async () => undefined),
}));

jest.mock("@tanstack/react-query", () => ({
  keepPreviousData: {},
  useInfiniteQuery: jest.fn(),
  useQuery: jest.fn(),
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
    removeQueries: jest.fn(),
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
});
