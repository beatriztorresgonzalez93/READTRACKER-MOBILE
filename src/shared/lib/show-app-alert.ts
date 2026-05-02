// Alertas que funcionan en web (RN Alert es poco fiable en navegador).
import { Alert, Platform } from "react-native";

export function showAppAlert(title: string, message?: string): void {
  if (Platform.OS === "web") {
    const text = message?.trim() ? `${title}\n\n${message}` : title;
    globalThis.window?.alert(text);
    return;
  }
  if (message?.trim()) {
    Alert.alert(title, message);
  } else {
    Alert.alert(title);
  }
}
