// Configura tabs principales y accesos rapidos de la seccion privada.
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { Tabs, useRouter } from "expo-router";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { ScriptoriumHeader } from "@/shared/ui/scriptorium-header";
import { useAppTheme } from "@/shared/ui/use-app-theme";

function AddBookCenterButton(_props: BottomTabBarButtonProps) {
  const theme = useAppTheme();
  const router = useRouter();
  const styles = StyleSheet.create({
    addSlot: {
      flex: 1,
      alignItems: "center",
      justifyContent: "flex-start",
      paddingTop: 2,
    },
    addCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      marginTop: -26,
      backgroundColor: theme.colors.bgPanel,
      borderWidth: 2,
      borderColor: theme.colors.accent,
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOpacity: 0.35,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
        },
        android: { elevation: 8 },
      }),
    },
    addCirclePressed: {
      opacity: 0.9,
    },
  });

  return (
    <View style={styles.addSlot}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Añadir libro"
        onPress={() => router.push("/(app)/books/new")}
        style={({ pressed }) => [styles.addCircle, pressed && styles.addCirclePressed]}
      >
        <Ionicons name="add" size={32} color={theme.colors.accent} />
      </Pressable>
    </View>
  );
}

export default function AppTabsLayout() {
  const theme = useAppTheme();
  const isWeb = Platform.OS === "web";
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: () => <ScriptoriumHeader />,
        headerShadowVisible: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textMutedOnDark,
        tabBarPosition: "bottom",
        tabBarStyle: {
          backgroundColor: theme.colors.bgPanel,
          borderTopColor: theme.colors.border,
          height: 72,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        sceneStyle: isWeb
          ? {
              maxWidth: 1200,
              width: "100%",
              alignSelf: "center",
            }
          : undefined,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Biblioteca",
          headerTransparent: true,
          tabBarIcon: ({ color, size }) => <Ionicons name="library-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Historial",
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color} size={size} />,
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
          title: "Estadisticas",
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: "Wishlist",
          tabBarIcon: ({ color, size }) => <Ionicons name="heart-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="purchases"
        options={{
          title: "Compras",
          href: null,
          tabBarIcon: ({ color, size }) => <Ionicons name="cart-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
