/**
 * ثيمات الخلفية — بنفسجي (افتراضي) / أبيض / وردي
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "app_theme";

export type ThemeId = "purple" | "white" | "pink";

export type ThemeColors = {
  bg: string;
  textLight: string;
  textMuted: string;
  cardBg: string;
  accent: string;
  accentSoft: string;
  accentMuted: string;
  border: string;
  inputBg: string;
};

export const THEMES: Record<ThemeId, ThemeColors> = {
  purple: {
    bg: "#1a1625",
    textLight: "#f5f3ff",
    textMuted: "#a1a1aa",
    cardBg: "rgba(45, 38, 64, 0.6)",
    accent: "#a78bfa",
    accentSoft: "#c4b5fd",
    accentMuted: "rgba(167, 139, 250, 0.25)",
    border: "rgba(167, 139, 250, 0.2)",
    inputBg: "rgba(255,255,255,0.05)",
  },
  white: {
    bg: "#fafafa",
    textLight: "#1f2937",
    textMuted: "#6b7280",
    cardBg: "rgba(255, 255, 255, 0.9)",
    accent: "#7c3aed",
    accentSoft: "#8b5cf6",
    accentMuted: "rgba(124, 58, 237, 0.15)",
    border: "rgba(124, 58, 237, 0.2)",
    inputBg: "rgba(0,0,0,0.06)",
  },
  pink: {
    bg: "#fdf2f8",
    textLight: "#831843",
    textMuted: "#9d174d",
    cardBg: "rgba(255, 255, 255, 0.85)",
    accent: "#ec4899",
    accentSoft: "#f472b6",
    accentMuted: "rgba(236, 72, 153, 0.2)",
    border: "rgba(236, 72, 153, 0.25)",
    inputBg: "rgba(0,0,0,0.06)",
  },
};

export async function getStoredTheme(): Promise<ThemeId> {
  try {
    const v = await AsyncStorage.getItem(STORAGE_KEY);
    if (v === "purple" || v === "white" || v === "pink") return v;
  } catch {}
  return "purple";
}

export async function setStoredTheme(theme: ThemeId): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, theme);
  } catch {}
}
