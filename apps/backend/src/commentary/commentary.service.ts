import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Commentary, CommentaryPipelineStatus } from './entities/commentary.entity';
import { CommentaryTranslation } from './entities/commentary-translation.entity';

@Injectable()
export class CommentaryService {
  private readonly logger = new Logger(CommentaryService.name);

  constructor(
    @InjectRepository(Commentary)
    private readonly commentaryRepo: Repository<Commentary>,
    @InjectRepository(CommentaryTranslation)
    private readonly translationRepo: Repository<CommentaryTranslation>,
  ) {}

  async createCommentary(storeId: string, sourceText: string): Promise<Commentary> {
    const commentary = this.commentaryRepo.create({
      storeId,
      sourceText,
      pipelineStatus: CommentaryPipelineStatus.PENDING,
    });
    return this.commentaryRepo.save(commentary);
  }

  async findByStoreId(storeId: string): Promise<Commentary | null> {
    return this.commentaryRepo.findOne({
      where: { storeId },
      order: { createdAt: 'DESC' },
    });
  }

  async findWithTranslation(commentaryId: string, languageCode: string): Promise<CommentaryTranslation | null> {
    return this.translationRepo.findOne({
      where: { commentaryId, languageCode },
    });
  }
}
