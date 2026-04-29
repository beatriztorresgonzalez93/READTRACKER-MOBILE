// Hooks para consultar y mutar elementos de la wishlist.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/use-auth";
import {
  createWishlistItem,
  deleteWishlistItem,
  getPurchases,
  getWishlistItems,
  purchaseWishlistItem,
  updateWishlistItem,
} from "@/shared/api/wishlist-api";
import type { CreateWishlistItemPayload } from "@/shared/types/wishlist";

export function useWishlistItems() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["wishlist", "items"],
    queryFn: () => getWishlistItems(token ?? ""),
    enabled: Boolean(token),
  });
}

export function usePurchases() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["wishlist", "purchases"],
    queryFn: () => getPurchases(token ?? ""),
    enabled: Boolean(token),
  });
}

export function useCreateWishlistItem() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWishlistItemPayload) => createWishlistItem(token ?? "", payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
}

export function useUpdateWishlistItem() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: CreateWishlistItemPayload }) =>
      updateWishlistItem(token ?? "", itemId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
}

export function useDeleteWishlistItem() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => deleteWishlistItem(token ?? "", itemId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
}

export function useCreatePurchase() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => purchaseWishlistItem(token ?? "", itemId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
}

