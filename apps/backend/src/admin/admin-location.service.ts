import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { LocationPin, LocationPinStatus } from '../location/entities/location-pin.entity';
import { FoodStreetBoundary } from './entities/food-street-boundary.entity';
import { Store } from '../stores/entities/store.entity';
import { DuplicateDetectionService } from '../location/duplicate-detection.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationRecipientType } from '../entities/notification.entity';
import { ApproveLocationDto } from './dto/approve-location.dto';
import { RejectLocationDto } from './dto/reject-location.dto';
import { UpdateBoundaryDto } from './dto/update-boundary.dto';

@Injectable()
export class AdminLocationService {
  private readonly logger = new Logger(AdminLocationService.name);

  constructor(
    @InjectRepository(LocationPin)
    private readonly pinRepo: Repository<LocationPin>,
    @InjectRepository(FoodStreetBoundary)
    private readonly boundaryRepo: Repository<FoodStreetBoundary>,
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
    private readonly duplicateDetectionService: DuplicateDetectionService,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
  ) {}

  async listPins(status: string | undefined, page = 1, limit = 20) {
    const qb = this.pinRepo
      .createQueryBuilder('lp')
      .leftJoinAndSelect('lp.store', 'store');

    if (status) {
      qb.where('lp.status = :status', { status });
    }

    qb.orderBy('lp.submittedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [pins, total] = await qb.getManyAndCount();

    // Compute duplicate warnings for pending pins
    const data = await Promise.all(
      pins.map(async (pin) => {
        let hasDuplicateWarning = false;
        if (pin.status === LocationPinStatus.PENDING) {
          try {
            const nearby = await this.duplicateDetectionService.findNearbyApprovedPins(
              Number(pin.latitude),
              Number(pin.longitude),
              pin.storeId,
            );
            hasDuplicateWarning = nearby.length > 0;
          } catch {
            // ignore
          }
        }
        return { ...pin, hasDuplicateWarning };
      }),
    );

    return { data, total, page, limit };
  }

  async getPinDetail(pinId: string) {
    const pin = await this.pinRepo.findOne({
      where: { id: pinId },
      relations: ['store'],
    });
    if (!pin) throw new NotFoundException('Location pin not found');

    const currentApproved = await this.pinRepo.findOne({
      where: { storeId: pin.storeId, status: LocationPinStatus.APPROVED },
    });

    let duplicateWarnings = [];
    try {
      duplicateWarnings = await this.duplicateDetectionService.findNearbyApprovedPins(
        Number(pin.latitude),
        Number(pin.longitude),
        pin.storeId,
      );
    } catch {
      // ignore
    }

    return { pin, currentApproved, duplicateWarnings };
  }

  async approvePin(pinId: string, adminId: string, dto: ApproveLocationDto): Promise<void> {
    const pin = await this.pinRepo.findOne({
      where: { id: pinId },
      relations: ['store'],
    });
    if (!pin) throw new NotFoundException('Location pin not found');
    if (pin.status !== LocationPinStatus.PENDING) {
      throw new BadRequestException({ code: 'INVALID_TRANSITION', message: 'Pin is not pending' });
    }

    const finalLat = dto.lat ?? Number(pin.latitude);
    const finalLng = dto.lng ?? Number(pin.longitude);

    await this.dataSource.transaction(async (manager) => {
      // Supersede existing approved pin for this store
      await manager.update(
        LocationPin,
        { storeId: pin.storeId, status: LocationPinStatus.APPROVED },
        { status: LocationPinStatus.SUPERSEDED },
      );

      // Approve this pending pin
      await manager.update(LocationPin, { id: pinId }, {
        status: LocationPinStatus.APPROVED,
        latitude: finalLat,
        longitude: finalLng,
        reviewedAt: new Date(),
        reviewedBy: adminId,
      });
    });

    // Notify store owner
    try {
      const store = await this.storeRepo.findOne({ where: { id: pin.storeId } });
      if (store) {
        await this.notificationsService.create({
          recipientType: NotificationRecipientType.STORE_OWNER,
          recipientId: store.ownerId,
          eventType: 'LOCATION_PIN_APPROVED',
          title: 'Vị trí gian hàng đã được duyệt',
          body: `Vị trí ghim của gian hàng "${store.name}" đã được Admin phê duyệt.`,
        });
      }
    } catch (err) {
      this.logger.error(`Failed to send notification: ${(err as Error).message}`);
    }
  }

  async rejectPin(pinId: string, adminId: string, dto: RejectLocationDto): Promise<void> {
    const pin = await this.pinRepo.findOne({
      where: { id: pinId },
      relations: ['store'],
    });
    if (!pin) throw new NotFoundException('Location pin not found');
    if (pin.status !== LocationPinStatus.PENDING) {
      throw new BadRequestException({ code: 'INVALID_TRANSITION', message: 'Pin is not pending' });
    }

    await this.pinRepo.update({ id: pinId }, {
      status: LocationPinStatus.REJECTED,
      rejectionReason: dto.reason,
      reviewedAt: new Date(),
      reviewedBy: adminId,
    });

    try {
      const store = await this.storeRepo.findOne({ where: { id: pin.storeId } });
      if (store) {
        await this.notificationsService.create({
          recipientType: NotificationRecipientType.STORE_OWNER,
          recipientId: store.ownerId,
          eventType: 'LOCATION_PIN_REJECTED',
          title: 'Vị trí gian hàng bị từ chối',
          body: `Lý do: ${dto.reason}`,
        });
      }
    } catch (err) {
      this.logger.error(`Failed to send notification: ${(err as Error).message}`);
    }
  }

  async deletePin(pinId: string, adminId: string): Promise<void> {
    const pin = await this.pinRepo.findOne({
      where: { id: pinId },
      relations: ['store'],
    });
    if (!pin) throw new NotFoundException('Location pin not found');

    await this.pinRepo.delete(pinId);

    try {
      const store = await this.storeRepo.findOne({ where: { id: pin.storeId } });
      if (store) {
        await this.notificationsService.create({
          recipientType: NotificationRecipientType.STORE_OWNER,
          recipientId: store.ownerId,
          eventType: 'LOCATION_PIN_DELETED',
          title: 'Vị trí gian hàng đã bị xóa',
          body: `Admin đã xóa ghim vị trí của gian hàng "${store.name}".`,
        });
      }
    } catch (err) {
      this.logger.error(`Failed to send notification: ${(err as Error).message}`);
    }
    void adminId;
  }

  async getBoundary() {
    return this.boundaryRepo.findOne({ where: { isActive: true } });
  }

  async updateBoundary(adminId: string, dto: UpdateBoundaryDto) {
    // Build WKT polygon string
    const coordStr = dto.coordinates
      .map((c) => `${c.lng} ${c.lat}`)
      .join(', ');
    // Close the polygon (first = last)
    const firstCoord = `${dto.coordinates[0].lng} ${dto.coordinates[0].lat}`;
    const wkt = `POLYGON((${coordStr}, ${firstCoord}))`;

    return this.dataSource.transaction(async (manager) => {
      // Deactivate existing boundary
      await manager.update(FoodStreetBoundary, { isActive: true }, { isActive: false });

      // Create new boundary with computed polygon_geom
      const newBoundary = manager.create(FoodStreetBoundary, {
        name: dto.name ?? 'Ranh giới phố ẩm thực',
        polygonCoordinates: dto.coordinates,
        isActive: true,
        createdBy: adminId,
      });
      const saved = await manager.save(FoodStreetBoundary, newBoundary);

      // Update polygon_geom via raw SQL
      await manager.query(
        `UPDATE food_street_boundaries SET polygon_geom = ST_GeomFromText($1, 4326) WHERE id = $2`,
        [wkt, saved.id],
      );

      return saved;
    });
  }
}
