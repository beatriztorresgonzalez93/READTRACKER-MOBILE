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
      "La activación Pro con Stripe está disponible en la versión web.",
      [{ text: "Aceptar", onPress: onClose }]
    );
  }, [visible, onClose]);
  return null;
}
