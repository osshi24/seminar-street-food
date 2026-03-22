'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n, {
  COOKIE_NAME,
  DEFAULT_LANG,
  LANGUAGE_CODES,
  STORAGE_KEY,
  ensureLanguageLoaded,
  initI18n,
  getSpeechCode,
} from '../i18n/config';

interface LanguageContextValue {
  lang: string;
  speechCode: string;
  setLang: (lang: string) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: DEFAULT_LANG,
  speechCode: 'vi-VN',
  setLang: () => {},
});

export function useLang() {
  return useContext(LanguageContext);
}

function detectInitialLang(): string {
  if (typeof window === 'undefined') return DEFAULT_LANG;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && LANGUAGE_CODES.includes(saved)) return saved;
  const browser = navigator.language.split('-')[0];
  if (LANGUAGE_CODES.includes(browser)) return browser;
  return DEFAULT_LANG;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // SSR-safe: start with default, update on client after mount
  const [lang, setLangState] = useState(DEFAULT_LANG);
  const [ready, setReady] = useState(false);

  // On mount: detect saved language and init i18next
  useEffect(() => {
    const initial = detectInitialLang();
    initI18n(initial).then(() => {
      setLangState(initial);
      setReady(true);
    });
  }, []);

  const setLang = useCallback(async (newLang: string) => {
    if (!LANGUAGE_CODES.includes(newLang)) return;
    await ensureLanguageLoaded(newLang);
    await i18n.changeLanguage(newLang);
    setLangState(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
    // Sync cookie so Server Components can read it on next navigation
    document.cookie = `${COOKIE_NAME}=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
  }, []);

  return (
    <LanguageContext.Provider
      value={{ lang, speechCode: getSpeechCode(lang), setLang }}
    >
      {ready ? (
        <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
      ) : (
        // Render children without translations while i18n boots (avoids blank screen)
        children
      )}
    </LanguageContext.Provider>
  );
}
