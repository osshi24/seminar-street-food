import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { QrCode } from './entities/qr-code.entity';
import { Store } from '../stores/entities/store.entity';
import { QrService } from './qr.service';
import { QrController } from './qr.controller';
import { QrPublicController } from './qr-public.controller';

@Module({
  imports: [TypeOrmModule.forFeature([QrCode, Store]), ConfigModule],
  providers: [QrService],
  controllers: [QrController, QrPublicController],
  exports: [QrService],
})
export class QrModule {}
