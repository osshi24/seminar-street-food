import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerGoogleAccount } from '../../entities/customer-google-account.entity';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    configService: ConfigService,
    @InjectRepository(CustomerGoogleAccount)
    private readonly customerRepo: Repository<CustomerGoogleAccount>,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['profile', 'email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<void> {
    const googleId = profile.id;
    const email = profile.emails?.[0]?.value ?? '';
    const displayName = profile.displayName ?? email;
    const avatarUrl = profile.photos?.[0]?.value ?? null;

    let customer = await this.customerRepo.findOne({ where: { googleId } });

    if (customer) {
      customer.displayName = displayName;
      customer.avatarUrl = avatarUrl;
      customer = await this.customerRepo.save(customer);
    } else {
      customer = await this.customerRepo.save(
        this.customerRepo.create({ googleId, email, displayName, avatarUrl }),
      );
    }

    done(null, customer);
  }
}
