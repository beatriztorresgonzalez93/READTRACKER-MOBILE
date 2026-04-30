import { act, renderHook } from "@testing-library/react-native";

import {
  useDeleteReadingSession,
  useMonthlyHistory,
  useReadingSessionsList,
  useReadingStats,
} from "@/features/readingSessions/use-history";
import { getMonthlyHistory, getReadingStats } from "@/shared/api/history-api";
import { deleteReadingSession } from "@/shared/api/reading-sessions-api";

const mockInvalidateQueries = jest.fn(async () => undefined);
const mockUseQuery = jest.fn((config: unknown) => ({
  ...((config ?? {}) as object),
  data: undefined,
  isLoading: false,
  isError: false,
}));
const mockUseAuth = jest.fn(() => ({ token: "token-test" }));

jest.mock("@/features/auth/use-auth", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("@/shared/api/history-api", () => ({
  getMonthlyHistory: jest.fn(async () => ({ days: [] })),
  getReadingStats: jest.fn(async () => ({ totalPages: 0 })),
}));

jest.mock("@/shared/api/reading-sessions-api", () => ({
  getReadingSessions: jest.fn(),
  deleteReadingSession: jest.fn(async () => undefined),
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: (config: unknown) => mockUseQuery(config),
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

  it("propagates delete errors and skips invalidations", async () => {
    (deleteReadingSession as jest.Mock).mockRejectedValueOnce(new Error("delete failed"));
    const mutation = useDeleteReadingSession() as unknown as {
      mutationFn: (sessionId: string) => Promise<unknown>;
    };

    await expect(mutation.mutationFn("session-9")).rejects.toThrow("delete failed");
    expect(mockInvalidateQueries).not.toHaveBeenCalled();
  });
});

describe("history query hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ token: "token-test" });
  });

  it("builds monthly history label and switches months", () => {
    const { result } = renderHook(() => useMonthlyHistory());
    const firstLabel = result.current.label;

    act(() => {
      result.current.previousMonth();
    });
    const prevLabel = result.current.label;

    act(() => {
      result.current.nextMonth();
    });
    const backLabel = result.current.label;

    expect(firstLabel).toMatch(/^\d{2}\/\d{4}$/);
    expect(prevLabel).toMatch(/^\d{2}\/\d{4}$/);
    expect(backLabel).toBe(firstLabel);
  });

  it("covers january and december month boundaries", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-01-10T12:00:00.000Z"));
    const januaryHook = renderHook(() => useMonthlyHistory());

    act(() => {
      januaryHook.result.current.previousMonth();
    });
    expect(januaryHook.result.current.selected.month).toBe(12);
    expect(januaryHook.result.current.selected.year).toBe(2025);

    jest.setSystemTime(new Date("2026-12-10T12:00:00.000Z"));
    const decemberHook = renderHook(() => useMonthlyHistory());
    act(() => {
      decemberHook.result.current.nextMonth();
    });
    expect(decemberHook.result.current.selected.month).toBe(1);
    expect(decemberHook.result.current.selected.year).toBe(2027);

    jest.useRealTimers();
  });

  it("wires monthly stats/sessions queries and executes query fns", async () => {
    const monthly = renderHook(() => useMonthlyHistory()).result.current as unknown as {
      queryFn: () => Promise<unknown>;
      selected: { year: number; month: number };
    };
    const stats = useReadingStats() as unknown as { queryFn: () => Promise<unknown> };
    const sessions = useReadingSessionsList() as unknown as { queryFn: () => Promise<unknown> };

    await monthly.queryFn();
    await stats.queryFn();
    await sessions.queryFn();

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["history", "monthly", monthly.selected.year, monthly.selected.month],
        enabled: true,
      }),
    );
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["stats", "reading"], enabled: true }),
    );
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["reading-sessions", "list"], enabled: true }),
    );

    expect(getMonthlyHistory).toHaveBeenCalledWith(
      "token-test",
      monthly.selected.year,
      monthly.selected.month,
    );
    expect(getReadingStats).toHaveBeenCalledWith("token-test");
  });

  it("disables history/stats/sessions queries when token is missing", () => {
    mockUseAuth.mockReturnValue({ token: undefined });
    renderHook(() => useMonthlyHistory());
    renderHook(() => useReadingStats());
    renderHook(() => useReadingSessionsList());

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: expect.arrayContaining(["history", "monthly"]), enabled: false }),
    );
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["stats", "reading"], enabled: false }),
    );
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["reading-sessions", "list"], enabled: false }),
    );
  });
});
