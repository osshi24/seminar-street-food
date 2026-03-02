import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Commentary, CommentaryPipelineStatus } from './entities/commentary.entity';
import { CommentaryTranslation } from './entities/commentary-translation.entity';
import { TranslationService, TranslationError } from './translation.service';
import { CommentaryGateway } from './commentary.gateway';
import { getSupportedLanguages } from '../config/google-cloud.config';
import { COMMENTARY_QUEUE } from './commentary.constants';

interface CommentaryJobData {
  commentaryId: string;
  storeId: string;
}

@Processor(COMMENTARY_QUEUE)
export class CommentaryProcessor extends WorkerHost {
  private readonly logger = new Logger(CommentaryProcessor.name);

  constructor(
    @InjectRepository(Commentary)
    private readonly commentaryRepo: Repository<Commentary>,
    @InjectRepository(CommentaryTranslation)
    private readonly translationRepo: Repository<CommentaryTranslation>,
    private readonly translationService: TranslationService,
    private readonly gateway: CommentaryGateway,
  ) {
    super();
  }

  async process(job: Job<CommentaryJobData>): Promise<void> {
    const { commentaryId, storeId } = job.data;
    this.logger.log(`Processing commentary pipeline for ${commentaryId}`);

    const commentary = await this.commentaryRepo.findOne({ where: { id: commentaryId } });
    if (!commentary) {
      this.logger.error(`Commentary ${commentaryId} not found`);
      return;
    }

    await this.commentaryRepo.update({ id: commentaryId }, {
      pipelineStatus: CommentaryPipelineStatus.RUNNING,
    });

    const languages = getSupportedLanguages();
    let successCount = 0;

    // Always save Vietnamese first (source text, no translation needed)
    await this.translationRepo.upsert(
      {
        commentaryId,
        languageCode: 'vi',
        translatedText: commentary.sourceText,
        audioUrl: null,
        audioS3Key: null,
      },
      ['commentaryId', 'languageCode'],
    );
    successCount++;

    // Translate to other languages via Gemini (sequential with delay to respect rate limits)
    for (const lang of languages) {
      if (lang === 'vi') continue;

      // Skip if already translated (allows safe re-runs)
      const existing = await this.translationRepo.findOne({
        where: { commentaryId, languageCode: lang },
      });
      if (existing?.translatedText) {
        successCount++;
        this.logger.log(`Skip ${lang} — already translated`);
        continue;
      }

      try {
        const translatedText = await this.translationService.translate(commentary.sourceText, lang);

        await this.translationRepo.upsert(
          {
            commentaryId,
            languageCode: lang,
            translatedText,
            audioUrl: null,
            audioS3Key: null,
          },
          ['commentaryId', 'languageCode'],
        );

        successCount++;
        this.logger.log(`Translated commentary ${commentaryId} to ${lang}`);

        // Small delay between calls to avoid hitting Gemini free-tier rate limits
        await new Promise((r) => setTimeout(r, 1500));
      } catch (err) {
        if (err instanceof TranslationError) {
          this.logger.warn(`Translation failed for lang ${lang}: ${err.message}`);
        } else {
          this.logger.error(`Unexpected error for lang ${lang}: ${(err as Error).message}`);
        }
      }
    }

    const finalStatus = successCount === 0
      ? CommentaryPipelineStatus.FAILED
      : CommentaryPipelineStatus.COMPLETED;

    await this.commentaryRepo.update({ id: commentaryId }, {
      pipelineStatus: finalStatus,
    });

    this.gateway.emitCommentaryUpdated(storeId, {
      commentaryId,
      pipelineStatus: finalStatus,
      successCount,
    });

    this.logger.log(`Commentary pipeline ${commentaryId} finished: ${finalStatus} (${successCount}/${languages.length + 1} langs)`);
  }
}
