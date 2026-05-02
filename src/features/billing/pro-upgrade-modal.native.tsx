import { Alert } from "react-native";
import { useEffect } from "react";

type ProUpgradeModalProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function ProUpgradeModal({ visible, onClose }: ProUpgradeModalProps) {
  useEffect(() => {
    if (!visible) return;
    Alert.alert(
      "Pago disponible en web",
      "La compra única de Pro (app completa para siempre) se completa con Stripe en la versión web.",
      [{ text: "Aceptar", onPress: onClose }]
    );
  }, [visible, onClose]);
  return null;
}
