import { Platform } from "react-native";
import type { ReactElement } from "react";

type ProUpgradeModalProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function ProUpgradeModal(props: ProUpgradeModalProps) {
  if (Platform.OS === "web") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const WebImpl = require("./pro-upgrade-modal.web") as {
      ProUpgradeModal: (innerProps: ProUpgradeModalProps) => ReactElement | null;
    };
    return <WebImpl.ProUpgradeModal {...props} />;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const NativeImpl = require("./pro-upgrade-modal.native") as {
    ProUpgradeModal: (innerProps: ProUpgradeModalProps) => ReactElement | null;
  };
  return <NativeImpl.ProUpgradeModal {...props} />;
}
