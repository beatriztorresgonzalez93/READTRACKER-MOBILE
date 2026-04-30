import { render } from "@testing-library/react-native";
import { ActivityIndicator } from "react-native";

import { AppLoader } from "@/shared/ui/app-loader";
import { theme } from "@/shared/ui/theme";

describe("AppLoader", () => {
  it("renders loading indicator with theme accent color", () => {
    const { UNSAFE_getByType } = render(<AppLoader />);
    const indicator = UNSAFE_getByType(ActivityIndicator);

    expect(indicator.props.color).toBe(theme.colors.accent);
    expect(indicator.props.size).toBe("large");
  });
});
