// Scroll + pie de formulario de libro con teclado (iOS y Android).
import { useHeaderHeight } from "@react-navigation/elements";
import {
  createContext,
  useContext,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type RefObject,
} from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
} from "react-native";

import { AppInput } from "@/shared/ui/app-input";
import { scrollFieldIntoView } from "@/shared/ui/scroll-field-into-view";

type BookFormScrollContextValue = {
  scrollRef: RefObject<ScrollView | null>;
  scrollViewportRef: RefObject<View | null>;
  scrollViewportHeight: number;
  scrollOffsetYRef: RefObject<number>;
};

const BookFormScrollContext = createContext<BookFormScrollContextValue | null>(null);

export function useBookFormScroll() {
  const ctx = useContext(BookFormScrollContext);
  if (!ctx) {
    throw new Error("useBookFormScroll debe usarse dentro de BookFormLayout");
  }
  return ctx;
}

type BookFormInputProps = ComponentProps<typeof AppInput>;

/** Campo de texto con scroll al enfocar para que no quede bajo el teclado. */
export function BookFormInput({ onFocus, ...props }: BookFormInputProps) {
  const fieldRef = useRef<View>(null);
  const scrollOnFocus = useScrollBookFieldOnFocus(fieldRef);

  return (
    <View ref={fieldRef} collapsable={false}>
      <AppInput
        {...props}
        onFocus={(event) => {
          scrollOnFocus();
          onFocus?.(event);
        }}
      />
    </View>
  );
}

/** Campo multilínea con scroll al enfocar (sinopsis, reseña, etc.). */
export function BookFormMultilineInput({ onFocus, ...props }: BookFormInputProps) {
  const fieldRef = useRef<View>(null);
  const scrollOnFocus = useScrollBookFieldOnFocus(fieldRef);

  return (
    <View ref={fieldRef} collapsable={false}>
      <AppInput
        {...props}
        multiline
        onFocus={(event) => {
          scrollOnFocus();
          onFocus?.(event);
        }}
      />
    </View>
  );
}

export function useScrollBookFieldOnFocus(fieldRef: RefObject<View | null>, bottomInset = 32) {
  const { scrollRef, scrollViewportRef, scrollViewportHeight, scrollOffsetYRef } =
    useBookFormScroll();

  return () => {
    scrollFieldIntoView(
      scrollRef,
      scrollViewportRef,
      fieldRef,
      scrollViewportHeight,
      scrollOffsetYRef.current ?? 0,
      {
        bottomInset,
        delayMs: Platform.OS === "android" ? 220 : 160,
      },
    );
  };
}

type BookFormLayoutProps = {
  scrollRef: RefObject<ScrollView | null>;
  children: ReactNode;
  footer: ReactNode;
  scrollProps?: Omit<ScrollViewProps, "ref" | "children">;
};

export function BookFormLayout({ scrollRef, children, footer, scrollProps }: BookFormLayoutProps) {
  const headerHeight = useHeaderHeight();
  const scrollViewportRef = useRef<View>(null);
  const scrollOffsetYRef = useRef(0);
  const [scrollViewportHeight, setScrollViewportHeight] = useState(0);
  const { contentContainerStyle, onScroll, ...restScrollProps } = scrollProps ?? {};

  /** Solo un poco de aire bajo el último campo; no duplicar la altura del teclado (eso vacía el scroll). */
  const scrollBottomPad = 24;

  const contextValue: BookFormScrollContextValue = {
    scrollRef,
    scrollViewportRef,
    scrollViewportHeight,
    scrollOffsetYRef,
  };

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    scrollOffsetYRef.current = event.nativeEvent.contentOffset.y;
    onScroll?.(event);
  }

  return (
    <BookFormScrollContext.Provider value={contextValue}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        enabled={Platform.OS === "ios"}
        keyboardVerticalOffset={headerHeight}
      >
        <View ref={scrollViewportRef} style={{ flex: 1 }} collapsable={false}>
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets={false}
            scrollEventThrottle={16}
            onScroll={handleScroll}
            onLayout={(event) => {
              setScrollViewportHeight(event.nativeEvent.layout.height);
            }}
            contentContainerStyle={[
              { paddingBottom: scrollBottomPad, flexGrow: 0 },
              contentContainerStyle,
            ]}
            {...restScrollProps}
          >
            <View collapsable={false}>{children}</View>
          </ScrollView>
          {footer}
        </View>
      </KeyboardAvoidingView>
    </BookFormScrollContext.Provider>
  );
}
