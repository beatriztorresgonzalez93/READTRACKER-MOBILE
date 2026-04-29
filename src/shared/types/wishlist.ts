// Tipos para entidades y payloads del modulo de wishlist.
export type WishlistItem = {
  id: string;
  title: string;
  author: string;
  price: string;
  store: string;
  priority: 1 | 2 | 3 | 4 | 5;
  createdAt: string;
};

export type PurchaseItem = {
  id: string;
  title: string;
  author: string;
  price: string;
  store: string;
  purchasedAt: string;
};

export type CreateWishlistItemPayload = {
  title: string;
  author: string;
  price?: string;
  store?: string;
  priority?: 1 | 2 | 3 | 4 | 5;
};

