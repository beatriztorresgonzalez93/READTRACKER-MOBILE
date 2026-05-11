import "react-native-gesture-handler/jestSetup";
import "@testing-library/jest-native/extend-expect";

jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));

jest.mock("@stripe/stripe-react-native", () => {
  const React = require("react");
  return {
    StripeProvider: ({ children }: { children: unknown }) =>
      React.createElement(React.Fragment, null, children),
    useStripe: () => ({
      initPaymentSheet: jest.fn().mockResolvedValue({}),
      presentPaymentSheet: jest.fn().mockResolvedValue({}),
    }),
  };
});
