import { create } from "zustand";
import { useColorScheme } from "react-native";

// Theme colors based on best practices from the documentation
export const themes = {
  light: {
    // Backgrounds
    background: "#FAF5FF", // Light purple tint
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",

    // Text
    text: "#1F2937",
    textSecondary: "#6B7280",
    textTertiary: "#9CA3AF",

    // Brand colors
    primary: "#7C3AED",
    primaryLight: "#F3E8FF",

    // Semantic colors
    danger: "#DC2626",
    dangerLight: "#7F1D1D",
    success: "#10B981",

    // Grid and borders
    grid: "#E9D5FF",
    border: "#E5E7EB",

    // Status bar
    statusBar: "dark",
  },
  dark: {
    // Backgrounds - using charcoal (#121212) instead of pure black
    background: "#0A0A0A", // Very dark with slight purple tint
    surface: "#1E1E1E",
    surfaceElevated: "#262626",

    // Text - using ~87% white for primary, ~70% for secondary
    text: "#E5E7EB", // ~87% white
    textSecondary: "#9CA3AF", // ~70% white
    textTertiary: "#6B7280", // ~60% white

    // Brand colors - desaturated and brightened for dark backgrounds
    primary: "#A78BFA", // Brightened purple
    primaryLight: "#2E1065", // Darkened purple for backgrounds

    // Semantic colors - adjusted for dark mode
    danger: "#EF4444", // Brightened red
    dangerLight: "#991B1B",
    success: "#34D399", // Brightened green

    // Grid and borders
    grid: "#2E1065",
    border: "#374151",

    // Status bar
    statusBar: "light",
  },
};

const useThemeStore = create((set) => ({
  theme: "light",
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
  setTheme: (theme) => set({ theme }),
}));

export const useTheme = () => {
  const { theme, toggleTheme, setTheme } = useThemeStore();
  const colors = themes[theme];

  return {
    theme,
    colors,
    toggleTheme,
    setTheme,
    isDark: theme === "dark",
  };
};
