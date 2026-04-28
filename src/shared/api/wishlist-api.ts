import { apiRequest } from "@/shared/api/client";
import type {
  CreateWishlistItemPayload,
  PurchaseItem,
  WishlistItem,
  WishlistSummary,
} from "@/shared/types/wishlist";

function asList<T>(payload: unknown, keys: string[]): T[] {
  if (Array.isArray(payload)) return payload as T[];
  const response = payload as Record<string, unknown>;
  for (const key of keys) {
    if (Array.isArray(response[key])) return response[key] as T[];
  }
  if (Array.isArray(response.data)) return response.data as T[];
  return [];
}

export async function getWishlistItems(token: string): Promise<WishlistItem[]> {
  const response = await apiRequest<unknown>("/wishlist", { token });
  return asList<WishlistItem>(response, ["items", "wishlist"]);
}

export async function createWishlistItem(token: string, payload: CreateWishlistItemPayload): Promise<void> {
  await apiRequest("/wishlist", {
    method: "POST",
    token,
    body: payload,
  });
}

export async function updateWishlistItem(
  token: string,
  itemId: string,
  payload: CreateWishlistItemPayload,
): Promise<void> {
  await apiRequest(`/wishlist/${itemId}`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export async function purchaseWishlistItem(token: string, itemId: string): Promise<void> {
  await apiRequest(`/wishlist/${itemId}/purchase`, {
    method: "POST",
    token,
  });
}

export async function deleteWishlistItem(token: string, itemId: string): Promise<void> {
  await apiRequest(`/wishlist/${itemId}`, {
    method: "DELETE",
    token,
  });
}

export async function getPurchases(token: string): Promise<PurchaseItem[]> {
  const response = await apiRequest<unknown>("/wishlist/acquisitions", { token });
  return asList<PurchaseItem>(response, ["items", "acquisitions"]);
}

export async function getWishlistSummary(token: string): Promise<WishlistSummary> {
  const response = await apiRequest<{ data?: WishlistSummary } | WishlistSummary | Record<string, unknown>>(
    "/wishlist/summary",
    { token },
  );
  const envelope = response as { data?: Partial<WishlistSummary> };
  const summary = (envelope.data ?? response) as Partial<WishlistSummary>;
  return {
    pendingItems: summary.pendingItems ?? 0,
    purchasedItems: summary.purchasedItems ?? 0,
    monthlySpend: summary.monthlySpend ?? 0,
  };
}

