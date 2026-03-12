import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportReason } from '../entities/report-reason.entity';

@Controller('report-reasons')
export class ReportReasonsController {
  constructor(
    @InjectRepository(ReportReason)
    private readonly reasonRepo: Repository<ReportReason>,
  ) {}

  @Get()
  findAll() {
    return this.reasonRepo.find({ order: { id: 'ASC' } });
  }
}
