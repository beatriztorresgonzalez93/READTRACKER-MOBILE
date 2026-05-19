import { Platform } from "react-native";
import type { ReactElement } from "react";

export type ProUpgradeCheckoutProps = {
  onSuccess: () => void;
  onCancel: () => void;
};

export function ProUpgradeCheckout(props: ProUpgradeCheckoutProps) {
  if (Platform.OS === "web") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const WebImpl = require("./pro-upgrade-checkout.web") as {
      ProUpgradeCheckout: (innerProps: ProUpgradeCheckoutProps) => ReactElement;
    };
    return <WebImpl.ProUpgradeCheckout {...props} />;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const NativeImpl = require("./pro-upgrade-checkout.native") as {
    ProUpgradeCheckout: (innerProps: ProUpgradeCheckoutProps) => ReactElement;
  };
  return <NativeImpl.ProUpgradeCheckout {...props} />;
}
