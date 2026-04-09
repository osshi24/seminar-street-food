import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ListReviewsQueryDto } from './dto/list-reviews-query.dto';
import { CustomerJwtGuard } from '../auth/guards/customer-jwt.guard';
import { Throttle } from '@nestjs/throttler';

@Controller('stores/:storeId/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  listReviews(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Query() query: ListReviewsQueryDto,
  ) {
    return this.reviewsService.listPublicReviews(storeId, query);
  }

  @Post()
  @UseGuards(CustomerJwtGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  submitReview(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() dto: CreateReviewDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    return this.reviewsService.submitReview(storeId, user.id, dto);
  }
}
