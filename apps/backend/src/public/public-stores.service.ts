import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store, StoreStatus } from '../stores/entities/store.entity';
import { MenuItem } from '../stores/entities/menu-item.entity';
import { StoreImage } from '../stores/entities/store-image.entity';
import { StoreTranslation } from '../stores/entities/store-translation.entity';
import { MenuItemTranslation } from '../stores/entities/menu-item-translation.entity';
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
    @InjectRepository(StoreTranslation)
    private readonly storeTranslationRepo: Repository<StoreTranslation>,
    @InjectRepository(MenuItemTranslation)
    private readonly menuItemTranslationRepo: Repository<MenuItemTranslation>,
  ) {}

  async listStores(q?: string, page = 1, limit = 20, lang = 'vi') {
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

    // Batch load translations for all stores
    const storeIds = stores.map((s) => s.id);
    const translations = lang !== 'vi' && storeIds.length > 0
      ? await this.storeTranslationRepo
          .createQueryBuilder('t')
          .where('t.storeId IN (:...ids)', { ids: storeIds })
          .andWhere('t.languageCode = :lang', { lang })
          .getMany()
      : [];
    const transMap = new Map(translations.map((t) => [t.storeId, t]));

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
        const t = transMap.get(store.id);
        return {
          id: store.id,
          name: t?.translatedName || store.name,
          description: t?.translatedDescription || store.description,
          thumbnailUrl: firstImage?.url ?? null,
          menuItemCount,
          hasCommentary,
        };
      }),
    );

    return { data, total, page, limit };
  }

  async getStoreDetail(storeId: string, lang = 'vi') {
    const store = await this.storeRepo.findOne({ where: { id: storeId } });
    if (!store) {
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

    // Apply translations
    let storeName = store.name;
    let storeDescription = store.description;
    if (lang !== 'vi') {
      const storeTrans = await this.storeTranslationRepo.findOne({
        where: { storeId, languageCode: lang },
      });
      if (storeTrans) {
        storeName = storeTrans.translatedName || store.name;
        storeDescription = storeTrans.translatedDescription || store.description;
      }
    }

    // Apply menu item translations
    let translatedMenuItems = menuItems.map((mi) => ({
      id: mi.id,
      name: mi.name,
      description: mi.description,
      price: mi.price,
      imageUrl: mi.imageUrl,
      tags: (mi as any).tags,
    }));
    if (lang !== 'vi') {
      const menuItemIds = menuItems.map((mi) => mi.id);
      if (menuItemIds.length > 0) {
        const menuTrans = await this.menuItemTranslationRepo
          .createQueryBuilder('t')
          .where('t.menuItemId IN (:...ids)', { ids: menuItemIds })
          .andWhere('t.languageCode = :lang', { lang })
          .getMany();
        const menuTransMap = new Map(menuTrans.map((t) => [t.menuItemId, t]));
        translatedMenuItems = translatedMenuItems.map((mi) => {
          const t = menuTransMap.get(mi.id);
          return {
            ...mi,
            name: t?.translatedName || mi.name,
            description: t?.translatedDescription || mi.description,
          };
        });
      }
    }

    return {
      id: store.id,
      name: storeName,
      description: storeDescription,
      status: store.status,
      activeCommentaryId: store.activeCommentaryId,
      pipelineStatus,
      menuItems: translatedMenuItems,
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
