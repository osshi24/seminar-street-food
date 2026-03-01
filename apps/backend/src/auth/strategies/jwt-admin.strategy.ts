import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminAccount } from '../../entities/admin-account.entity';

interface JwtPayload {
  sub: string;
  role: string;
}

@Injectable()
export class JwtAdminStrategy extends PassportStrategy(Strategy, 'jwt-admin') {
  constructor(
    configService: ConfigService,
    @InjectRepository(AdminAccount)
    private readonly adminRepo: Repository<AdminAccount>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_ADMIN_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AdminAccount> {
    if (payload.role !== 'admin') {
      throw new UnauthorizedException();
    }

    const admin = await this.adminRepo.findOne({ where: { id: payload.sub } });
    if (!admin) {
      throw new UnauthorizedException();
    }

    return admin;
  }
}
