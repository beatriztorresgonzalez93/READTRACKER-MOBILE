// Normalización de ISBN leído desde código de barras (EAN-13 de libros suele empezar por 978/979).

const ISBN_DIGITS = /^\d{10}(\d{3})?$/;

/** Convierte ISBN-10 a ISBN-13 (prefijo 978 + dígito de control EAN). */
export function isbn10ToIsbn13(isbn10: string): string | null {
  const digits = isbn10.replace(/\D/g, "");
  if (digits.length !== 10) return null;
  const body = `978${digits.slice(0, 9)}`;
  let sum = 0;
  for (let i = 0; i < 12; i += 1) {
    const n = Number.parseInt(body[i] ?? "0", 10);
    sum += i % 2 === 0 ? n : n * 3;
  }
  const check = (10 - (sum % 10)) % 10;
  return `${body}${check}`;
}

/** Extrae dígitos y valida longitud 10 o 13 (ISBN de libro). */
export function normalizeIsbn(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!ISBN_DIGITS.test(digits)) return null;

  if (digits.length === 10) {
    return isbn10ToIsbn13(digits);
  }

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
