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

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);
  private readonly genAI: GoogleGenerativeAI;

  constructor(configService: ConfigService) {
    const apiKey = configService.get<string>('GEMINI_API_KEY') ?? '';
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async translate(text: string, targetLanguage: string): Promise<string> {
    try {
      const langName = LANGUAGE_NAMES[targetLanguage] ?? targetLanguage;
      const model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

      const prompt = `Translate the following Vietnamese text to ${langName}. Return ONLY the translated text, no explanations, no quotes.\n\n${text}`;

      const result = await model.generateContent(prompt);
      const translated = result.response.text().trim();

      if (!translated) {
        throw new TranslationError('Empty translation returned');
      }

      return translated;
    } catch (err) {
      if (err instanceof TranslationError) throw err;
      this.logger.error(`Gemini translation failed for lang ${targetLanguage}: ${(err as Error).message}`);
      throw new TranslationError(`Translation failed: ${(err as Error).message}`);
    }
  }
}
