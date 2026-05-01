// Lógica de negocio para la lista de deseos.
import { WishlistRepository } from "../repositories/wishlistRepository";
import { CreateWishlistItemDto, WishlistAcquisition, WishlistItem } from "../types/wishlist";

export class WishlistService {
  constructor(private readonly repository: WishlistRepository) {}

  async list(userId: string): Promise<WishlistItem[]> {
    return this.repository.findAllByUserId(userId);
  }

  async create(userId: string, dto: CreateWishlistItemDto): Promise<WishlistItem> {
    return this.repository.create(userId, dto);
  }

  async listAcquisitions(userId: string): Promise<WishlistAcquisition[]> {
    return this.repository.findRecentAcquisitionsByUserId(userId);
  }

  async update(userId: string, id: string, dto: CreateWishlistItemDto): Promise<WishlistItem | undefined> {
    return this.repository.updateById(userId, id, dto);
  }

  async remove(userId: string, id: string): Promise<boolean> {
    return this.repository.deleteById(userId, id);
  }

  async purchase(userId: string, id: string): Promise<WishlistAcquisition | undefined> {
    return this.repository.markAsPurchased(userId, id);
  }
}
