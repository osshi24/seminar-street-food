import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportReasonsController } from './report-reasons.controller';
import { ReportReason } from '../entities/report-reason.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ReportReason])],
  controllers: [ReportReasonsController],
})
export class ReportReasonsModule {}
