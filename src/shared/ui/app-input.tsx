// Input reutilizable con etiqueta, error y estilos consistentes.
import { useCallback } from "react";
import { Platform, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";

import { applyWebAutoCapitalize } from "@/shared/lib/apply-web-autocapitalize";
import { useAppTheme } from "@/shared/ui/use-app-theme";

type AppInputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function AppInput({ label, error, style, onChangeText, autoCapitalize, ...props }: AppInputProps) {
  const theme = useAppTheme();

  const handleChangeText = useCallback(
    (text: string) => {
      if (Platform.OS === "web" && autoCapitalize && autoCapitalize !== "none") {
        onChangeText?.(applyWebAutoCapitalize(text, autoCapitalize));
        return;
      }
      onChangeText?.(text);
    },
    [onChangeText, autoCapitalize],
  );
  const styles = StyleSheet.create({
    container: {
      gap: 6,
    },
    label: {
      fontFamily: "Fraunces_700Bold",
      color: theme.colors.textOnDark,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.borderOnCard,
      borderRadius: theme.radius.sm,
      backgroundColor: theme.colors.card,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: theme.colors.text,
      fontFamily: "Fraunces_400Regular",
    },
    inputError: {
      borderColor: theme.colors.danger,
    },
    error: {
      color: theme.colors.danger,
      fontSize: 12,
      fontFamily: "Fraunces_400Regular",
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, style, error ? styles.inputError : undefined]}
        autoCapitalize={autoCapitalize}
        onChangeText={handleChangeText}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}
