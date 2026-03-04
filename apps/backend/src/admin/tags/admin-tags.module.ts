import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PreferenceTag } from '../../tags/entities/preference-tag.entity';
import { AdminTagsService } from './admin-tags.service';
import { AdminTagsController } from './admin-tags.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PreferenceTag])],
  providers: [AdminTagsService],
  controllers: [AdminTagsController],
})
export class AdminTagsModule {}
