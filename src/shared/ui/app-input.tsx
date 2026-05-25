// Input reutilizable basado en gluestack-ui (misma apariencia en iOS y Android).
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
  Input,
  InputField,
} from "@gluestack-ui/themed";
import { useCallback } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { applyWebAutoCapitalize } from "@/shared/lib/apply-web-autocapitalize";

const FIELD_GAP = 24;

const multilineStyles = StyleSheet.create({
  wrapper: {
    width: "100%",
    marginBottom: FIELD_GAP,
  },
  wrapperNoMargin: {
    width: "100%",
    marginBottom: 0,
  },
  label: {
    fontSize: 14,
    color: "#2D1F15",
    marginBottom: 6,
  },
  textarea: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: "#D8C9AE",
    borderRadius: 12,
    backgroundColor: "#FFFCF5",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    lineHeight: 22,
    color: "#2D1F15",
  },
});

type AppInputProps = TextInputProps & {
  label: string;
  error?: string;
  /** Oculta la etiqueta visible (p. ej. cuando ya hay un BookSheetLabel encima). */
  hideLabel?: boolean;
  /** Sin margen inferior (p. ej. fila de etiquetas junto a un botón). */
  noMargin?: boolean;
};

/** Gluestack InputField no siempre aplica secureTextEntry; en web hace falta type=password. */
function maskedTextProps(secureTextEntry?: boolean) {
  if (!secureTextEntry) {
    return {};
  }
  return {
    secureTextEntry: true as const,
    ...(Platform.OS === "web" ? { type: "password" as const } : {}),
  };
}

export function AppInput({
  label,
  error,
  hideLabel = false,
  noMargin = false,
  onChangeText,
  autoCapitalize,
  multiline,
  style,
  secureTextEntry,
  ...props
}: AppInputProps) {
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

  if (multiline) {
    return (
      <View style={noMargin ? multilineStyles.wrapperNoMargin : multilineStyles.wrapper}>
        {!hideLabel ? <Text style={multilineStyles.label}>{label}</Text> : null}
        <TextInput
          multiline
          textAlignVertical="top"
          autoCapitalize={autoCapitalize}
          onChangeText={handleChangeText}
          placeholderTextColor="#9A8B7A"
          style={[multilineStyles.textarea, style]}
          {...props}
          {...maskedTextProps(secureTextEntry)}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  }

  const labelNode = hideLabel ? null : (
    <FormControlLabel mb="$1">
      <FormControlLabelText size="sm" color="$textLight900">
        {label}
      </FormControlLabelText>
    </FormControlLabel>
  );

  const errorNode = error ? (
    <FormControlError mt="$1">
      <FormControlErrorText size="xs">{error}</FormControlErrorText>
    </FormControlError>
  ) : null;

  const fieldMargin = noMargin ? undefined : { marginBottom: FIELD_GAP };

  return (
    <FormControl isInvalid={Boolean(error)} style={fieldMargin}>
      {labelNode}
      <Input size="lg" variant="outline" borderRadius="$lg" bg="$backgroundLight50">
        <InputField
          autoCapitalize={autoCapitalize}
          onChangeText={handleChangeText}
          color="$textLight900"
          placeholderTextColor="$textLight500"
          style={style}
          {...props}
          {...maskedTextProps(secureTextEntry)}
        />
      </Input>
      {errorNode}
    </FormControl>
  );
}

const styles = StyleSheet.create({
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: "#B3261E",
  },
});
