/**
 * Paleta inspirada en biblioteca oscura / “dark academia”:
 * fondo chocolate algo más claro, franjas más oscuras (header / tabs) para contraste,
 * tarjetas crema, acentos dorados.
 */
export const theme = {
  colors: {
    /** Fondo general de pantalla (algo más claro para que destaquen header y tab bar). */
    bg: "#4A3D34",
    /** Franjas y superficies oscuras (cabecera app, barra inferior, chips sobre fondo). */
    bgPanel: "#2A211C",
    /** Superficie suave clara (progreso, chips dentro de tarjetas crema). */
    bgSoft: "#E4D8C4",
    card: "#F4E9D4",
    cardElevated: "#FFFCF5",
    border: "#5C4A3E",
    borderOnCard: "#D9CBB0",
    /** Texto principal sobre superficies claras (tarjetas, inputs). */
    text: "#261910",
    textSoft: "#5E4A3D",
    /** Texto sobre el fondo oscuro de panel (tabs, cabecera). */
    textOnDark: "#F2E8D8",
    textMutedOnDark: "#B5A08E",
    primary: "#C4A35A",
    /** Texto sobre botones/chips rellenos en color primary. */
    onPrimary: "#231910",
    primaryPressed: "#A88B4A",
    accent: "#E8CC7A",
    danger: "#C94A4A",
  },
  radius: {
    sm: 12,
    md: 18,
    lg: 24,
  },
};
