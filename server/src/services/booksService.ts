// Capa de negocio: coordina operaciones de libros usando el repositorio.
import { BooksRepository } from "../repositories/booksRepository";
import { BookListPageFilters, CreateBookDto, LibrarySummaryDto, UpdateBookDto } from "../types/book";

export class BooksService {
  constructor(private readonly repository: BooksRepository) {}

  async getBooksPage(userId: string, filters: BookListPageFilters, limit: number, offset: number) {
    return this.repository.listPage(userId, filters, limit, offset);
  }

  async getLibrarySummary(userId: string): Promise<LibrarySummaryDto> {
    return this.repository.getLibrarySummary(userId);
  }

  async getBookById(id: string, userId: string) {
    return this.repository.findById(id, userId);
  }

  async createBook(data: CreateBookDto, userId: string) {
    return this.repository.create(data, userId);
  }

  async updateBook(id: string, data: UpdateBookDto, userId: string) {
    return this.repository.update(id, data, userId);
  }

  async deleteBook(id: string, userId: string) {
    return this.repository.delete(id, userId);
  }
}
