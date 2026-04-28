import { View } from "react-native";

import { theme } from "@/shared/ui/theme";

/**
 * Pantalla vacia del slot central: el boton “+” usa `tabBarButton` en `_layout` y abre `books/new`.
 */
export default function AddBookTabScreen() {
  return <View style={{ flex: 1, backgroundColor: theme.colors.bg }} />;
}
