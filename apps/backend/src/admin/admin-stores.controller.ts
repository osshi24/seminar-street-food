import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AdminStoresService } from './admin-stores.service';
import { AdminJwtGuard } from '../auth/guards/admin-jwt.guard';
import { AdminAccount } from '../entities/admin-account.entity';
import { RejectDraftDto } from './dto/reject-draft.dto';

@Controller('admin/store-drafts')
@UseGuards(AdminJwtGuard)
export class AdminStoresController {
  constructor(private readonly adminStoresService: AdminStoresService) {}

  @Get()
  async listPendingDrafts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminStoresService.listPendingDrafts(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get(':id')
  async getDraftDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminStoresService.getDraftDetail(id);
  }

  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approveDraft(
    @Request() req: { user: AdminAccount },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.adminStoresService.approveDraft(req.user.id, id);
    return { message: 'Draft approved successfully' };
  }

  @Post('reprocess-commentaries')
  @HttpCode(HttpStatus.OK)
  async reprocessAllCommentaries() {
    return this.adminStoresService.reprocessAllCommentaries();
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectDraft(
    @Request() req: { user: AdminAccount },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectDraftDto,
  ) {
    await this.adminStoresService.rejectDraft(req.user.id, id, dto.reason);
    return { message: 'Draft rejected' };
  }
}
