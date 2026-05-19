// Tema gluestack alineado con Scriptorium (marrón claro + dorado).
import { config as defaultConfig } from "@gluestack-ui/config";
import { createConfig } from "@gluestack-style/react";

export { APP_CARD_BG, APP_CREAM_BG } from "@/shared/ui/app-colors";

export const appGluestackConfig = createConfig({  ...defaultConfig,
  tokens: {
    ...defaultConfig.tokens,
    colors: {
      ...defaultConfig.tokens.colors,
      primary0: "#FFFCF5",
      primary50: "#F6F1E7",
      primary100: "#EDE4D2",
      primary200: "#D8C9AE",
      primary300: "#C4A35A",
      primary400: "#A88B4A",
      primary500: "#A87D42",
      primary600: "#8F6836",
      primary700: "#67503E",
      primary800: "#2D1F15",
      primary900: "#261910",
      backgroundLight0: "#F6F1E7",
      backgroundLight50: "#FFFCF5",
      backgroundLight100: "#EDE4D2",
      textLight900: "#2D1F15",
      textLight700: "#67503E",
      textLight500: "#7A6555",
    },
  },
});
