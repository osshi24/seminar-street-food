import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { StoreOwnersModule } from './store-owners/store-owners.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MailModule } from './mail/mail.module';
import { StorageModule } from './storage/storage.module';
import { StoresModule } from './stores/stores.module';
import { CommentaryModule } from './commentary/commentary.module';
import { PublicStoresModule } from './public/public-stores.module';
import { AdminModule } from './admin/admin.module';
import { LocationModule } from './location/location.module';
import { MapModule } from './map/map.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ReportsModule } from './reports/reports.module';
import { ReportReasonsModule } from './report-reasons/report-reasons.module';
import { QrModule } from './qr/qr.module';
import { TagsModule } from './tags/tags.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { MonitoringModule } from './monitoring/monitoring.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        synchronize: false,
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
        },
      }),
    }),
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60000,
        limit: 60,
      },
      {
        name: 'auth',
        ttl: 60000,
        limit: 10,
      },
    ]),
    StorageModule,
    HealthModule,
    AuthModule,
    StoreOwnersModule,
    NotificationsModule,
    MailModule,
    StoresModule,
    CommentaryModule,
    PublicStoresModule,
    AdminModule,
    LocationModule,
    MapModule,
    ReviewsModule,
    ReportsModule,
    ReportReasonsModule,
    QrModule,
    TagsModule,
    RecommendationsModule,
    MonitoringModule,
  ],
})
export class AppModule {}
