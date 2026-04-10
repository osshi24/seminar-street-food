import {
  Injectable,
  NotFoundException,
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

  private async resolveStoreId(ownerId: string): Promise<string> {
    const store = await this.storeRepo.findOne({ where: { ownerId } });
    if (!store) throw new NotFoundException('Store not found for this account');
    return store.id;
  }

  async getMyLocation(ownerId: string) {
    const storeId = await this.resolveStoreId(ownerId);
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

  async submitLocation(ownerId: string, dto: SubmitLocationDto): Promise<LocationPin> {
    const storeId = await this.resolveStoreId(ownerId);
    // Check for existing pending
    const existingPending = await this.pinRepo.findOne({
      where: { storeId, status: LocationPinStatus.PENDING },
    });
    if (existingPending) {
      throw new ConflictException({ code: 'PENDING_EXISTS', message: 'A pending location already exists' });
    }

    // Boundary check — may throw NO_ACTIVE_BOUNDARY
    let withinBoundary: boolean;
    try {
      withinBoundary = await this.boundaryCheckService.isWithinBoundary(dto.lat, dto.lng);
    } catch (err: unknown) {
      const e = err as Error & { code?: string };
      if (e.code === 'NO_ACTIVE_BOUNDARY') {
        // No boundary configured — skip boundary check (allow submission)
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

    // Notify all admins
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

  async revokePending(ownerId: string): Promise<void> {
    const storeId = await this.resolveStoreId(ownerId);
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
