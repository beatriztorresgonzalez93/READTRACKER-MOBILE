import { Pressable } from "@gluestack-ui/themed";
import { useRouter, type Href } from "expo-router";
import { Link } from "expo-router";
import type { ReactNode } from "react";
import { Platform, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

import { webFlattenStyle } from "@/shared/lib/web-style";

type AppLinkProps = Omit<PressableProps, "children"> & {
  href: Href;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * En web evita `<a>` de expo-router (provoca error CSSStyleDeclaration con estilos en array).
 * En nativo delega en Link + asChild.
 */
export function AppLink({ href, children, style, onPress, ...rest }: AppLinkProps) {
  const router = useRouter();
  const flatStyle = webFlattenStyle(style);

  if (Platform.OS === "web") {
    return (
      <Pressable
        style={flatStyle}
        onPress={(event) => {
          onPress?.(event);
          if (!event.defaultPrevented) {
            router.push(href);
          }
        }}
        {...rest}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <Link href={href} asChild>
      <Pressable style={style} onPress={onPress} {...rest}>
        {children}
      </Pressable>
    </Link>
  );
}
