import React, { createContext, useState, useContext } from "react";

export const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const lightTheme = {
  dark: false,
  bg: "#F0F4FF",
  card: "#FFFFFF",
  text: "#1A1A2E",
  subtext: "#6B7280",
  accent: "#4F46E5",
  accentLight: "#EEF2FF",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  dangerLight: "#FEF2F2",
  border: "#E5E7EB",
  inputBg: "#F9FAFB",
  tabBg: "#FFFFFF",
  tabActive: "#4F46E5",
  tabInactive: "#9CA3AF",
};

export const darkTheme = {
  dark: true,
  bg: "#0F0F1A",
  card: "#1A1A2E",
  text: "#F1F5F9",
  subtext: "#94A3B8",
  accent: "#818CF8",
  accentLight: "#1E1B4B",
  success: "#34D399",
  warning: "#FBBF24",
  danger: "#F87171",
  dangerLight: "#2D1B1B",
  border: "#2D2D44",
  inputBg: "#0F0F1A",
  tabBg: "#1A1A2E",
  tabActive: "#818CF8",
  tabInactive: "#4B5563",
};

export default function ThemeProvider({ children }) {
  const [dark, setDark] = useState(false);
  const toggleTheme = () => setDark((d) => !d);
  const theme = dark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ dark, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}
