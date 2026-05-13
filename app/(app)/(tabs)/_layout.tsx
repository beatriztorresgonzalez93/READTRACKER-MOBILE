// Configura tabs principales y accesos rapidos de la seccion privada.
import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import * as SystemUI from "expo-system-ui";
import { Tabs, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScriptoriumHeader } from "@/shared/ui/scriptorium-header";
import { useAppTheme } from "@/shared/ui/use-app-theme";

function AddBookCenterButton(_props: BottomTabBarButtonProps) {
  const theme = useAppTheme();
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  /** Seis pestañas visibles: el hueco del + está en 7/12 del ancho; el centro real es 6/12 → desplazamos −ancho/12. */
  const centerNudgeX = -windowWidth / 12;

  return (
    <View style={[nativeStyles.addSlot, { transform: [{ translateX: centerNudgeX }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Añadir libro"
        onPress={() => router.push("/(app)/books/new")}
        style={({ pressed }) => [
          nativeStyles.addCircle,
          { backgroundColor: theme.colors.primary },
          pressed && nativeStyles.addCirclePressed,
        ]}
      >
        <Ionicons name="add" size={28} color={theme.colors.onPrimary} />
      </Pressable>
    </View>
  );
}

function NativeHeaderRight() {
  const theme = useAppTheme();
  const router = useRouter();

  return (
    <View style={nativeStyles.headerRight}>
      <Pressable
        onPress={() => router.push("/(app)/app-menu" as never)}
        hitSlop={10}
        accessibilityLabel="Más opciones y ajustes"
      >
        <View style={[nativeStyles.headerGearWrap, { backgroundColor: theme.colors.bgPanel }]}>
          <Ionicons name="settings-outline" size={22} color={theme.colors.primary} />
        </View>
      </Pressable>
    </View>
  );
}

export default function AppTabsLayout() {
  const theme = useAppTheme();
  const isWeb = Platform.OS === "web";
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (Platform.OS === "android") {
      void SystemUI.setBackgroundColorAsync(theme.colors.bgSoft);
    }
  }, [theme.colors.bgSoft]);

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
                  backgroundColor: theme.colors.bgSoft,
                  elevation: 0,
                  shadowOpacity: 0,
                  borderBottomWidth: 0,
                },
                headerTitleStyle: {
                  fontFamily: "Fraunces_700Bold",
                  fontSize: 26,
                  color: theme.colors.text,
                },
                headerTitleAlign: "left",
                headerRight: () => <NativeHeaderRight />,
              }),
          headerShadowVisible: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textMutedOnDark,
          tabBarPosition: "bottom",
          tabBarStyle: isWeb
            ? {
                backgroundColor: theme.colors.bgPanel,
                borderTopColor: theme.colors.border,
                height: 72,
                paddingTop: 8,
                paddingBottom: 10,
              }
            : {
                backgroundColor: theme.colors.bgSoft,
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
          name="add"
          options={{
            title: "",
            tabBarLabel: () => null,
            tabBarIcon: () => null,
            tabBarButton: (props) => <AddBookCenterButton {...props} />,
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
  addSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 0,
  },
  addCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginTop: -22,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 6 },
    }),
  },
  addCirclePressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
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
    borderColor: "#D8C9AE",
  },
});
