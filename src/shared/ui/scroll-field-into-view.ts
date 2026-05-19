// Desplaza el scroll para dejar visible un campo (sin measureLayout / refs nativos).
import type { RefObject } from "react";
import type { ScrollView, View } from "react-native";

type ScrollFieldOptions = {
  /** Espacio libre bajo el campo dentro del área visible del scroll. */
  bottomInset?: number;
  delayMs?: number;
};

export function scrollFieldIntoView(
  scrollRef: RefObject<ScrollView | null>,
  scrollViewportRef: RefObject<View | null>,
  fieldRef: RefObject<View | null>,
  scrollViewportHeight: number,
  scrollOffsetY: number,
  options?: ScrollFieldOptions,
) {
  const { bottomInset = 24, delayMs = 160 } = options ?? {};

  setTimeout(() => {
    const scroll = scrollRef.current;
    const viewport = scrollViewportRef.current;
    const field = fieldRef.current;
    if (!scroll || !viewport || !field || scrollViewportHeight <= 0) return;

    field.measureInWindow((_fieldX, fieldY, _fieldW, fieldH) => {
      viewport.measureInWindow((_scrollX, scrollY, _scrollW, _scrollH) => {
        const fieldBottomInViewport = fieldY + fieldH - scrollY;
        const maxVisibleBottom = scrollViewportHeight - bottomInset;
        const overflow = fieldBottomInViewport - maxVisibleBottom;
        if (overflow <= 0) return;

        scroll.scrollTo({
          y: Math.max(0, scrollOffsetY + overflow),
          animated: true,
        });
      });
    });
  }, delayMs);
}
