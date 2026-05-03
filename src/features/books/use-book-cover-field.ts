// Buscar portadas online y subir a S3 (misma lógica en alta y edición de libro).
import { useCallback, useRef, useState } from "react";
import { Alert } from "react-native";

import { searchCoverCandidates } from "@/shared/api/covers-api";
import { pickImageAndUploadBookCover } from "@/shared/lib/upload-book-cover";

export type BookCoverFieldParams = {
  token: string | null;
  title: string;
  author: string;
  coverOptions: string[];
  setCoverOptions: (urls: string[]) => void;
  setSelectedCoverUrl: (url: string) => void;
  onMissingTitleForCover: () => void;
};

export function useBookCoverField(params: BookCoverFieldParams) {
  const [isSearchingCover, setIsSearchingCover] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const onSearchCover = useCallback(async () => {
    const p = paramsRef.current;
    if (!p.title.trim()) {
      p.onMissingTitleForCover();
      return;
    }
    try {
      setIsSearchingCover(true);
      const options = await searchCoverCandidates(p.title.trim(), p.author.trim() || undefined);
      if (options.length === 0) {
        Alert.alert("Sin portada", "No encontramos portada para ese libro.");
        p.setCoverOptions([]);
        p.setSelectedCoverUrl("");
        return;
      }
      p.setCoverOptions(options);
      p.setSelectedCoverUrl(options[0]);
    } catch (error) {
      Alert.alert("No se pudo buscar portada", (error as Error).message);
    } finally {
      setIsSearchingCover(false);
    }
  }, []);

  const onUploadCover = useCallback(async () => {
    const p = paramsRef.current;
    if (!p.token) {
      Alert.alert("Sesión", "Inicia sesión para subir una portada.");
      return;
    }
    try {
      setIsUploadingCover(true);
      const publicUrl = await pickImageAndUploadBookCover(p.token);
      const merged = [publicUrl, ...p.coverOptions.filter((u) => u !== publicUrl)];
      p.setCoverOptions(merged);
      p.setSelectedCoverUrl(publicUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo subir la imagen";
      if (message === "Selección cancelada") return;
      Alert.alert("Subida de portada", message);
    } finally {
      setIsUploadingCover(false);
    }
  }, []);

  return {
    isSearchingCover,
    isUploadingCover,
    onSearchCover,
    onUploadCover,
  };
}
