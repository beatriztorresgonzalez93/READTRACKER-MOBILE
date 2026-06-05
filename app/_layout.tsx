// Define providers globales de la app, fuentes y navegacion raiz.
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { Fraunces_400Regular, Fraunces_700Bold } from "@expo-google-fonts/fraunces";
import { Platform, StyleSheet, Text, TextInput } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { AppProviders } from "@/providers/app-providers";
import { setupNotifications } from "@/shared/notifications/setup-notifications";

setupNotifications();

const defaultTextStyle = { fontFamily: "Fraunces_400Regular" as const };

function mergeDefaultStyle(existing: unknown) {
  return StyleSheet.flatten([defaultTextStyle, existing]);
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  // Fuente global Fraunces solo en nativo; en web defaultProps.style rompe el DOM.
  if (Platform.OS !== "web") {
    const TextWithDefaults = Text as typeof Text & { defaultProps?: { style?: unknown } };
    const TextInputWithDefaults = TextInput as typeof TextInput & { defaultProps?: { style?: unknown } };
    TextWithDefaults.defaultProps = TextWithDefaults.defaultProps || {};
    TextWithDefaults.defaultProps.style = mergeDefaultStyle(TextWithDefaults.defaultProps.style);
    TextInputWithDefaults.defaultProps = TextInputWithDefaults.defaultProps || {};
    TextInputWithDefaults.defaultProps.style = mergeDefaultStyle(TextInputWithDefaults.defaultProps.style);
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProviders>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
        <StatusBar style="auto" />
      </AppProviders>
    </GestureHandlerRootView>
  );
}
