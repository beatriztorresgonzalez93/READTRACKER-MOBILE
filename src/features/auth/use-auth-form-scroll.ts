// Scroll del formulario auth cuando el teclado puede tapar el campo contraseña.
import { useCallback, useRef } from "react";
import { Platform, ScrollView } from "react-native";

export function useAuthFormScroll() {
  const scrollRef = useRef<ScrollView>(null);

  const scrollPasswordFieldIntoView = useCallback(() => {
    const scroll = () => scrollRef.current?.scrollToEnd({ animated: true });
    requestAnimationFrame(() => {
      scroll();
      setTimeout(scroll, Platform.OS === "android" ? 120 : 60);
      setTimeout(scroll, 280);
    });
  }, []);

  return { scrollRef, scrollPasswordFieldIntoView };
}
