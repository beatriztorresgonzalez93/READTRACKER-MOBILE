import { Platform } from "react-native";

/** Paleta Scriptorium (modo claro) — única fuente para layouts nativos y chrome. */
export const APP_CREAM_BG = "#F6F1E7";

/** Superficie de tarjetas sobre el fondo crema. */
export const APP_CARD_BG = "#FFFCF5";

export const scriptoriumColors = {
  bg: APP_CREAM_BG,
  bgPanel: "#EDE4D2",
  bgSoft: "#FFFFFF",
  card: APP_CARD_BG,
  cardElevated: "#FFFFFF",
  border: "#D8C9AE",
  borderOnCard: "#E5D9C2",
  text: "#2D1F15",
  textSoft: "#67503E",
  textMuted: "#7A6555",
  primary: "#A87D42",
  onPrimary: "#FFFFFF",
  primaryPressed: "#8F6836",
  accent: "#D8B56E",
  danger: "#B84040",
  webAccent: "#D14E72",
} as const;

/** Opciones de cabecera nativa del stack (perfil, ajustes, subpantallas de libro). */
export const scriptoriumNativeHeader = {
  headerStyle: { backgroundColor: APP_CREAM_BG },
  headerTintColor: scriptoriumColors.primary,
  headerTitleStyle: {
    color: scriptoriumColors.text,
    fontFamily: "Fraunces_700Bold",
    fontSize: 18,
  },
  headerShadowVisible: false as const,
  // Evita «(tabs)», «app-menu», etc. junto a la flecha en iOS.
  ...(Platform.OS === "ios"
    ? {
        headerBackTitle: "",
        headerBackTitleVisible: false,
        headerBackButtonDisplayMode: "minimal" as const,
      }
    : {}),
};
