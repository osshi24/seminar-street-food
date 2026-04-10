import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminJwtGuard } from '../../auth/guards/admin-jwt.guard';
import { StorageService } from '../../storage/storage.service';
import { AdminCustomersService } from './admin-customers.service';
import { ListAdminCustomersQueryDto } from './dto/list-admin-customers-query.dto';
import { CreateAdminCustomerDto } from './dto/create-admin-customer.dto';
import { UpdateAdminCustomerDto } from './dto/update-admin-customer.dto';

@Controller('admin/customers')
@UseGuards(AdminJwtGuard)
export class AdminCustomersController {
  constructor(
    private readonly adminCustomersService: AdminCustomersService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  async list(@Query() query: ListAdminCustomersQueryDto) {
    return this.adminCustomersService.list(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminCustomersService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateAdminCustomerDto) {
    return this.adminCustomersService.create(dto);
  }

  @Put(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAdminCustomerDto) {
    return this.adminCustomersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.adminCustomersService.remove(id);
  }

  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile()
    file?: { buffer: Buffer; size: number; mimetype: string; originalname?: string },
  ) {
    if (!file?.buffer) {
      throw new BadRequestException({ code: 'NO_FILE', message: 'No file uploaded' });
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException({ code: 'FILE_TOO_LARGE', message: 'File too large (max 5MB)' });
    }

    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!allowed.has(file.mimetype)) {
      throw new BadRequestException({ code: 'INVALID_FILE_TYPE', message: 'Only jpg/png/webp allowed' });
    }

    const oldKey = await this.adminCustomersService.getAvatarKey(id);

    const ext = file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg';
    const key = `avatars/customers/${id}/${Date.now()}.${ext}`;

    await this.storageService.putObject(key, file.buffer, file.mimetype);
    const avatarUrl = this.storageService.getPublicUrl(key);

    await this.adminCustomersService.setAvatarFields(id, avatarUrl, key);

    if (oldKey && oldKey !== key) {
      await this.storageService.deleteObject(oldKey).catch(() => undefined);
    }

    return { avatarUrl };
  }
}

