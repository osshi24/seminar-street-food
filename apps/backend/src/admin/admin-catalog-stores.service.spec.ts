import { ConflictException, NotFoundException } from '@nestjs/common';
import { AdminCatalogStoresService } from './admin-catalog-stores.service';
import { DraftStatus } from '../stores/entities/store-content-draft.entity';
import { StoreStatus } from '../stores/entities/store.entity';

describe('AdminCatalogStoresService', () => {
  const storeRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const ownerRepo = {};
  const reviewRepo = { count: jest.fn() };
  const reportRepo = { createQueryBuilder: jest.fn() };
  const draftRepo = { findOne: jest.fn() };
  const pinRepo = { count: jest.fn() };

  function makeService() {
    return new AdminCatalogStoresService(
      storeRepo as any,
      ownerRepo as any,
      reviewRepo as any,
      reportRepo as any,
      draftRepo as any,
      pinRepo as any,
    );
  }

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('throws STORE_NOT_FOUND when deleting missing store', async () => {
    storeRepo.findOne.mockResolvedValueOnce(null);
    const svc = makeService();
    await expect(svc.remove('missing', true)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws confirmation conflict when related data exists and not confirmed', async () => {
    storeRepo.findOne.mockResolvedValue({ id: 's1', status: StoreStatus.ACTIVE });

    reviewRepo.count.mockResolvedValueOnce(1);
    pinRepo.count.mockResolvedValueOnce(0);
    draftRepo.findOne.mockResolvedValueOnce({ id: 'd1', status: DraftStatus.PENDING });

    const reportQb = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValueOnce(0),
    };
    reportRepo.createQueryBuilder.mockReturnValue(reportQb);

    const svc = makeService();
    await expect(svc.remove('s1', false)).rejects.toBeInstanceOf(ConflictException);
  });
});

