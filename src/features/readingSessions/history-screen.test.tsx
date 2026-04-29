import { fireEvent, render } from "@testing-library/react-native";

import HistoryScreen from "../../../app/(app)/(tabs)/history";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jest.mock("expo-constants", () => ({
  appOwnership: "expo",
}));

jest.mock("@/shared/ui/use-app-theme", () => ({
  useAppTheme: () => ({
    colors: { textOnDark: "#222" },
  }),
}));

const mockDeleteMutateAsync = jest.fn(async () => undefined);

jest.mock("@/features/readingSessions/use-history", () => ({
  useMonthlyHistory: () => ({
    isLoading: false,
    isError: false,
    selected: { year: 2026, month: 4 },
    data: {
      days: [{ date: "2026-04-01", pagesRead: 12 }],
    },
    previousMonth: jest.fn(),
    nextMonth: jest.fn(),
  }),
  useReadingSessionsList: () => ({
    data: [
      {
        id: "session-1",
        title: "Dune",
        author: "Frank Herbert",
        bookId: "book-1",
        pagesRead: 12,
        previousPage: 30,
        currentPage: 42,
        recordedAt: "2026-04-01T09:30:00.000Z",
      },
    ],
  }),
  useDeleteReadingSession: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  }),
}));

describe("HistoryScreen flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("opens custom delete confirmation modal from a session card", () => {
    const { getByText, getByLabelText } = render(<HistoryScreen />);

    fireEvent.press(getByText("1"));
    expect(getByText("Dune")).toBeTruthy();

    fireEvent.press(getByLabelText("Eliminar sesion"));
    expect(getByText("Eliminar sesión")).toBeTruthy();
    expect(getByText(/¿Seguro que quieres eliminar la sesión de "Dune"\?/)).toBeTruthy();
  });
});
