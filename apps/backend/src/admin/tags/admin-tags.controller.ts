import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminTagsService } from './admin-tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { AdminJwtGuard } from '../../auth/guards/admin-jwt.guard';
import { ListAdminTagsQueryDto } from './dto/list-admin-tags-query.dto';

@Controller('admin/tags')
@UseGuards(AdminJwtGuard)
export class AdminTagsController {
  constructor(private readonly adminTagsService: AdminTagsService) {}

  @Get()
  async findAll(@Query() query: ListAdminTagsQueryDto) {
    return this.adminTagsService.findAll(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTagDto) {
    return this.adminTagsService.create(dto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTagDto,
  ) {
    return this.adminTagsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.adminTagsService.remove(id);
  }
}
