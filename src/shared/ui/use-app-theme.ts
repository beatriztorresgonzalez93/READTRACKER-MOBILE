import { useColorScheme } from "react-native";

import { getThemeByScheme } from "@/shared/ui/theme";

export function useAppTheme() {
  const colorScheme = useColorScheme();
  return getThemeByScheme(colorScheme);
}

