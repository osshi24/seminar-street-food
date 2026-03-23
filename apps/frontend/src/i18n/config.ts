import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export interface Language {
  code: string;
  label: string;
  flag: string;
  /** BCP-47 tag used by Web Speech API */
  speechCode: string;
}

export const LANGUAGES: Language[] = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳', speechCode: 'vi-VN' },
  { code: 'en', label: 'English',    flag: '🇺🇸', speechCode: 'en-US' },
  { code: 'zh', label: '中文',       flag: '🇨🇳', speechCode: 'zh-CN' },
  { code: 'ja', label: '日本語',     flag: '🇯🇵', speechCode: 'ja-JP' },
  { code: 'ko', label: '한국어',     flag: '🇰🇷', speechCode: 'ko-KR' },
  { code: 'fr', label: 'Français',  flag: '🇫🇷', speechCode: 'fr-FR' },
  { code: 'th', label: 'ภาษาไทย',  flag: '🇹🇭', speechCode: 'th-TH' },
];

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code);

export function getSpeechCode(langCode: string): string {
  return LANGUAGES.find((l) => l.code === langCode)?.speechCode ?? langCode;
}

export const DEFAULT_LANG = 'vi';
export const STORAGE_KEY = 'phat-lang';
export const COOKIE_NAME = 'phat_lang';

// Lazy-load locale JSON so adding a new language = adding one file
async function loadLocale(lang: string) {
  try {
    const mod = await import(`./locales/${lang}.json`);
    return mod.default as Record<string, unknown>;
  } catch {
    return null;
  }
}

let initPromise: Promise<void> | null = null;

export async function initI18n(initialLang = DEFAULT_LANG): Promise<void> {
  if (i18n.isInitialized) {
    await i18n.changeLanguage(initialLang);
    return;
  }
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // Eagerly load vi + the initial lang so there's no flash
    const langs = Array.from(new Set([DEFAULT_LANG, initialLang]));
    const resources: Record<string, { translation: Record<string, unknown> }> = {};

    await Promise.all(
      langs.map(async (code) => {
        const data = await loadLocale(code);
        if (data) resources[code] = { translation: data };
      }),
    );

    await i18n.use(initReactI18next).init({
      resources,
      lng: initialLang,
      fallbackLng: DEFAULT_LANG,
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });
  })();

  return initPromise;
}

/** Dynamically add a language that wasn't loaded at init time */
export async function ensureLanguageLoaded(lang: string): Promise<void> {
  if (i18n.hasResourceBundle(lang, 'translation')) return;
  const data = await loadLocale(lang);
  if (data) i18n.addResourceBundle(lang, 'translation', data, true, true);
}

export default i18n;
