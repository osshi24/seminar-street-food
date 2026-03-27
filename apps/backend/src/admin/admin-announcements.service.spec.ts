import { BadRequestException, ConflictException } from '@nestjs/common';
import { AdminAnnouncementsService } from './admin-announcements.service';
import {
  AdminAnnouncementRecipientMode,
  AdminAnnouncementStatus,
} from './entities/admin-announcement.entity';

describe('AdminAnnouncementsService', () => {
  const announcementRepo = {
    save: jest.fn(),
    create: jest.fn((x) => x),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
  };
  const storeRepo = { find: jest.fn() };
  const ownerRepo = { find: jest.fn() };
  const notificationsService = { create: jest.fn() };
  const mailService = { enqueueEmail: jest.fn() };

  function makeService() {
    return new AdminAnnouncementsService(
      announcementRepo as any,
      storeRepo as any,
      ownerRepo as any,
      notificationsService as any,
      mailService as any,
    );
  }

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('rejects missing storeIds for single/multi mode', async () => {
    const svc = makeService();
    await expect(
      svc.create(
        {
          title: 't',
          body: 'b',
          recipientMode: AdminAnnouncementRecipientMode.SINGLE_STORE,
          action: 'save_draft',
        } as any,
        'admin1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects sending already-sent announcement', async () => {
    announcementRepo.findOne.mockResolvedValueOnce({
      id: 'a1',
      adminId: 'admin1',
      status: AdminAnnouncementStatus.SENT,
    });
    const svc = makeService();
    await expect(svc.sendAnnouncement('a1', 'admin1')).rejects.toBeInstanceOf(ConflictException);
  });
});

