export function readingIntensityColor(pages = 0) {
  if (pages <= 0) return "#F3E9D7";
  if (pages <= 10) return "#E3CFA8";
  if (pages <= 25) return "#C9A36A";
  if (pages <= 40) return "#A0713F";
  return "#6B4528";
}
