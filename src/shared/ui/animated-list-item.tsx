import { type ReactNode } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import Animated, { FadeInDown, FadeOutLeft } from "react-native-reanimated";

export type AnimatedListItemProps = {
  children: ReactNode;
  /** Índice en la lista para escalonar la entrada (máx. `maxStaggerIndex`). */
  index?: number;
  style?: StyleProp<ViewStyle>;
  enteringDelayMs?: number;
  enteringDurationMs?: number;
  maxStaggerIndex?: number;
};

/**
 * Envuelve filas de lista con animaciones en el UI Thread (Reanimated).
 * Evita bloqueos del JS Thread frente a la Animated API clásica de React Native.
 */
export function AnimatedListItem({
  children,
  index = 0,
  style,
  enteringDelayMs = 24,
  enteringDurationMs = 220,
  maxStaggerIndex = 12,
}: AnimatedListItemProps) {
  const stagger = Math.min(index, maxStaggerIndex) * enteringDelayMs;

  return (
    <Animated.View
      entering={FadeInDown.delay(stagger).duration(enteringDurationMs)}
      exiting={FadeOutLeft.duration(160)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
