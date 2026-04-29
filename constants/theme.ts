export type ThemeColors = {
  bg: string;
  bgPanel: string;
  bgSoft: string;
  card: string;
  cardElevated: string;
  border: string;
  borderOnCard: string;
  text: string;
  textSoft: string;
  textOnDark: string;
  textMutedOnDark: string;
  primary: string;
  onPrimary: string;
  primaryPressed: string;
  accent: string;
  danger: string;
};

export type ThemeTokens = {
  colors: ThemeColors;
  typography: {
    fontFamily: {
      heading: string;
      body: string;
      bodySemibold: string;
    };
    fontSize: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
    lineHeight: {
      sm: number;
      md: number;
      lg: number;
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
  };
};

const baseTypography: ThemeTokens["typography"] = {
  fontFamily: {
    heading: "Fraunces_700Bold",
    body: "Inter_400Regular",
    bodySemibold: "Inter_600SemiBold",
  },
  fontSize: {
    xs: 12,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 22,
    xxl: 28,
  },
  lineHeight: {
    sm: 18,
    md: 22,
    lg: 28,
  },
};

const baseSpacing: ThemeTokens["spacing"] = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

const baseRadius: ThemeTokens["radius"] = {
  sm: 12,
  md: 18,
  lg: 24,
};

export const noteFlowLightTheme: ThemeTokens = {
  colors: {
    bg: "#F6F1E7",
    bgPanel: "#EDE4D2",
    bgSoft: "#FFFFFF",
    card: "#FFFCF5",
    cardElevated: "#FFFFFF",
    border: "#D8C9AE",
    borderOnCard: "#E5D9C2",
    text: "#2D1F15",
    textSoft: "#67503E",
    textOnDark: "#2D1F15",
    textMutedOnDark: "#7A6555",
    primary: "#A87D42",
    onPrimary: "#FFFFFF",
    primaryPressed: "#8F6836",
    accent: "#D8B56E",
    danger: "#B84040",
  },
  typography: baseTypography,
  spacing: baseSpacing,
  radius: baseRadius,
};

export const noteFlowDarkTheme: ThemeTokens = {
  colors: {
    bg: "#4A3D34",
    bgPanel: "#2A211C",
    bgSoft: "#E4D8C4",
    card: "#F4E9D4",
    cardElevated: "#FFFCF5",
    border: "#5C4A3E",
    borderOnCard: "#D9CBB0",
    text: "#261910",
    textSoft: "#5E4A3D",
    textOnDark: "#F2E8D8",
    textMutedOnDark: "#B5A08E",
    primary: "#C4A35A",
    onPrimary: "#231910",
    primaryPressed: "#A88B4A",
    accent: "#E8CC7A",
    danger: "#C94A4A",
  },
  typography: baseTypography,
  spacing: baseSpacing,
  radius: baseRadius,
};

