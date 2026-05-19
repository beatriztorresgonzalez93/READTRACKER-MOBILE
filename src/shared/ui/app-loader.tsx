// Loader visual comun para estados de carga (gluestack-ui).
import { Box, Spinner } from "@gluestack-ui/themed";

import { APP_CREAM_BG } from "@/shared/ui/app-colors";

type AppLoaderProps = {
  /** Sustituye el fondo; por defecto crema Scriptorium. */
  backgroundColor?: string;
};

export function AppLoader({ backgroundColor = APP_CREAM_BG }: AppLoaderProps) {
  return (
    <Box flex={1} justifyContent="center" alignItems="center" bg={backgroundColor}>
      <Spinner size="large" color="$primary500" />
    </Box>
  );
}
