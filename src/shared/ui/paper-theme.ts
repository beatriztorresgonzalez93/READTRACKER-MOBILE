import { MD3LightTheme, type MD3Theme } from "react-native-paper";

import { theme } from "@/shared/ui/theme";

export const paperTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 18,
  colors: {
    ...MD3LightTheme.colors,
    primary: theme.colors.primary,
    onPrimary: theme.colors.onPrimary,
    secondary: theme.colors.accent,
    onSecondary: theme.colors.onPrimary,
    background: theme.colors.bg,
    onBackground: theme.colors.textOnDark,
    surface: theme.colors.card,
    onSurface: theme.colors.text,
    surfaceVariant: theme.colors.cardElevated,
    onSurfaceVariant: theme.colors.textSoft,
    outline: theme.colors.borderOnCard,
    outlineVariant: theme.colors.border,
    onSurfaceDisabled: theme.colors.textSoft,
    error: theme.colors.danger,
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level0: theme.colors.bg,
      level1: theme.colors.card,
      level2: theme.colors.cardElevated,
      level3: theme.colors.cardElevated,
      level4: theme.colors.cardElevated,
      level5: theme.colors.cardElevated,
    },
  },
  fonts: {
    ...MD3LightTheme.fonts,
    headlineMedium: {
      ...MD3LightTheme.fonts.headlineMedium,
      fontFamily: "Fraunces_700Bold",
      fontSize: 28,
      letterSpacing: 0.2,
    },
    headlineSmall: {
      ...MD3LightTheme.fonts.headlineSmall,
      fontFamily: "Fraunces_700Bold",
      fontSize: 24,
      letterSpacing: 0.15,
    },
    titleLarge: {
      ...MD3LightTheme.fonts.titleLarge,
      fontFamily: "Fraunces_700Bold",
      fontSize: 22,
      letterSpacing: 0.1,
    },
    titleMedium: {
      ...MD3LightTheme.fonts.titleMedium,
      fontFamily: "Inter_600SemiBold",
      fontSize: 17,
      letterSpacing: 0.1,
    },
    bodyMedium: {
      ...MD3LightTheme.fonts.bodyMedium,
      fontFamily: "Inter_400Regular",
      fontSize: 15,
      letterSpacing: 0.2,
    },
    bodySmall: {
      ...MD3LightTheme.fonts.bodySmall,
      fontFamily: "Inter_400Regular",
      fontSize: 13,
      letterSpacing: 0.2,
    },
    labelLarge: {
      ...MD3LightTheme.fonts.labelLarge,
      fontFamily: "Inter_600SemiBold",
      fontSize: 14,
      letterSpacing: 0.3,
    },
    labelMedium: {
      ...MD3LightTheme.fonts.labelMedium,
      fontFamily: "Inter_600SemiBold",
      fontSize: 12,
      letterSpacing: 0.35,
    },
  },
};
