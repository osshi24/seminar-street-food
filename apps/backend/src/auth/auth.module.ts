import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStoreOwnerStrategy } from './strategies/jwt-store-owner.strategy';
import { JwtAdminStrategy } from './strategies/jwt-admin.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtCustomerStrategy } from './strategies/jwt-customer.strategy';
import { StoreOwnerAccount } from '../entities/store-owner-account.entity';
import { AdminAccount } from '../entities/admin-account.entity';
import { Notification } from '../entities/notification.entity';
import { CustomerGoogleAccount } from '../entities/customer-google-account.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StoreOwnerAccount, AdminAccount, Notification, CustomerGoogleAccount]),
    JwtModule.register({}),
    PassportModule,
    NotificationsModule,
    MailModule,
  ],
  providers: [AuthService, JwtStoreOwnerStrategy, JwtAdminStrategy, GoogleStrategy, JwtCustomerStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
