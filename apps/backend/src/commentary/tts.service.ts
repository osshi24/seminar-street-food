import { Injectable } from '@nestjs/common';

export class TtsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TtsError';
  }
}

/**
 * TTS is handled client-side via Web Speech API.
 * This service is a no-op stub kept for interface compatibility.
 */
@Injectable()
export class TtsService {
  async synthesize(_text: string, _languageCode: string): Promise<Buffer | null> {
    return null;
  }
}
