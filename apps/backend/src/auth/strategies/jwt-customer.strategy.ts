import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtCustomerStrategy extends PassportStrategy(Strategy, 'jwt-customer') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('CUSTOMER_JWT_SECRET'),
    });
  }

  validate(payload: { sub: string; type: string; displayName: string; avatarUrl: string | null }) {
    if (payload.type !== 'customer') {
      throw new UnauthorizedException({ code: 'INVALID_TOKEN_TYPE', message: 'Invalid token type' });
    }
    return { id: payload.sub, displayName: payload.displayName, avatarUrl: payload.avatarUrl };
  }
}
