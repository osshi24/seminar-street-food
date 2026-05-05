import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { StoreOwnerAccount, StoreOwnerStatus } from '../entities/store-owner-account.entity';
import { AdminAccount } from '../entities/admin-account.entity';
import { Notification, NotificationRecipientType } from '../entities/notification.entity';
import { MailService } from '../mail/mail.service';
import { RegisterStoreOwnerDto } from './dto/register-store-owner.dto';
import { LoginDto } from './dto/login.dto';

const LOCKOUT_SEQUENCE_MINUTES = [1, 5, 30];

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(StoreOwnerAccount)
    private readonly storeOwnerRepo: Repository<StoreOwnerAccount>,
    @InjectRepository(AdminAccount)
    private readonly adminRepo: Repository<AdminAccount>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async registerStoreOwner(dto: RegisterStoreOwnerDto) {
    const existing = await this.storeOwnerRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException({ code: 'EMAIL_ALREADY_EXISTS', message: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    let savedAccountId: string;

    await this.dataSource.transaction(async (manager) => {
      const account = manager.create(StoreOwnerAccount, {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        status: StoreOwnerStatus.PENDING,
        registrationReason: dto.registrationReason,
      });
      const savedAccount = await manager.save(StoreOwnerAccount, account);
      savedAccountId = savedAccount.id;

      const admins = await this.adminRepo.find();
      for (const admin of admins) {
        await manager.save(Notification, manager.create(Notification, {
          recipientType: NotificationRecipientType.ADMIN,
          recipientId: admin.id,
          eventType: 'REGISTRATION_SUBMITTED',
          title: 'Đăng ký tài khoản Store Owner mới',
          body: `${dto.fullName} (${dto.email}) đã đăng ký tài khoản Store Owner.`,
        }));
      }
    });

    // After transaction COMMIT — enqueue emails
    await this.mailService.enqueueEmail({
      to: dto.email,
      subject: 'Xác nhận đăng ký tài khoản Store Owner',
      template: 'registration-confirmation',
      context: { fullName: dto.fullName, storeName: dto.storeName },
    });

    const admins = await this.adminRepo.find();
    for (const admin of admins) {
      await this.mailService.enqueueEmail({
        to: admin.email,
        subject: 'Có Store Owner mới đăng ký',
        template: 'admin-new-registration',
        context: { fullName: dto.fullName, email: dto.email, storeName: dto.storeName },
      });
    }

    this.logger.log(`Store Owner registered: ${dto.email}`);
    return { message: 'Registration submitted successfully' };
  }

  async loginStoreOwner(dto: LoginDto) {
    const account = await this.storeOwnerRepo.findOne({ where: { email: dto.email } });
    if (!account) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }

    // Check lockout
    if (account.lockoutUntil && account.lockoutUntil > new Date()) {
      throw new HttpException(
        { code: 'ACCOUNT_LOCKED', message: 'Account is temporarily locked', lockedUntil: account.lockoutUntil },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, account.passwordHash);

    if (!isPasswordValid) {
      account.failedLoginAttempts += 1;

      if (account.failedLoginAttempts % 5 === 0) {
        const lockoutIndex = Math.min(
          Math.floor(account.failedLoginAttempts / 5) - 1,
          LOCKOUT_SEQUENCE_MINUTES.length - 1,
        );
        const lockoutMinutes = LOCKOUT_SEQUENCE_MINUTES[lockoutIndex];
        account.lockoutUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000);
      }

      await this.storeOwnerRepo.save(account);
      this.logger.warn(`Failed login for ${dto.email} (attempt ${account.failedLoginAttempts})`);
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }

    // Check status
    if (account.status === StoreOwnerStatus.PENDING) {
      throw new ForbiddenException({ code: 'ACCOUNT_PENDING', message: 'Account is pending approval' });
    }
    if (account.status === StoreOwnerStatus.INACTIVE) {
      throw new ForbiddenException({ code: 'ACCOUNT_INACTIVE', message: 'Account is inactive' });
    }
    if (account.status === StoreOwnerStatus.REJECTED) {
      throw new ForbiddenException({ code: 'ACCOUNT_REJECTED', message: 'Account registration was rejected' });
    }

    // Reset failed attempts
    account.failedLoginAttempts = 0;
    account.lockoutUntil = null;
    await this.storeOwnerRepo.save(account);

    const tokenId = uuidv4();
    const accessToken = this.jwtService.sign(
      { sub: account.id, role: 'store_owner' },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '8h'),
      },
    );
    const refreshToken = this.jwtService.sign(
      { sub: account.id, role: 'store_owner', jti: tokenId },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '24h'),
      },
    );

    this.logger.log(`Store Owner logged in: ${dto.email}`);
    return { accessToken, refreshToken, account };
  }

  async refreshStoreOwnerToken(refreshToken: string) {
    let payload: { sub: string; role: string; jti: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException({ code: 'REFRESH_TOKEN_INVALID', message: 'Invalid refresh token' });
    }

    const newTokenId = uuidv4();
    const newAccessToken = this.jwtService.sign(
      { sub: payload.sub, role: 'store_owner' },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '8h'),
      },
    );
    const newRefreshToken = this.jwtService.sign(
      { sub: payload.sub, role: 'store_owner', jti: newTokenId },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '24h'),
      },
    );

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logoutStoreOwner(_refreshToken: string): Promise<void> {
    // Token invalidation via JWT expiry; Redis blacklist can be added in later iteration
    this.logger.log('Store Owner logged out');
  }

  async loginAdmin(dto: LoginDto) {
    const admin = await this.adminRepo.findOne({ where: { email: dto.email } });
    if (!admin) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }

    const accessToken = this.jwtService.sign(
      { sub: admin.id, role: 'admin' },
      {
        secret: this.configService.get<string>('JWT_ADMIN_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ADMIN_EXPIRES_IN', '8h'),
      },
    );

    this.logger.log(`Admin logged in: ${dto.email}`);
    return { accessToken, admin };
  }

  issueCustomerJwt(customer: { id: string; displayName: string; avatarUrl: string | null }): string {
    return this.jwtService.sign(
      { sub: customer.id, type: 'customer', displayName: customer.displayName, avatarUrl: customer.avatarUrl },
      {
        secret: this.configService.get<string>('CUSTOMER_JWT_SECRET'),
        expiresIn: this.configService.get<string>('CUSTOMER_JWT_EXPIRES_IN', '1h'),
      },
    );
  }
}
