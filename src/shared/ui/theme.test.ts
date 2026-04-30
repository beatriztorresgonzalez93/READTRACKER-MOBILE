import {
  getThemeByScheme,
  noteFlowDarkTheme,
  noteFlowLightTheme,
  theme,
} from "@/shared/ui/theme";

describe("shared ui theme exports", () => {
  it("returns light theme for light scheme", () => {
    expect(getThemeByScheme("light")).toBe(noteFlowLightTheme);
  });

  it("returns dark theme for dark and nullish schemes", () => {
    expect(getThemeByScheme("dark")).toBe(noteFlowDarkTheme);
    expect(getThemeByScheme(null)).toBe(noteFlowDarkTheme);
    expect(getThemeByScheme(undefined)).toBe(noteFlowDarkTheme);
  });

  it("keeps backward-compatible default theme as dark", () => {
    expect(theme).toBe(noteFlowDarkTheme);
  });
});
