import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PreferenceTag } from './entities/preference-tag.entity';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PreferenceTag])],
  providers: [TagsService],
  controllers: [TagsController],
  exports: [TagsService],
})
export class TagsModule {}
