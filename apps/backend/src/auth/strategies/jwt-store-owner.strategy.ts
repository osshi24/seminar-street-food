import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreOwnerAccount, StoreOwnerStatus } from '../../entities/store-owner-account.entity';

interface JwtPayload {
  sub: string;
  role: string;
}

@Injectable()
export class JwtStoreOwnerStrategy extends PassportStrategy(Strategy, 'jwt-store-owner') {
  constructor(
    configService: ConfigService,
    @InjectRepository(StoreOwnerAccount)
    private readonly storeOwnerRepo: Repository<StoreOwnerAccount>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<StoreOwnerAccount> {
    if (payload.role !== 'store_owner') {
      throw new UnauthorizedException();
    }

    const account = await this.storeOwnerRepo.findOne({ where: { id: payload.sub } });
    if (!account || account.status !== StoreOwnerStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    return account;
  }
}
