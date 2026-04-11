import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerGoogleAccount } from '../../entities/customer-google-account.entity';
import { AdminCustomersController } from './admin-customers.controller';
import { AdminCustomersService } from './admin-customers.service';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerGoogleAccount])],
  providers: [AdminCustomersService],
  controllers: [AdminCustomersController],
})
export class AdminCustomersModule {}

