import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { DealsService } from './deals.service';
import type { DealSearchDto } from './dto/deal.dto';

@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get(':companyName')
  async getDeal(@Param('companyName') companyName: string) {
    try {
      const deal = await this.dealsService.getDealByCompany(companyName);

      if (!deal) {
        throw new HttpException(
          {
            success: false,
            error: 'Deal not found',
            message: `No deal found for company: ${companyName}`,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        deal,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Failed to fetch deal',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async searchDeals(
    @Query('company') company?: string,
    @Query('industry') industry?: string,
    @Query('dealMade') dealMade?: string,
    @Query('season') season?: string,
    @Query('investor') investor?: string,
    @Query('minValuation') minValuation?: string,
    @Query('maxValuation') maxValuation?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      // If company is provided, search for that specific company
      if (company) {
        const deal = await this.dealsService.getDealByCompany(company);
        return {
          success: true,
          results: deal ? [deal] : [],
          totalResults: deal ? 1 : 0,
        };
      }

      const searchDto: DealSearchDto = {
        filters: {
          industry,
          dealMade: dealMade ? dealMade === 'true' : undefined,
          season: season ? parseInt(season, 10) : undefined,
          investor,
          minValuation: minValuation ? parseFloat(minValuation) : undefined,
          maxValuation: maxValuation ? parseFloat(maxValuation) : undefined,
        },
        limit: limit ? parseInt(limit, 10) : 20,
      };

      const deals = await this.dealsService.searchDeals(searchDto);

      return {
        success: true,
        results: deals,
        totalResults: deals.length,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Failed to search deals',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('recent/list')
  async getRecentDeals(@Query('limit') limit?: string) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 10;
      const deals = await this.dealsService.getRecentDeals(limitNum);

      return {
        success: true,
        deals,
        count: deals.length,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Failed to fetch recent deals',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('popular/list')
  async getPopularDeals(@Query('limit') limit?: string) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 10;
      const deals = await this.dealsService.getPopularDeals(limitNum);

      return {
        success: true,
        deals,
        count: deals.length,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Failed to fetch popular deals',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats/summary')
  async getDealStats() {
    try {
      const stats = await this.dealsService.getDealStats();

      return {
        success: true,
        stats,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Failed to fetch deal statistics',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('search')
  async searchDealsPost(@Body() searchDto: DealSearchDto) {
    try {
      const deals = await this.dealsService.searchDeals(searchDto);

      return {
        success: true,
        query: searchDto.query,
        results: deals,
        totalResults: deals.length,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Failed to search deals',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('batch')
  async getBatchDeals(@Body() body: { companies: string[] }) {
    try {
      if (!body.companies || !Array.isArray(body.companies)) {
        throw new HttpException(
          'Companies array is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const deals = await this.dealsService.getBatchDeals(body.companies);

      return {
        success: true,
        deals,
        count: deals.length,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Failed to fetch batch deals',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
