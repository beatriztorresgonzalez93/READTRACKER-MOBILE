import { act, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import ProfileScreen from "../../../app/(app)/profile";
import { renderWithGluestack } from "@/shared/ui/gluestack-test-utils";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jest.mock("expo-image", () => ({
  Image: () => null,
}));

jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(View, props, children),
  };
});

const mockUpdateUserProfile = jest.fn(async () => undefined);

jest.mock("@/features/auth/use-auth", () => ({
  useAuth: () => ({
    user: {
      id: "user-1",
      email: "ana@example.com",
      firstName: "Ana",
      lastName: "García",
      name: "Ana García",
      avatarUrl: "https://cdn.example.com/avatar.jpg",
      createdAt: "2024-06-15T10:00:00.000Z",
    },
    token: "token-test",
    logout: jest.fn(),
    updateUserProfile: mockUpdateUserProfile,
  }),
}));

jest.mock("@/shared/config/firebase", () => ({
  getFirebaseAuth: () => ({
    currentUser: { getIdToken: jest.fn(async () => "firebase-token") },
  }),
}));

jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true })),
  launchImageLibraryAsync: jest.fn(async () => ({
    canceled: false,
    assets: [{ uri: "file:///photo.jpg" }],
  })),
}));

jest.mock("@/shared/lib/upload-profile-avatar", () => ({
  avatarUriNeedsPrepare: jest.fn(() => false),
  compressAvatarPickerAsset: jest.fn(async () => "data:image/jpeg;base64,compressed"),
  prepareAvatarUrl: jest.fn(),
}));

describe("ProfileScreen flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("saves updated name via mocked API", async () => {
    const { getByDisplayValue, getByText } = renderWithGluestack(<ProfileScreen />);

    fireEvent.changeText(getByDisplayValue("Ana"), "Beatriz");
    fireEvent.changeText(getByDisplayValue("García"), "Torres");

    await act(async () => {
      fireEvent.press(getByText("Guardar cambios"));
    });

    await waitFor(() => {
      expect(mockUpdateUserProfile).toHaveBeenCalledWith({
        firstName: "Beatriz",
        lastName: "Torres",
        name: "Beatriz Torres",
        avatarUrl: "https://cdn.example.com/avatar.jpg",
      });
      expect(Alert.alert).toHaveBeenCalledWith(
        "Perfil actualizado",
        "Tus cambios se han guardado.",
      );
    });
  });

  it("saves new photo and clears avatar via mocked API", async () => {
    const { getByText } = renderWithGluestack(<ProfileScreen />);

    fireEvent.press(getByText("Cambiar foto"));
    fireEvent.press(getByText("Quitar foto"));

    await act(async () => {
      fireEvent.press(getByText("Guardar cambios"));
    });

    await waitFor(() => {
      expect(mockUpdateUserProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: "Ana",
          lastName: "García",
          avatarUrl: null,
        }),
      );
      expect(Alert.alert).toHaveBeenCalledWith(
        "Perfil actualizado",
        "Tus cambios se han guardado.",
      );
    });
  });
});
