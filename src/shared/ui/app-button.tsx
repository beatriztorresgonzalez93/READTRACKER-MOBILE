// Boton reutilizable de la app con estilos del sistema de tema.
import { Pressable, StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { useAppTheme } from "@/shared/ui/use-app-theme";

type AppButtonProps = Omit<PressableProps, "style"> & {
  label: string;
  variant?: "primary" | "secondary";
  containerStyle?: StyleProp<ViewStyle>;
};

export function AppButton({ label, variant = "primary", containerStyle, ...props }: AppButtonProps) {
  const theme = useAppTheme();
  const styles = StyleSheet.create({
    base: {
      borderRadius: theme.radius.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    primary: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    secondary: {
      backgroundColor: "transparent",
      borderColor: theme.colors.accent,
    },
    pressed: {
      opacity: 0.9,
    },
    primaryLabel: {
      color: theme.colors.onPrimary,
      fontFamily: "Fraunces_700Bold",
    },
    secondaryLabel: {
      color: theme.colors.textOnDark,
      fontFamily: "Fraunces_700Bold",
    },
  });

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        variant === "primary" ? styles.primary : styles.secondary,
        pressed && styles.pressed,
        containerStyle,
      ]}
      {...props}
    >
      <Text style={variant === "primary" ? styles.primaryLabel : styles.secondaryLabel}>{label}</Text>
    </Pressable>
  );
}
