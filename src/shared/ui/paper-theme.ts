import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from "react-native-paper";

import { getThemeByScheme } from "@/shared/ui/theme";

export function createPaperTheme(colorScheme: "light" | "dark" | null | undefined): MD3Theme {
  const appTheme = getThemeByScheme(colorScheme);
  const base = colorScheme === "light" ? MD3LightTheme : MD3DarkTheme;

  return {
    ...base,
    roundness: appTheme.radius.md,
    colors: {
      ...base.colors,
      primary: appTheme.colors.primary,
      onPrimary: appTheme.colors.onPrimary,
      secondary: appTheme.colors.accent,
      onSecondary: appTheme.colors.onPrimary,
      background: appTheme.colors.bg,
      onBackground: appTheme.colors.textOnDark,
      surface: appTheme.colors.card,
      onSurface: appTheme.colors.text,
      surfaceVariant: appTheme.colors.cardElevated,
      onSurfaceVariant: appTheme.colors.textSoft,
      outline: appTheme.colors.borderOnCard,
      outlineVariant: appTheme.colors.border,
      onSurfaceDisabled: appTheme.colors.textSoft,
      error: appTheme.colors.danger,
      elevation: {
        ...base.colors.elevation,
        level0: appTheme.colors.bg,
        level1: appTheme.colors.card,
        level2: appTheme.colors.cardElevated,
        level3: appTheme.colors.cardElevated,
        level4: appTheme.colors.cardElevated,
        level5: appTheme.colors.cardElevated,
      },
    },
    fonts: {
      ...base.fonts,
      headlineMedium: {
        ...base.fonts.headlineMedium,
        fontFamily: "Fraunces_700Bold",
        fontSize: 28,
        letterSpacing: 0.2,
      },
      headlineSmall: {
        ...base.fonts.headlineSmall,
        fontFamily: "Fraunces_700Bold",
        fontSize: 24,
        letterSpacing: 0.15,
      },
      titleLarge: {
        ...base.fonts.titleLarge,
        fontFamily: "Fraunces_700Bold",
        fontSize: 22,
        letterSpacing: 0.1,
      },
      titleMedium: {
        ...base.fonts.titleMedium,
        fontFamily: "Inter_600SemiBold",
        fontSize: 17,
        letterSpacing: 0.1,
      },
      bodyMedium: {
        ...base.fonts.bodyMedium,
        fontFamily: "Inter_400Regular",
        fontSize: 15,
        letterSpacing: 0.2,
      },
      bodySmall: {
        ...base.fonts.bodySmall,
        fontFamily: "Inter_400Regular",
        fontSize: 13,
        letterSpacing: 0.2,
      },
      labelLarge: {
        ...base.fonts.labelLarge,
        fontFamily: "Inter_600SemiBold",
        fontSize: 14,
        letterSpacing: 0.3,
      },
      labelMedium: {
        ...base.fonts.labelMedium,
        fontFamily: "Inter_600SemiBold",
        fontSize: 12,
        letterSpacing: 0.35,
      },
    },
  };
}
