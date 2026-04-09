import { Controller, Get, Query } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { GetRecommendationsDto } from './dto/get-recommendations.dto';

const PAGE_SIZE = 20;

@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get()
  async getRecommendations(@Query() dto: GetRecommendationsDto) {
    const { items, totalCount } = await this.recommendationsService.getRecommendations(
      dto.tags,
      dto.page,
    );

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return {
      items,
      pagination: {
        page: dto.page,
        pageSize: PAGE_SIZE,
        totalCount,
        totalPages,
        hasNextPage: dto.page < totalPages,
        hasPreviousPage: dto.page > 1,
      },
    };
  }
}
