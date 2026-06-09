export function wishlistPriorityLabel(priority: number) {
  if (priority <= 2) return "ALTA";
  if (priority === 3) return "MEDIA";
  return "BAJA";
}
