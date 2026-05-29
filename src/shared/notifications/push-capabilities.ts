import Constants from "expo-constants";
import { Platform } from "react-native";

/** Expo Go (SDK 53+) no soporta push remotas en Android; hace falta development build. */
export function canRegisterRemotePush(): boolean {
  if (Platform.OS === "web") return false;
  return Constants.appOwnership !== "expo";
}

export function isExpoGoClient(): boolean {
  return Constants.appOwnership === "expo";
}
