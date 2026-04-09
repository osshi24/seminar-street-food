import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Commentary } from './entities/commentary.entity';
import { CommentaryTranslation } from './entities/commentary-translation.entity';
import { CommentaryService } from './commentary.service';
import { CommentaryProcessor } from './commentary.processor';
import { CommentaryGateway } from './commentary.gateway';
import { TranslationService } from './translation.service';
import { TtsService } from './tts.service';
import { Store } from '../stores/entities/store.entity';

import { COMMENTARY_QUEUE } from './commentary.constants';
export { COMMENTARY_QUEUE };

@Module({
  imports: [
    TypeOrmModule.forFeature([Commentary, CommentaryTranslation, Store]),
    BullModule.registerQueue({
      name: COMMENTARY_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    }),
  ],
  providers: [CommentaryService, CommentaryProcessor, CommentaryGateway, TranslationService, TtsService],
  exports: [CommentaryService],
})
export class CommentaryModule {}
