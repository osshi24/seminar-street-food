import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { CommentReport } from '../entities/comment-report.entity';
import { Review } from '../entities/review.entity';
import { ReportReason } from '../entities/report-reason.entity';
import { Store } from '../stores/entities/store.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommentReport, Review, ReportReason, Store]),
    NotificationsModule,
    MailModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
