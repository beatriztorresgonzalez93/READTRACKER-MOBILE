// Define providers globales de la app, fuentes y navegacion raiz.
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { Fraunces_400Regular, Fraunces_700Bold } from "@expo-google-fonts/fraunces";
import { Text, TextInput } from "react-native";
import "react-native-reanimated";

import { AppProviders } from "@/providers/app-providers";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  // Fuerza Fraunces como fuente base global.
  const TextWithDefaults = Text as typeof Text & { defaultProps?: { style?: unknown } };
  const TextInputWithDefaults = TextInput as typeof TextInput & { defaultProps?: { style?: unknown } };
  TextWithDefaults.defaultProps = TextWithDefaults.defaultProps || {};
  TextWithDefaults.defaultProps.style = [{ fontFamily: "Fraunces_400Regular" }, TextWithDefaults.defaultProps.style];
  TextInputWithDefaults.defaultProps = TextInputWithDefaults.defaultProps || {};
  TextInputWithDefaults.defaultProps.style = [{ fontFamily: "Fraunces_400Regular" }, TextInputWithDefaults.defaultProps.style];

  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
      <StatusBar style="auto" />
    </AppProviders>
  );
}
