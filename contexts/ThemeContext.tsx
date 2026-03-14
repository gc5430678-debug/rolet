import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ThemeId, ThemeColors } from "../utils/theme";
import { getStoredTheme, setStoredTheme, THEMES } from "../utils/theme";

type ThemeContextType = {
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => Promise<void>;
  theme: ThemeColors;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>("purple");

  useEffect(() => {
    getStoredTheme().then(setThemeIdState);
  }, []);

  const setThemeId = useCallback(async (id: ThemeId) => {
    await setStoredTheme(id);
    setThemeIdState(id);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        themeId,
        setThemeId,
        theme: THEMES[themeId],
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
