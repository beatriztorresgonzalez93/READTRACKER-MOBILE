// Utilidad de tests con GluestackUIProvider.
import { GluestackUIProvider } from "@gluestack-ui/themed";
import { render, type RenderOptions } from "@testing-library/react-native";
import type { ReactElement } from "react";

import { appGluestackConfig } from "@/shared/ui/gluestack-config";

export function renderWithGluestack(ui: ReactElement, options?: RenderOptions) {
  return render(
    <GluestackUIProvider config={appGluestackConfig}>{ui}</GluestackUIProvider>,
    options,
  );
}
