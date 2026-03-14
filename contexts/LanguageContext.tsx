import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Lang } from "../utils/i18n";
import { getStoredLanguage, setStoredLanguage, t } from "../utils/i18n";

type LanguageContextType = {
  lang: Lang;
  setLang: (lang: Lang) => Promise<void>;
  t: (key: string) => string;
  isRTL: boolean;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    getStoredLanguage().then(setLangState);
  }, []);

  const setLang = useCallback(async (l: Lang) => {
    await setStoredLanguage(l);
    setLangState(l);
  }, []);

  const translate = useCallback(
    (key: string) => t(lang, key),
    [lang]
  );

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        t: translate,
        isRTL: lang === "ar",
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
