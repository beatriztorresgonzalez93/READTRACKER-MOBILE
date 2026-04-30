import { fireEvent, render } from "@testing-library/react-native";

import { AppButton } from "@/shared/ui/app-button";

jest.mock("@/shared/ui/use-app-theme", () => ({
  useAppTheme: () => ({
    colors: {
      onPrimary: "#fff",
      textOnDark: "#222",
      primary: "#a87d42",
      border: "#ccc",
      accent: "#e8cc7a",
    },
    radius: { md: 12 },
  }),
}));

describe("AppButton", () => {
  it("renders provided label", () => {
    const { getByText } = render(<AppButton label="Guardar" onPress={() => undefined} />);
    expect(getByText("Guardar")).toBeTruthy();
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    const { getByText } = render(<AppButton label="Guardar" onPress={onPress} />);

    fireEvent.press(getByText("Guardar"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders secondary variant label color", () => {
    const { getByText } = render(
      <AppButton label="Cancelar" variant="secondary" onPress={() => undefined} />,
    );

    const label = getByText("Cancelar");
    expect(label).toHaveStyle({ color: "#222" });
  });
});
