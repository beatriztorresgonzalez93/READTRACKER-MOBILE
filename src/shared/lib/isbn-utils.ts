// Normalización de ISBN leído desde código de barras (EAN-13 de libros suele empezar por 978/979).

const ISBN_DIGITS = /^\d{10}(\d{3})?$/;

/** Extrae dígitos y valida longitud 10 o 13 (ISBN de libro). */
export function normalizeIsbn(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!ISBN_DIGITS.test(digits)) return null;
  if (digits.length === 13 && !digits.startsWith("978") && !digits.startsWith("979")) {
    return null;
  }
  return digits;
}

/** Convierte datos de escáner (EAN-13, etc.) a ISBN utilizable en APIs. */
export function parseIsbnFromBarcode(data: string): string | null {
  const trimmed = data.trim();
  if (!trimmed) return null;
  return normalizeIsbn(trimmed);
}

export function isbnCoverUrl(isbn: string): string {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
}
