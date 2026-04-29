// Hook para obtener el tema activo segun el sistema operativo.
import { useColorScheme } from "react-native";

import { getThemeByScheme } from "@/shared/ui/theme";

export function useAppTheme() {
  const colorScheme = useColorScheme();
  return getThemeByScheme(colorScheme);
}

