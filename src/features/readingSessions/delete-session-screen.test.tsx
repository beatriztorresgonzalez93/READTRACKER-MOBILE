import { act, fireEvent, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";

import DeleteSessionScreen from "../../../app/(app)/history/delete-session";
import { renderWithGluestack } from "@/shared/ui/gluestack-test-utils";

jest.mock("expo-router", () => ({
  router: {
    back: jest.fn(),
  },
  useLocalSearchParams: () => ({
    sessionId: "session-1",
    title: "Dune",
  }),
}));

const mockDeleteMutateAsync = jest.fn(async () => undefined);

jest.mock("@/features/readingSessions/use-history", () => ({
  useDeleteReadingSession: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  }),
}));

describe("DeleteSessionScreen flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deletes the session and navigates back", async () => {
    const { getByText } = renderWithGluestack(<DeleteSessionScreen />);

    expect(getByText(/Dune/)).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByText("Eliminar"));
    });

    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalledWith("session-1");
      expect(router.back).toHaveBeenCalled();
    });
  });
});
