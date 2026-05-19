// Perfil: ver y actualizar datos del usuario (gluestack-ui).
import { Ionicons } from "@expo/vector-icons";
import {
  Box,
  Heading,
  HStack,
  Pressable,
  ScrollView,
  Text,
  VStack,
} from "@gluestack-ui/themed";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";
import { useLayoutEffect, useMemo, useState } from "react";
import { Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/features/auth/use-auth";
import { getFirebaseAuth } from "@/shared/config/firebase";
import {
  avatarUriNeedsPrepare,
  compressAvatarPickerAsset,
  prepareAvatarUrlForFirestore,
} from "@/shared/lib/upload-profile-avatar";
import { AppButton } from "@/shared/ui/app-button";
import { AppInput } from "@/shared/ui/app-input";
import { APP_CREAM_BG, scriptoriumNativeHeader } from "@/shared/ui/app-colors";
import { Screen } from "@/shared/ui/screen";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, token, logout, updateUserProfile } = useAuth();

  useLayoutEffect(() => {
    if (Platform.OS === "web") return;
    navigation.setOptions({
      title: "Perfil",
      ...scriptoriumNativeHeader,
    });
  }, [navigation]);

  const fullName = useMemo(() => {
    const fromParts = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
    if (fromParts) return fromParts;
    return user?.name?.trim() || "Lector/a";
  }, [user?.firstName, user?.lastName, user?.name]);

  const firstName = user?.firstName?.trim() || fullName.split(" ")[0] || "";
  const lastName = user?.lastName?.trim() || fullName.split(" ").slice(1).join(" ");
  const [firstNameDraft, setFirstNameDraft] = useState(firstName);
  const [lastNameDraft, setLastNameDraft] = useState(lastName);
  const [avatarUrlDraft, setAvatarUrlDraft] = useState<string | null>(user?.avatarUrl ?? null);
  const [avatarMimeDraft, setAvatarMimeDraft] = useState<string | null>(null);
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

  function closeProfile() {
    if (router.canDismiss()) {
      router.dismiss();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(app)/(tabs)/home" as never);
    }
  }

  async function onLogout() {
    await logout();
    router.replace("/(auth)/login" as never);
  }

  async function onPhotoAction(action: "change" | "remove") {
    if (action === "remove") {
      setAvatarUrlDraft(null);
      setAvatarMimeDraft(null);
      return;
    }

    if (Platform.OS !== "web") {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permiso requerido", "Necesitamos permiso para acceder a tus fotos.");
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      try {
        const dataUrl = await compressAvatarPickerAsset(result.assets[0].uri);
        setAvatarUrlDraft(dataUrl);
        setAvatarMimeDraft(null);
      } catch (error) {
        Alert.alert("No se pudo usar la foto", (error as Error).message);
      }
    }
  }

  async function onSave() {
    if (saving) return;
    setSaving(true);
    try {
      const normalizedFirstName = firstNameDraft.trim();
      const normalizedLastName = lastNameDraft.trim();
      let avatarUrlToSave = avatarUrlDraft;
      if (avatarUriNeedsPrepare(avatarUrlToSave)) {
        const firebaseUser = getFirebaseAuth().currentUser;
        if (!firebaseUser) {
          throw new Error("Sesión no disponible para guardar la foto.");
        }
        const uploadToken = token ?? (await firebaseUser.getIdToken());
        avatarUrlToSave = await prepareAvatarUrlForFirestore(
          uploadToken,
          avatarUrlToSave,
          avatarMimeDraft,
        );
        setAvatarUrlDraft(avatarUrlToSave);
        setAvatarMimeDraft(null);
      }
      await updateUserProfile({
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        name: [normalizedFirstName, normalizedLastName].filter(Boolean).join(" ").trim(),
        avatarUrl: avatarUrlToSave,
      });
      Alert.alert("Perfil actualizado", "Tus cambios se han guardado.");
    } catch (error) {
      Alert.alert("No se pudo guardar", (error as Error).message || "Intentalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  const isWeb = Platform.OS === "web";

  return (
    <Screen
      backgroundColor="#F6F1E7"
      webBackgroundColor="#F6F1E7"
      style={{
        paddingTop: isWeb ? insets.top + 8 : 12,
        paddingBottom: insets.bottom + 12,
        paddingHorizontal: isWeb ? 16 : 10,
      }}
    >
      <Box
        flex={1}
        width="100%"
        maxWidth={1120}
        alignSelf="center"
        bg={isWeb ? "$white" : "transparent"}
        borderRadius={isWeb ? "$2xl" : "$none"}
        borderWidth={isWeb ? 1 : 0}
        borderColor="$primary200"
        px="$4"
        pt="$3"
        maxHeight={isWeb ? "96%" : undefined}
      >
        {isWeb ? (
          <HStack justifyContent="space-between" alignItems="center">
            <Heading size="2xl" color="$primary800">
              Tu ficha
            </Heading>
            <Pressable onPress={closeProfile} hitSlop={12} accessibilityLabel="Cerrar ficha">
              <Ionicons name="close" size={26} color="#2D1F15" />
            </Pressable>
          </HStack>
        ) : (
          <Heading size="lg" color="$primary800" mb="$1">
            Tu ficha
          </Heading>
        )}

        <Text size="sm" color="$textLight500" lineHeight={22} mt="$2" pr="$5">
          Datos de tu cuenta en Scriptorium. El correo no se puede cambiar aqui.
        </Text>

        <Box h={1} bg="$primary200" mt="$3" />

        <ScrollView
          contentContainerStyle={{ paddingTop: 14, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <VStack space="lg">
            <HStack space="lg" alignItems="center">
              <Box
                w={96}
                h={96}
                borderRadius="$full"
                bg="$primary100"
                borderWidth={2}
                borderColor="$primary400"
                alignItems="center"
                justifyContent="center"
                overflow="hidden"
              >
                {avatarUrlDraft ? (
                  <Image source={{ uri: avatarUrlDraft }} style={{ width: 96, height: 96 }} contentFit="cover" />
                ) : (
                  <Ionicons name="person" size={56} color="#7A6555" />
                )}
              </Box>
              <VStack space="md">
                <Pressable onPress={() => onPhotoAction("change")} hitSlop={8}>
                  <Text size="md" fontWeight="$bold" color="$primary600">
                    Cambiar foto
                  </Text>
                </Pressable>
                <Pressable onPress={() => onPhotoAction("remove")} hitSlop={8}>
                  <Text size="md" fontWeight="$bold" color="$primary600">
                    Quitar foto
                  </Text>
                </Pressable>
              </VStack>
            </HStack>

            <AppInput
              label="Nombre"
              value={firstNameDraft}
              onChangeText={setFirstNameDraft}
              editable={!saving}
            />
            <AppInput
              label="Apellidos"
              value={lastNameDraft}
              onChangeText={setLastNameDraft}
              editable={!saving}
            />
            <AppInput label="Correo" value={user?.email ?? ""} editable={false} />

            <Box
              mt="$2"
              bg="$primary100"
              borderRadius="$lg"
              borderWidth={1}
              borderColor="$primary200"
              p="$3"
              gap={6}
            >
              <Text size="md" fontWeight="$bold" color="$primary700">
                Miembro desde: {memberSince}
              </Text>
              <Text size="sm" color="$primary700">
                Fecha de alta de la cuenta: {memberSince}
              </Text>
            </Box>

            <AppButton label="Cerrar sesión" appearance="secondary" onPress={onLogout} />
            <AppButton
              label={saving ? "Guardando..." : "Guardar cambios"}
              onPress={onSave}
              isDisabled={saving}
              isLoading={saving}
            />
          </VStack>
        </ScrollView>
      </Box>
    </Screen>
  );
}
