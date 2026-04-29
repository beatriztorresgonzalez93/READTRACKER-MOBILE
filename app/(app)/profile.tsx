// Pantalla de perfil para ver y actualizar datos del usuario.
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/features/auth/use-auth";
import { theme } from "@/shared/ui/theme";

export default function ProfileSheetScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, updateUserProfile } = useAuth();

  const fullName = useMemo(() => {
    const fromParts = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
    if (fromParts) {
      return fromParts;
    }
    return user?.name?.trim() || "Lector/a";
  }, [user?.firstName, user?.lastName, user?.name]);

  const firstName = user?.firstName?.trim() || fullName.split(" ")[0] || "";
  const lastName = user?.lastName?.trim() || fullName.split(" ").slice(1).join(" ");
  const [firstNameDraft, setFirstNameDraft] = useState(firstName);
  const [lastNameDraft, setLastNameDraft] = useState(lastName);
  const [avatarUrlDraft, setAvatarUrlDraft] = useState<string | null>(user?.avatarUrl ?? null);
  const [saving, setSaving] = useState(false);
  const memberSince = useMemo(() => {
    const source =
      user?.createdAt ??
      user?.created_at ??
      user?.registeredAt ??
      user?.registered_at;
    if (!source) return "No disponible";
    const date = new Date(source);
    if (Number.isNaN(date.getTime())) return "No disponible";
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, [user?.createdAt, user?.created_at, user?.registeredAt, user?.registered_at]);

  async function onLogout() {
    await logout();
    router.replace("/(auth)/login" as never);
  }

  async function onPhotoAction(action: "change" | "remove") {
    if (action === "remove") {
      setAvatarUrlDraft(null);
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permiso requerido", "Necesitamos permiso para acceder a tus fotos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setAvatarUrlDraft(result.assets[0].uri);
    }
  }

  async function onSave() {
    if (saving) return;
    setSaving(true);
    try {
      const normalizedFirstName = firstNameDraft.trim();
      const normalizedLastName = lastNameDraft.trim();
      await updateUserProfile({
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        name: [normalizedFirstName, normalizedLastName].filter(Boolean).join(" ").trim(),
        avatarUrl: avatarUrlDraft,
      });
      Alert.alert("Perfil actualizado", "Tus cambios se han guardado.");
    } catch (error) {
      Alert.alert("No se pudo guardar", (error as Error).message || "Intentalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Tu ficha</Text>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Cerrar ficha">
            <Ionicons name="close" size={26} color={theme.colors.text} />
          </Pressable>
        </View>
        <Text style={styles.sheetSubtitle}>
          Datos de tu cuenta en Scriptorium. El correo no se puede cambiar aqui.
        </Text>
        <View style={styles.separator} />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <View style={styles.avatarWrap}>
              {avatarUrlDraft ? (
                <Image source={{ uri: avatarUrlDraft }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <Ionicons name="person" size={56} color={theme.colors.textSoft} />
              )}
            </View>
            <View style={styles.avatarActions}>
              <Pressable onPress={() => onPhotoAction("change")} hitSlop={8}>
                <Text style={styles.actionText}>Cambiar foto</Text>
              </Pressable>
              <Pressable onPress={() => onPhotoAction("remove")} hitSlop={8}>
                <Text style={styles.actionText}>Quitar foto</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>NOMBRE</Text>
            <TextInput
              value={firstNameDraft}
              onChangeText={setFirstNameDraft}
              editable={!saving}
              style={styles.input}
              placeholderTextColor={theme.colors.textSoft}
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>APELLIDOS</Text>
            <TextInput
              value={lastNameDraft}
              onChangeText={setLastNameDraft}
              editable={!saving}
              style={styles.input}
              placeholderTextColor={theme.colors.textSoft}
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>CORREO</Text>
            <TextInput value={user?.email ?? ""} editable={false} style={styles.input} placeholderTextColor={theme.colors.textSoft} />
          </View>

          <View style={styles.memberCard}>
            <Text style={styles.memberTitle}>Miembro desde: {memberSince}</Text>
            <Text style={styles.memberSubtitle}>Fecha de alta de la cuenta: {memberSince}</Text>
          </View>

          <Pressable style={styles.logoutBtn} onPress={onLogout}>
            <Text style={styles.logoutText}>Cerrar sesion</Text>
          </Pressable>
          <Pressable style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={onSave} disabled={saving}>
            <Text style={styles.saveText}>{saving ? "Guardando..." : "Guardar cambios"}</Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    paddingHorizontal: 10,
  },
  sheet: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderColor: "#BE9A6A",
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sheetTitle: {
    fontSize: 42,
    fontFamily: "Fraunces_700Bold",
    color: theme.colors.text,
  },
  sheetSubtitle: {
    marginTop: 8,
    fontSize: 17,
    lineHeight: 26,
    fontFamily: "Fraunces_400Regular",
    color: theme.colors.textSoft,
    paddingRight: 20,
  },
  separator: {
    marginTop: 14,
    height: 1,
    backgroundColor: theme.colors.borderOnCard,
  },
  content: {
    paddingTop: 14,
    paddingBottom: 20,
    gap: 14,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 22,
  },
  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#D8CCB7",
    borderWidth: 2,
    borderColor: "#A67B4D",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarActions: {
    gap: 14,
  },
  actionText: {
    fontSize: 19,
    color: "#8C5E35",
    fontFamily: "Fraunces_700Bold",
  },
  fieldBlock: {
    gap: 8,
  },
  label: {
    color: "#7A5C47",
    fontFamily: "Fraunces_700Bold",
    letterSpacing: 1.6,
    fontSize: 13,
  },
  input: {
    backgroundColor: "#F9F4EA",
    borderWidth: 1,
    borderColor: "#CDA97A",
    borderRadius: 14,
    color: theme.colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 17,
    fontFamily: "Fraunces_400Regular",
  },
  memberCard: {
    marginTop: 8,
    backgroundColor: "#EEE2D1",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D2BA97",
    padding: 14,
    gap: 6,
  },
  memberTitle: {
    color: "#6F4F3A",
    fontFamily: "Fraunces_700Bold",
    fontSize: 18,
  },
  memberSubtitle: {
    color: "#775C4A",
    fontSize: 15,
    fontFamily: "Fraunces_400Regular",
  },
  logoutBtn: {
    marginTop: 4,
    backgroundColor: theme.colors.bgPanel,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  logoutText: {
    color: theme.colors.textOnDark,
    fontFamily: "Fraunces_700Bold",
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveBtnDisabled: {
    opacity: 0.65,
  },
  saveText: {
    color: theme.colors.onPrimary,
    fontFamily: "Fraunces_700Bold",
    fontSize: 16,
  },
});
