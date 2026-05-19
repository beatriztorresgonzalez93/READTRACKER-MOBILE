// Tab puente que redirige al flujo de crear libro.
import { View } from "react-native";

import { APP_CREAM_BG } from "@/shared/ui/app-colors";

/**
 * Pantalla vacia del slot central: el boton “+” usa `tabBarButton` en `_layout` y abre `books/new`.
 */
export default function AddBookTabScreen() {
  return <View style={{ flex: 1, backgroundColor: APP_CREAM_BG }} />;
}
