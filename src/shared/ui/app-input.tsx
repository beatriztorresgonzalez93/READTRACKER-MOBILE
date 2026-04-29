// Input reutilizable con etiqueta, error y estilos consistentes.
import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { useAppTheme } from "@/shared/ui/use-app-theme";

type AppInputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function AppInput({ label, error, style, ...props }: AppInputProps) {
  const theme = useAppTheme();
  const styles = StyleSheet.create({
    container: {
      gap: 6,
    },
    label: {
      fontWeight: "600",
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
    },
    inputError: {
      borderColor: theme.colors.danger,
    },
    error: {
      color: theme.colors.danger,
      fontSize: 12,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={[styles.input, style, error ? styles.inputError : undefined]} {...props} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}
