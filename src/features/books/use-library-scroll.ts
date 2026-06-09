// Scroll de la biblioteca: ref de lista y botón volver arriba.
import { useCallback, useRef, useState } from "react";
import type { FlatList } from "react-native";

import type { Book } from "@/shared/types/books";

const SCROLL_TO_TOP_THRESHOLD = 520;

export function useLibraryScroll() {
  const listRef = useRef<FlatList<Book>>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const onListScroll = useCallback((offsetY: number) => {
    const next = offsetY > SCROLL_TO_TOP_THRESHOLD;
    setShowScrollTop((prev) => (prev === next ? prev : next));
  }, []);

  return { listRef, showScrollTop, scrollToTop, onListScroll };
}
