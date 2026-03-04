import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterStoreOwnerDto } from './dto/register-store-owner.dto';
import { LoginDto } from './dto/login.dto';
import { StoreOwnerJwtGuard } from './guards/store-owner-jwt.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { CustomerJwtGuard } from './guards/customer-jwt.guard';
import { CustomerGoogleAccount } from '../entities/customer-google-account.entity';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 24 * 60 * 60 * 1000, // 24h
  path: '/',
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── Google OAuth ──────────────────────────────────────────────────────────

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {
    // Passport redirects browser to Google — no body needed
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const customer = req.user as CustomerGoogleAccount;
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

    if (!customer) {
      return res.redirect(`${frontendUrl}/auth/callback?error=ACCESS_DENIED`);
    }

    const token = this.authService.issueCustomerJwt(customer);
    return res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }

  @Get('me')
  @UseGuards(CustomerJwtGuard)
  getMe(@Req() req: Request) {
    const user = req.user as { id: string; displayName: string; avatarUrl: string | null };
    return { id: user.id, displayName: user.displayName, avatarUrl: user.avatarUrl };
  }

  @Post('logout')
  @UseGuards(CustomerJwtGuard)
  @HttpCode(HttpStatus.OK)
  customerLogout() {
    return { message: 'Đăng xuất thành công' };
  }

  // ── Store Owner ───────────────────────────────────────────────────────────

  @Post('store-owner/register')
  @HttpCode(HttpStatus.CREATED)
  async registerStoreOwner(@Body() dto: RegisterStoreOwnerDto) {
    return this.authService.registerStoreOwner(dto);
  }

  @Post('store-owner/login')
  @HttpCode(HttpStatus.OK)
  async loginStoreOwner(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, account } = await this.authService.loginStoreOwner(dto);
    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 8 * 60 * 60,
      account: {
        id: account.id,
        fullName: account.fullName,
        email: account.email,
        status: account.status,
      },
    };
  }

  @Post('store-owner/refresh')
  @HttpCode(HttpStatus.OK)
  async refreshStoreOwnerToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException({ code: 'REFRESH_TOKEN_MISSING', message: 'Refresh token missing' });
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refreshStoreOwnerToken(refreshToken);
    res.cookie('refresh_token', newRefreshToken, REFRESH_COOKIE_OPTIONS);
    return { accessToken, tokenType: 'Bearer', expiresIn: 8 * 60 * 60 };
  }

  @Post('store-owner/logout')
  @UseGuards(StoreOwnerJwtGuard)
  @HttpCode(HttpStatus.OK)
  async logoutStoreOwner(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    if (refreshToken) {
      await this.authService.logoutStoreOwner(refreshToken);
    }
    res.clearCookie('refresh_token', { path: '/' });
    return { message: 'Logged out successfully' };
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  async loginAdmin(@Body() dto: LoginDto) {
    const { accessToken, admin } = await this.authService.loginAdmin(dto);
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 8 * 60 * 60,
      admin: {
        id: admin.id,
        fullName: admin.fullName,
        email: admin.email,
      },
    };
  }
}
