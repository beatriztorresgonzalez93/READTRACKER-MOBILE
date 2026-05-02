import { Alert, Platform } from "react-native";

/** Alertas simples que funcionan igual en nativo y en web (Alert en web a veces no se percibe bien). */
export function showPlaceholderAlert(title: string, message: string) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

export function showLegalDocsComingSoonAlert() {
  showPlaceholderAlert(
    "Próximamente",
    "Las condiciones de uso y la política de privacidad estarán publicadas aquí antes del lanzamiento oficial.",
  );
}

export function showNotificationsComingSoonAlert() {
  showPlaceholderAlert(
    "Próximamente",
    "Las notificaciones y recordatorios estarán disponibles en una próxima versión.",
  );
}
