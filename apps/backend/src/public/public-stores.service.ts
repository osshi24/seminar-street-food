import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store, StoreStatus } from '../stores/entities/store.entity';
import { MenuItem } from '../stores/entities/menu-item.entity';
import { StoreImage } from '../stores/entities/store-image.entity';
import { Commentary } from '../commentary/entities/commentary.entity';
import { CommentaryTranslation } from '../commentary/entities/commentary-translation.entity';

@Injectable()
export class PublicStoresService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
    @InjectRepository(MenuItem)
    private readonly menuItemRepo: Repository<MenuItem>,
    @InjectRepository(StoreImage)
    private readonly storeImageRepo: Repository<StoreImage>,
    @InjectRepository(Commentary)
    private readonly commentaryRepo: Repository<Commentary>,
    @InjectRepository(CommentaryTranslation)
    private readonly translationRepo: Repository<CommentaryTranslation>,
  ) {}

  async listStores(q?: string, page = 1, limit = 20) {
    const qb = this.storeRepo
      .createQueryBuilder('s')
      .where('s.status = :status', { status: StoreStatus.ACTIVE });

    if (q) {
      qb.andWhere(
        '(s.name ILIKE :q OR EXISTS (SELECT 1 FROM menu_items mi WHERE mi.store_id = s.id AND mi.name ILIKE :q AND mi.is_in_draft = false))',
        { q: `%${q}%` },
      );
    }

    const [stores, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const data = await Promise.all(
      stores.map(async (store) => {
        const menuItemCount = await this.menuItemRepo.count({
          where: { storeId: store.id, isInDraft: false },
        });
        const hasCommentary = !!store.activeCommentaryId;
        const firstImage = await this.storeImageRepo.findOne({
          where: { storeId: store.id, isInDraft: false },
          order: { orderIndex: 'ASC' },
        });
        return {
          id: store.id,
          name: store.name,
          description: store.description,
          thumbnailUrl: firstImage?.url ?? null,
          menuItemCount,
          hasCommentary,
        };
      }),
    );

    return { data, total, page, limit };
  }

  async getStoreDetail(storeId: string) {
    const store = await this.storeRepo.findOne({ where: { id: storeId } });
    if (!store || store.status === StoreStatus.INACTIVE) {
      throw new NotFoundException('Store not found');
    }

    const menuItems = await this.menuItemRepo.find({
      where: { storeId: store.id, isInDraft: false },
    });
    const images = await this.storeImageRepo.find({
      where: { storeId: store.id, isInDraft: false },
      order: { orderIndex: 'ASC' },
    });

    let pipelineStatus: string | null = null;
    if (store.activeCommentaryId) {
      const commentary = await this.commentaryRepo.findOne({
        where: { id: store.activeCommentaryId },
      });
      pipelineStatus = commentary?.pipelineStatus ?? null;
    }

    return {
      id: store.id,
      name: store.name,
      description: store.description,
      status: store.status,
      activeCommentaryId: store.activeCommentaryId,
      pipelineStatus,
      menuItems,
      images,
    };
  }

  async getCommentary(storeId: string, lang: string): Promise<{
    translatedText: string | null;
    audioUrl: string | null;
    pipelineStatus: string;
    fallback?: boolean;
    message?: string;
  }> {
    const store = await this.storeRepo.findOne({ where: { id: storeId } });
    if (!store || store.status === StoreStatus.INACTIVE) {
      throw new NotFoundException('Store not found');
    }

    if (!store.activeCommentaryId) {
      return { translatedText: null, audioUrl: null, pipelineStatus: 'none', message: 'no_commentary' };
    }

    const commentary = await this.commentaryRepo.findOne({
      where: { id: store.activeCommentaryId },
    });
    if (!commentary) {
      return { translatedText: null, audioUrl: null, pipelineStatus: 'none', message: 'no_commentary' };
    }

    if (commentary.pipelineStatus === 'running' || commentary.pipelineStatus === 'pending') {
      const viTranslation = await this.translationRepo.findOne({
        where: { commentaryId: store.activeCommentaryId, languageCode: 'vi' },
      });
      return {
        translatedText: viTranslation?.translatedText ?? commentary.sourceText,
        audioUrl: null,
        pipelineStatus: commentary.pipelineStatus,
        fallback: true,
        message: 'pipeline_running',
      };
    }

    if (commentary.pipelineStatus === 'failed') {
      return {
        translatedText: commentary.sourceText,
        audioUrl: null,
        pipelineStatus: 'failed',
        fallback: true,
        message: 'pipeline_failed',
      };
    }

    // Find requested language
    const translation = await this.translationRepo.findOne({
      where: { commentaryId: store.activeCommentaryId, languageCode: lang },
    });

    if (translation) {
      return {
        translatedText: translation.translatedText,
        audioUrl: translation.audioUrl,
        pipelineStatus: commentary.pipelineStatus,
      };
    }

    // Fallback to Vietnamese
    const viTranslation = await this.translationRepo.findOne({
      where: { commentaryId: store.activeCommentaryId, languageCode: 'vi' },
    });

    return {
      translatedText: viTranslation?.translatedText ?? commentary.sourceText,
      audioUrl: viTranslation?.audioUrl ?? null,
      pipelineStatus: commentary.pipelineStatus,
      fallback: true,
      message: 'no_translation',
    };
  }
}
