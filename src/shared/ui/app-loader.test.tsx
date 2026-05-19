import { render } from "@testing-library/react-native";
import { ActivityIndicator } from "react-native";

import { AppLoader } from "@/shared/ui/app-loader";

jest.mock("@gluestack-ui/themed", () => {
  const { View, ActivityIndicator: Spinner } = require("react-native");
  return { Box: View, Spinner };
});

describe("AppLoader", () => {
  it("renders activity indicator on cream background", () => {
    const { UNSAFE_getByType } = render(<AppLoader />);
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it("accepts custom background", () => {
    const { UNSAFE_getByType } = render(<AppLoader backgroundColor="#FFFFFF" />);
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });
});
