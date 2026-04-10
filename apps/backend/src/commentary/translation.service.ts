import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class TranslationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TranslationError';
  }
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  fr: 'French',
  zh: 'Chinese (Simplified)',
  ja: 'Japanese',
  ko: 'Korean',
  th: 'Thai',
};

// MyMemory uses ISO 639-1 language pairs
const MYMEMORY_LANG_CODES: Record<string, string> = {
  en: 'en',
  fr: 'fr',
  zh: 'zh-CN',
  ja: 'ja',
  ko: 'ko',
  th: 'th',
};

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);
  private readonly genAI: GoogleGenerativeAI;

  constructor(configService: ConfigService) {
    const apiKey = configService.get<string>('GEMINI_API_KEY') ?? '';
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Translate Vietnamese text → target language.
   * Strategy: Gemini AI first → MyMemory API fallback → throw error.
   */
  async translate(text: string, targetLanguage: string): Promise<string> {
    // Try Gemini first
    try {
      return await this.translateWithGemini(text, targetLanguage);
    } catch (err) {
      this.logger.warn(`Gemini failed for ${targetLanguage}, falling back to MyMemory: ${(err as Error).message}`);
    }

    // Fallback: MyMemory
    try {
      return await this.translateWithMyMemory(text, targetLanguage);
    } catch (err) {
      this.logger.error(`MyMemory also failed for ${targetLanguage}: ${(err as Error).message}`);
      throw new TranslationError(`All translation providers failed for ${targetLanguage}`);
    }
  }

  private async translateWithGemini(text: string, targetLanguage: string): Promise<string> {
    const langName = LANGUAGE_NAMES[targetLanguage] ?? targetLanguage;
    const model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `Translate the following Vietnamese text to ${langName}. Return ONLY the translated text, no explanations, no quotes.\n\n${text}`;

    const result = await model.generateContent(prompt);
    const translated = result.response.text().trim();

    if (!translated) {
      throw new TranslationError('Empty translation from Gemini');
    }

    return translated;
  }

  private async translateWithMyMemory(text: string, targetLanguage: string): Promise<string> {
    const targetCode = MYMEMORY_LANG_CODES[targetLanguage] ?? targetLanguage;
    const langPair = `vi|${targetCode}`;

    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langPair)}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new TranslationError(`MyMemory HTTP ${res.status}`);
    }

    const data = await res.json() as {
      responseStatus: number;
      responseData: { translatedText: string };
    };

    if (data.responseStatus !== 200 || !data.responseData?.translatedText) {
      throw new TranslationError(`MyMemory error: status ${data.responseStatus}`);
    }

    return data.responseData.translatedText;
  }
}
