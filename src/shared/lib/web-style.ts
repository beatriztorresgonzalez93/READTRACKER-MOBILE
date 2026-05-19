import { Platform, StyleSheet, type StyleProp, type ViewStyle } from "react-native";

/** En web, los arrays en `style` rompen el DOM (CSSStyleDeclaration). */
export function webFlattenStyle<T extends ViewStyle>(style: StyleProp<T>): StyleProp<T> {
  if (Platform.OS !== "web" || style == null) return style;
  return StyleSheet.flatten(style) as StyleProp<T>;
}
