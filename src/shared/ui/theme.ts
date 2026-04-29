// Expone tokens de tema y selector por esquema de color.
import { noteFlowDarkTheme, noteFlowLightTheme, type ThemeTokens } from "../../../constants/theme";

export { noteFlowDarkTheme, noteFlowLightTheme };
export type { ThemeTokens };

export function getThemeByScheme(colorScheme: "light" | "dark" | null | undefined): ThemeTokens {
  return colorScheme === "light" ? noteFlowLightTheme : noteFlowDarkTheme;
}

// Backward-compatible export used across existing screens.
export const theme = noteFlowDarkTheme;
