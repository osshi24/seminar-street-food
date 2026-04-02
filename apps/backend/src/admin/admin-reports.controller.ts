import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CommentReport, CommentReportStatus } from '../entities/comment-report.entity';
import { Review } from '../entities/review.entity';
import { Store } from '../stores/entities/store.entity';
import { AdminJwtGuard } from '../auth/guards/admin-jwt.guard';
import { ListAdminReportsQueryDto } from './dto/list-admin-reports-query.dto';
import { IsEnum } from 'class-validator';

class ResolveReportDto {
  @IsEnum(['hide', 'delete'])
  action: 'hide' | 'delete';
}

@Controller('admin/reports')
@UseGuards(AdminJwtGuard)
export class AdminReportsController {
  constructor(
    @InjectRepository(CommentReport)
    private readonly reportRepo: Repository<CommentReport>,
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  async listReports(@Query() query: ListAdminReportsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.reportRepo
      .createQueryBuilder('cr')
      .leftJoinAndSelect('cr.review', 'rv')
      .leftJoinAndSelect('rv.customer', 'c')
      .leftJoinAndSelect('rv.store', 's')
      .leftJoinAndSelect('cr.reason', 'rr')
      .leftJoinAndSelect('cr.reporter', 'rep')
      .orderBy('cr.createdAt', 'DESC');

    if (query.status) {
      qb.andWhere('cr.status = :status', { status: query.status });
    }
    if (query.storeId) {
      qb.andWhere('rv.store_id = :storeId', { storeId: query.storeId });
    }

    const [reports, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();

    return {
      data: reports.map((r) => ({
        id: r.id,
        status: r.status,
        createdAt: r.createdAt,
        resolvedAt: r.resolvedAt,
        reason: r.reason ? { id: r.reason.id, labelVi: r.reason.labelVi } : null,
        reporter: r.reporter ? { id: r.reporter.id, fullName: r.reporter.fullName } : null,
        review: r.review
          ? {
              id: r.review.id,
              stars: r.review.stars,
              content: r.review.content,
              isHidden: r.review.isHidden,
              customer: r.review.customer
                ? { displayName: r.review.customer.displayName }
                : null,
              store: r.review.store ? { id: r.review.store.id, name: r.review.store.name } : null,
            }
          : null,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  @Patch(':id/resolve')
  async resolveReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ResolveReportDto,
    @Req() req: Request,
  ) {
    const adminId = (req.user as { id: string }).id;

    const report = await this.reportRepo.findOne({ where: { id }, relations: ['review'] });
    if (!report) throw new NotFoundException({ code: 'REPORT_NOT_FOUND', message: 'Report not found' });
    if (report.status !== CommentReportStatus.PENDING) {
      throw new ConflictException({ code: 'REPORT_ALREADY_PROCESSED', message: 'Report already processed' });
    }
    if (!body.action || !['hide', 'delete'].includes(body.action)) {
      throw new BadRequestException({ code: 'INVALID_ACTION', message: 'action must be hide or delete' });
    }

    await this.dataSource.transaction(async (manager) => {
      const review = report.review;

      if (body.action === 'hide') {
        await manager.update(Review, review.id, {
          isHidden: true,
          hiddenAt: new Date(),
          hiddenBy: adminId,
        });
        // Recalculate avg_rating excluding hidden review
        await this.recalcRating(manager, review.storeId);
      } else {
        // Delete review (cascades to comment_reports)
        await manager.delete(Review, review.id);
        await this.recalcRating(manager, review.storeId);
      }

      await manager.update(CommentReport, id, {
        status: CommentReportStatus.RESOLVED,
        resolvedAt: new Date(),
        resolvedBy: adminId,
      });
    });

    return { message: 'Report resolved' };
  }

  @Patch(':id/dismiss')
  async dismissReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const adminId = (req.user as { id: string }).id;

    const report = await this.reportRepo.findOne({ where: { id } });
    if (!report) throw new NotFoundException({ code: 'REPORT_NOT_FOUND', message: 'Report not found' });
    if (report.status !== CommentReportStatus.PENDING) {
      throw new ConflictException({ code: 'REPORT_ALREADY_PROCESSED', message: 'Report already processed' });
    }

    await this.reportRepo.update(id, {
      status: CommentReportStatus.DISMISSED,
      resolvedAt: new Date(),
      resolvedBy: adminId,
    });

    return { message: 'Report dismissed' };
  }

  private async recalcRating(manager: any, storeId: string) {
    const raw = await manager
      .createQueryBuilder(Review, 'r')
      .select('AVG(r.stars)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where('r.store_id = :storeId', { storeId })
      .andWhere('r.is_hidden = false')
      .getRawOne() as { avg: string; count: string };
    const { avg, count } = raw;

    await manager
      .createQueryBuilder()
      .update(Store)
      .set({
        avgRating: parseFloat(parseFloat(avg ?? '0').toFixed(2)),
        reviewCount: parseInt(count ?? '0', 10),
      })
      .where('id = :storeId', { storeId })
      .execute();
  }
}
