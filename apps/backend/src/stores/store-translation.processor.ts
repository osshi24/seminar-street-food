import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { Store } from './entities/store.entity';
import { MenuItem } from './entities/menu-item.entity';
import { StoreTranslation } from './entities/store-translation.entity';
import { MenuItemTranslation } from './entities/menu-item-translation.entity';
import { TranslationService } from '../commentary/translation.service';

export const STORE_TRANSLATION_QUEUE = 'store-translation-pipeline';

const TARGET_LANGUAGES = ['en', 'fr', 'zh', 'ja', 'ko', 'th'];

export interface StoreTranslationJobData {
  storeId: string;
  /** If set, only translate this menu item (not the whole store) */
  menuItemId?: string;
}

@Processor(STORE_TRANSLATION_QUEUE)
export class StoreTranslationProcessor extends WorkerHost {
  private readonly logger = new Logger(StoreTranslationProcessor.name);

  constructor(
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
    @InjectRepository(MenuItem)
    private readonly menuItemRepo: Repository<MenuItem>,
    @InjectRepository(StoreTranslation)
    private readonly storeTranslationRepo: Repository<StoreTranslation>,
    @InjectRepository(MenuItemTranslation)
    private readonly menuItemTranslationRepo: Repository<MenuItemTranslation>,
    private readonly translationService: TranslationService,
  ) {
    super();
  }

  async process(job: Job<StoreTranslationJobData>): Promise<void> {
    const { storeId, menuItemId } = job.data;
    this.logger.log(`Processing store translation job: storeId=${storeId}, menuItemId=${menuItemId ?? 'all'}`);

    if (menuItemId) {
      await this.translateMenuItem(menuItemId);
    } else {
      await this.translateStore(storeId);
    }
  }

  private async translateStore(storeId: string): Promise<void> {
    const store = await this.storeRepo.findOne({ where: { id: storeId } });
    if (!store) return;

    // Translate store name + description
    for (const lang of TARGET_LANGUAGES) {
      try {
        let translatedName: string | null = null;
        let translatedDescription: string | null = null;

        if (store.name) {
          translatedName = await this.translationService.translate(store.name, lang);
        }
        if (store.description) {
          translatedDescription = await this.translationService.translate(store.description, lang);
        }

        await this.storeTranslationRepo.upsert(
          {
            storeId,
            languageCode: lang,
            translatedName,
            translatedDescription,
          },
          ['storeId', 'languageCode'],
        );

        this.logger.log(`Store ${storeId} → ${lang} done`);
        await this.delay(1500);
      } catch (err) {
        this.logger.warn(`Store ${storeId} → ${lang} failed: ${(err as Error).message}`);
      }
    }

    // Also translate all menu items for this store
    const menuItems = await this.menuItemRepo.find({ where: { storeId } });
    for (const item of menuItems) {
      await this.translateMenuItem(item.id);
    }
  }

  private async translateMenuItem(menuItemId: string): Promise<void> {
    const item = await this.menuItemRepo.findOne({ where: { id: menuItemId } });
    if (!item) return;

    for (const lang of TARGET_LANGUAGES) {
      try {
        let translatedName: string | null = null;
        let translatedDescription: string | null = null;

        if (item.name) {
          translatedName = await this.translationService.translate(item.name, lang);
        }
        if (item.description) {
          translatedDescription = await this.translationService.translate(item.description, lang);
        }

        await this.menuItemTranslationRepo.upsert(
          {
            menuItemId,
            languageCode: lang,
            translatedName,
            translatedDescription,
          },
          ['menuItemId', 'languageCode'],
        );

        this.logger.log(`MenuItem ${menuItemId} → ${lang} done`);
        await this.delay(1500);
      } catch (err) {
        this.logger.warn(`MenuItem ${menuItemId} → ${lang} failed: ${(err as Error).message}`);
      }
    }
  }

  private delay(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }
}
