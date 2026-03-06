export function getSupportedLanguages(): string[] {
  const env = process.env.SUPPORTED_LANGUAGES;
  if (!env) return ['en', 'fr', 'zh', 'ja', 'ko', 'th'];
  try {
    return JSON.parse(env) as string[];
  } catch {
    return ['en', 'fr', 'zh', 'ja', 'ko', 'th'];
  }
}
