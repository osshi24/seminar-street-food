import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocationPin, LocationPinStatus } from './entities/location-pin.entity';
import { Store } from '../stores/entities/store.entity';
import { AdminAccount } from '../entities/admin-account.entity';
import { SubmitLocationDto } from './dto/submit-location.dto';
import { BoundaryCheckService } from './boundary-check.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationRecipientType } from '../entities/notification.entity';
import { FoodStreetBoundary } from '../admin/entities/food-street-boundary.entity';

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);

  constructor(
    @InjectRepository(LocationPin)
    private readonly pinRepo: Repository<LocationPin>,
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
    @InjectRepository(AdminAccount)
    private readonly adminRepo: Repository<AdminAccount>,
    private readonly boundaryCheckService: BoundaryCheckService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async verifyStoreOwnership(ownerId: string, storeId: string): Promise<void> {
    const store = await this.storeRepo.findOne({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Store not found');
    if (store.ownerId !== ownerId) throw new ForbiddenException('Access denied');
  }

  async getMyLocation(ownerId: string, storeId: string) {
    await this.verifyStoreOwnership(ownerId, storeId);
    const [approved, pending] = await Promise.all([
      this.pinRepo.findOne({
        where: { storeId, status: LocationPinStatus.APPROVED },
        order: { reviewedAt: 'DESC' },
      }),
      this.pinRepo.findOne({
        where: { storeId, status: LocationPinStatus.PENDING },
      }),
    ]);
    return { approved, pending };
  }

  async submitLocation(ownerId: string, storeId: string, dto: SubmitLocationDto): Promise<LocationPin> {
    await this.verifyStoreOwnership(ownerId, storeId);

    const existingPending = await this.pinRepo.findOne({
      where: { storeId, status: LocationPinStatus.PENDING },
    });
    if (existingPending) {
      throw new ConflictException({ code: 'PENDING_EXISTS', message: 'A pending location already exists' });
    }

    let withinBoundary: boolean;
    try {
      withinBoundary = await this.boundaryCheckService.isWithinBoundary(dto.lat, dto.lng);
    } catch (err: unknown) {
      const e = err as Error & { code?: string };
      if (e.code === 'NO_ACTIVE_BOUNDARY') {
        withinBoundary = true;
      } else {
        throw err;
      }
    }

    if (!withinBoundary) {
      throw new BadRequestException({
        code: 'LOCATION_OUT_OF_BOUNDARY',
        message: 'Location is outside the food street boundary',
      });
    }

    const pin = this.pinRepo.create({
      storeId,
      latitude: dto.lat,
      longitude: dto.lng,
      status: LocationPinStatus.PENDING,
    });
    const saved = await this.pinRepo.save(pin);

    try {
      const admins = await this.adminRepo.find();
      for (const admin of admins) {
        await this.notificationsService.create({
          recipientType: NotificationRecipientType.ADMIN,
          recipientId: admin.id,
          eventType: 'LOCATION_PIN_SUBMITTED',
          title: 'Gian hàng gửi vị trí mới',
          body: `Một gian hàng đã gửi vị trí cần xét duyệt.`,
        });
      }
    } catch (err) {
      this.logger.error(`Failed to notify admins: ${(err as Error).message}`);
    }

    return saved;
  }

  async revokePending(ownerId: string, storeId: string): Promise<void> {
    await this.verifyStoreOwnership(ownerId, storeId);
    const pending = await this.pinRepo.findOne({
      where: { storeId, status: LocationPinStatus.PENDING },
    });
    if (!pending) {
      throw new NotFoundException({ code: 'NO_PENDING_FOUND', message: 'No pending location pin found' });
    }
    await this.pinRepo.delete(pending.id);
  }

  async listActiveBoundaries(): Promise<Array<Pick<FoodStreetBoundary, 'id' | 'name' | 'polygonCoordinates'>>> {
    const boundaries = await this.boundaryCheckService.listActiveBoundaries();
    return boundaries.map((b) => ({
      id: b.id,
      name: b.name,
      polygonCoordinates: b.polygonCoordinates,
    }));
  }
}
