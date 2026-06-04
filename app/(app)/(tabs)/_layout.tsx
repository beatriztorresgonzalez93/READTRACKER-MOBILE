// Configura tabs principales y accesos rapidos de la seccion privada.
import { Ionicons } from "@expo/vector-icons";
import * as SystemUI from "expo-system-ui";
import { Tabs, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { APP_CREAM_BG, scriptoriumColors } from "@/shared/ui/app-colors";
import { ScriptoriumHeader } from "@/shared/ui/scriptorium-header";

function NativeHeaderRight() {
  const router = useRouter();

  return (
    <View style={nativeStyles.headerRight}>
      <Pressable
        onPress={() => router.push("/(app)/app-menu" as never)}
        hitSlop={10}
        accessibilityLabel="Ajustes"
      >
        <View style={nativeStyles.headerGearWrap}>
          <Ionicons name="settings-outline" size={22} color={scriptoriumColors.primary} />
        </View>
      </Pressable>
    </View>
  );
}

export default function AppTabsLayout() {
  const isWeb = Platform.OS === "web";
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (Platform.OS === "android") {
      void SystemUI.setBackgroundColorAsync(APP_CREAM_BG);
    }
  }, []);

  return (
    <>
      {!isWeb ? <StatusBar style="dark" /> : null}
      <Tabs
        screenOptions={{
          headerShown: true,
          ...(isWeb
            ? {
                header: () => <ScriptoriumHeader />,
              }
            : {
                headerStyle: {
                  backgroundColor: APP_CREAM_BG,
                  elevation: 0,
                  shadowOpacity: 0,
                  borderBottomWidth: 0,
                },
                headerTitleStyle: {
                  fontFamily: "Fraunces_700Bold",
                  fontSize: 26,
                  color: scriptoriumColors.text,
                },
                headerTitleAlign: "left",
                headerRight: () => <NativeHeaderRight />,
              }),
          headerShadowVisible: false,
          tabBarActiveTintColor: scriptoriumColors.primary,
          tabBarInactiveTintColor: scriptoriumColors.textMuted,
          tabBarPosition: "bottom",
          tabBarStyle: isWeb
            ? {
                backgroundColor: scriptoriumColors.bgPanel,
                borderTopColor: scriptoriumColors.border,
                height: 72,
                paddingTop: 8,
                paddingBottom: 10,
              }
            : {
                backgroundColor: APP_CREAM_BG,
                borderTopWidth: 0,
                elevation: 0,
                shadowOpacity: 0,
                height: 60 + Math.max(insets.bottom, 4),
                paddingTop: 6,
                paddingBottom: Math.max(insets.bottom, 6),
              },
          tabBarLabelStyle: isWeb
            ? { fontSize: 11, fontWeight: "600" }
            : { fontSize: 10, fontFamily: "Fraunces_700Bold", letterSpacing: 0.3 },
          sceneStyle: isWeb ? { width: "100%" } : undefined,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Inicio",
            headerTransparent: isWeb,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={Platform.OS === "web" ? "home-outline" : "home"} color={color} size={isWeb ? size : 24} />
            ),
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: "Biblioteca",
            headerTransparent: isWeb,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={Platform.OS === "web" ? "library-outline" : "library"} color={color} size={isWeb ? size : 24} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: "Historial",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={Platform.OS === "web" ? "calendar-outline" : "calendar"} color={color} size={isWeb ? size : 24} />
            ),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: "Estadísticas",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={Platform.OS === "web" ? "bar-chart-outline" : "bar-chart"} color={color} size={isWeb ? size : 24} />
            ),
          }}
        />
        <Tabs.Screen
          name="wishlist"
          options={{
            title: "Wishlist",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={Platform.OS === "web" ? "heart-outline" : "heart"} color={color} size={isWeb ? size : 24} />
            ),
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="purchases"
          options={{
            title: "Compras",
            href: null,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cart-outline" color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}

const nativeStyles = StyleSheet.create({
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingRight: 16,
  },
  headerGearWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: scriptoriumColors.border,
    backgroundColor: scriptoriumColors.bgPanel,
  },
});
