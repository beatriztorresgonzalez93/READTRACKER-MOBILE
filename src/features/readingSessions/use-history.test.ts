import { useDeleteReadingSession } from "@/features/readingSessions/use-history";
import { deleteReadingSession } from "@/shared/api/reading-sessions-api";

const mockInvalidateQueries = jest.fn(async () => undefined);

jest.mock("@/features/auth/use-auth", () => ({
  useAuth: () => ({ token: "token-test" }),
}));

jest.mock("@/shared/api/history-api", () => ({
  getMonthlyHistory: jest.fn(),
  getReadingStats: jest.fn(),
}));

jest.mock("@/shared/api/reading-sessions-api", () => ({
  getReadingSessions: jest.fn(),
  deleteReadingSession: jest.fn(async () => undefined),
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
  useMutation: (config: unknown) => config,
}));

describe("useDeleteReadingSession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls delete API with active token", async () => {
    const mutation = useDeleteReadingSession() as unknown as {
      mutationFn: (sessionId: string) => Promise<unknown>;
    };

    await mutation.mutationFn("session-9");
    expect(deleteReadingSession).toHaveBeenCalledWith("token-test", "session-9");
  });

  it("invalidates history, stats and book-related caches on success", async () => {
    const mutation = useDeleteReadingSession() as unknown as { onSuccess: () => Promise<void> };
    await mutation.onSuccess();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["reading-sessions", "list"] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["history", "monthly"] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["stats", "reading"] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["books", "feed"] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["books", "summary"] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["books", "leyendo-preview"] });
  });
});
