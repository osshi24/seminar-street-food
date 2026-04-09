'use client';

import { useTranslation } from 'react-i18next';
import Cookies from 'js-cookie';

const LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'th', label: 'ภาษาไทย' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  function handleChange(code: string) {
    i18n.changeLanguage(code);
    localStorage.setItem('phat_lang', code);
    Cookies.set('phat_lang', code, { expires: 365, path: '/' });
  }

  return (
    <select
      value={currentLang}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
      aria-label="Select language"
    >
      {LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.label}
        </option>
      ))}
    </select>
  );
}
