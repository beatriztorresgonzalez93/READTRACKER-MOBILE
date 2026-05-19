// Boton reutilizable basado en gluestack-ui (misma apariencia en iOS y Android).
import {
  Button,
  ButtonSpinner,
  ButtonText,
} from "@gluestack-ui/themed";
import type { ComponentProps } from "react";

type AppButtonProps = Omit<ComponentProps<typeof Button>, "children" | "variant"> & {
  label: string;
  appearance?: "primary" | "secondary";
  isLoading?: boolean;
};

export function AppButton({
  label,
  appearance = "primary",
  isLoading = false,
  isDisabled,
  ...props
}: AppButtonProps) {
  const disabled = isDisabled || isLoading;

  return (
    <Button
      size="lg"
      variant={appearance === "primary" ? "solid" : "outline"}
      action="primary"
      isDisabled={disabled}
      borderRadius="$lg"
      {...props}
    >
      {isLoading ? <ButtonSpinner mr="$2" /> : null}
      <ButtonText>{label}</ButtonText>
    </Button>
  );
}
