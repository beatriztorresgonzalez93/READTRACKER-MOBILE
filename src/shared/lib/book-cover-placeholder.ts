// Colores y detección de portadas del seed (ISBN ficticios en Open Library).

export type CoverPalette = {
  backgroundColor: string;
  color: string;
};

const PALETTE: CoverPalette[] = [
  { backgroundColor: "#E8DDD4", color: "#4A3728" },
  { backgroundColor: "#D4DFE8", color: "#2C3E50" },
  { backgroundColor: "#E8D4D8", color: "#5C2E35" },
  { backgroundColor: "#D8E8D4", color: "#2E4A2C" },
  { backgroundColor: "#E8E0D4", color: "#5C4A2E" },
  { backgroundColor: "#DDD4E8", color: "#3D2E5C" },
  { backgroundColor: "#D4E8E4", color: "#2E5C52" },
  { backgroundColor: "#E8D4E4", color: "#5C2E4A" },
];

export function hashString(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h * 31 + value.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function coverPaletteFromTitle(title: string): CoverPalette {
  const key = title.trim() || "?";
  return PALETTE[hashString(key) % PALETTE.length]!;
}

/** Portadas del seed usan ISBN inventado; Open Library no tiene imagen. */
export function shouldPreferTitlePlaceholder(uri: string | null | undefined): boolean {
  const u = uri?.trim() ?? "";
  if (!u) return false;
  return /covers\.openlibrary\.org\/b\/isbn\/97884083\d{5}/i.test(u);
}

export function coverTitleLines(title: string, maxLines = 4): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > 14 && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
    if (lines.length >= maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines.slice(0, maxLines).join("\n");
}
