import { fireEvent } from "@testing-library/react-native";

import { AppButton } from "@/shared/ui/app-button";
import { renderWithGluestack } from "@/shared/ui/gluestack-test-utils";

describe("AppButton", () => {
  it("renders provided label", () => {
    const { getByText } = renderWithGluestack(<AppButton label="Guardar" onPress={() => undefined} />);
    expect(getByText("Guardar")).toBeTruthy();
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    const { getByText } = renderWithGluestack(<AppButton label="Guardar" onPress={onPress} />);

    fireEvent.press(getByText("Guardar"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders secondary appearance", () => {
    const { getByText } = renderWithGluestack(
      <AppButton label="Cancelar" appearance="secondary" onPress={() => undefined} />,
    );

    expect(getByText("Cancelar")).toBeTruthy();
  });
});
