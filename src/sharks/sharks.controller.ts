import {
  Controller,
  Get,
  Param,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SharksService } from './sharks.service';

@Controller('sharks')
export class SharksController {
  constructor(private readonly sharksService: SharksService) {}

  @Get()
  async getAllSharks() {
    try {
      const sharks = await this.sharksService.getAllSharks();

      return {
        success: true,
        sharks,
        count: sharks.length,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Failed to fetch sharks',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':sharkId')
  async getShark(@Param('sharkId') sharkId: string) {
    try {
      const shark = await this.sharksService.getSharkById(sharkId);

      if (!shark) {
        throw new HttpException(
          {
            success: false,
            error: 'Shark not found',
            message: `No shark found with ID: ${sharkId}`,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        shark,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Failed to fetch shark',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':sharkId/deals')
  async getSharkDeals(
    @Param('sharkId') sharkId: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 10;
      const deals = await this.sharksService.getSharkDeals(sharkId, limitNum);

      return {
        success: true,
        sharkId,
        deals,
        count: deals.length,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Failed to fetch shark deals',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
