import { fireEvent } from "@testing-library/react-native";

import { AppInput } from "@/shared/ui/app-input";
import { renderWithGluestack } from "@/shared/ui/gluestack-test-utils";

describe("AppInput", () => {
  it("renders label and current value", () => {
    const { getByText, getByDisplayValue } = renderWithGluestack(
      <AppInput label="Titulo" value="Dune" onChangeText={() => undefined} />,
    );

    expect(getByText("Titulo")).toBeTruthy();
    expect(getByDisplayValue("Dune")).toBeTruthy();
  });

  it("shows error message and forwards text changes", () => {
    const onChangeText = jest.fn();
    const { getByText, getByDisplayValue } = renderWithGluestack(
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
