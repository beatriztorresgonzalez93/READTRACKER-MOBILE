import { fireEvent, render } from "@testing-library/react-native";

import { AppInput } from "@/shared/ui/app-input";

jest.mock("@/shared/ui/use-app-theme", () => ({
  useAppTheme: () => ({
    colors: {
      textOnDark: "#222",
      borderOnCard: "#ccc",
      card: "#fff",
      text: "#111",
      danger: "#c00",
    },
    radius: { sm: 10 },
  }),
}));

describe("AppInput", () => {
  it("renders label and current value", () => {
    const { getByText, getByDisplayValue } = render(
      <AppInput label="Titulo" value="Dune" onChangeText={() => undefined} />,
    );

    expect(getByText("Titulo")).toBeTruthy();
    expect(getByDisplayValue("Dune")).toBeTruthy();
  });

  it("shows error message and forwards text changes", () => {
    const onChangeText = jest.fn();
    const { getByText, getByDisplayValue } = render(
      <AppInput
        label="Autor"
        value="Frank"
        onChangeText={onChangeText}
        error="Campo obligatorio"
      />,
    );

    expect(getByText("Campo obligatorio")).toBeTruthy();
    fireEvent.changeText(getByDisplayValue("Frank"), "Herbert");
    expect(onChangeText).toHaveBeenCalledWith("Herbert");
  });
});
