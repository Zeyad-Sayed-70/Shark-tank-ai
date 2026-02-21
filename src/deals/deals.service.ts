import { Injectable, Logger } from '@nestjs/common';
import { VectorStoreService } from '../vector-store/vector-store.service';
import { DealDto, DealSearchDto, DealStatsDto } from './dto/deal.dto';

@Injectable()
export class DealsService {
  private readonly logger = new Logger(DealsService.name);

  constructor(private readonly vectorStoreService: VectorStoreService) {}

  async getDealByCompany(companyName: string): Promise<DealDto | null> {
    try {
      this.logger.log(`Fetching deal for company: ${companyName}`);

      // Search for the company in the vector database
      const filter = {
        must: [
          {
            key: 'company',
            match: { value: companyName },
          },
        ],
      };

      // Use company name as search query for better results
      const results = await this.vectorStoreService.search(companyName, filter, 5);

      if (results.length === 0) {
        this.logger.warn(`No deal found for company: ${companyName}`);
        return null;
      }

      const payload = results[0].payload;
      this.logger.log(`Found deal for ${companyName}`);
      return this.mapPayloadToDeal(payload);
    } catch (error) {
      this.logger.error(`Error fetching deal for ${companyName}:`, error.message);
      throw error;
    }
  }

  async getRecentDeals(limit: number = 10): Promise<DealDto[]> {
    try {
      this.logger.log(`Fetching ${limit} recent deals`);

      // Get recent deals with a search query
      const results = await this.vectorStoreService.search(
        'shark tank pitch deal investment',
        undefined,
        limit * 3,
      );

      this.logger.log(`Found ${results.length} results for recent deals`);

      // Deduplicate by company name
      const uniqueDeals = new Map<string, any>();
      for (const result of results) {
        const company = result.payload?.company as string;
        if (company && !uniqueDeals.has(company)) {
          uniqueDeals.set(company, result.payload);
        }
      }

      const deals = Array.from(uniqueDeals.values())
        .slice(0, limit)
        .map((payload) => this.mapPayloadToDeal(payload));

      this.logger.log(`Returning ${deals.length} recent deals`);

      return deals;
    } catch (error) {
      this.logger.error('Error fetching recent deals:', error.message);
      throw error;
    }
  }

  async getPopularDeals(limit: number = 10): Promise<DealDto[]> {
    try {
      this.logger.log(`Fetching ${limit} popular deals`);

      // Search for successful deals with high valuations
      const filter = {
        must: [
          {
            key: 'deal_made',
            match: { value: true },
          },
        ],
      };

      const results = await this.vectorStoreService.search(
        'successful popular high valuation',
        filter,
        limit * 2,
      );

      // Deduplicate by company name
      const uniqueDeals = new Map<string, any>();
      for (const result of results) {
        const company = result.payload?.company as string;
        if (company && !uniqueDeals.has(company)) {
          uniqueDeals.set(company, result.payload);
        }
      }

      const deals = Array.from(uniqueDeals.values())
        .slice(0, limit)
        .map((payload) => this.mapPayloadToDeal(payload));

      return deals;
    } catch (error) {
      this.logger.error('Error fetching popular deals:', error);
      throw error;
    }
  }

  async searchDeals(searchDto: DealSearchDto): Promise<DealDto[]> {
    try {
      this.logger.log(`Searching deals with query: ${searchDto.query}`);

      const filter = this.buildFilter(searchDto.filters);
      const limit = searchDto.limit || 20;

      const results = await this.vectorStoreService.search(
        searchDto.query || '',
        filter,
        limit * 2,
      );

      // Deduplicate by company name
      const uniqueDeals = new Map<string, any>();
      for (const result of results) {
        const company = result.payload?.company as string;
        if (company && !uniqueDeals.has(company)) {
          uniqueDeals.set(company, result.payload);
        }
      }

      const deals = Array.from(uniqueDeals.values())
        .slice(0, limit)
        .map((payload) => this.mapPayloadToDeal(payload));

      return deals;
    } catch (error) {
      this.logger.error('Error searching deals:', error);
      throw error;
    }
  }

  async getDealStats(): Promise<DealStatsDto> {
    try {
      this.logger.log('Calculating deal statistics');

      // Get all deals
      const allResults = await this.vectorStoreService.search('', undefined, 1000);

      // Deduplicate by company
      const uniqueDeals = new Map<string, any>();
      for (const result of allResults) {
        const company = result.payload?.company as string;
        if (company && !uniqueDeals.has(company)) {
          uniqueDeals.set(company, result.payload);
        }
      }

      const deals = Array.from(uniqueDeals.values());
      const totalDeals = deals.length;
      const successfulDeals = deals.filter((d) => d.deal_made === true).length;

      // Calculate average valuation
      const valuations = deals
        .map((d) => d.valuation)
        .filter((v) => v && v > 0);
      const averageValuation =
        valuations.length > 0
          ? valuations.reduce((a, b) => a + b, 0) / valuations.length
          : 0;

      // Calculate total invested
      const totalInvested = deals
        .filter((d) => d.deal_made && d.deal_amount)
        .reduce((sum, d) => sum + (d.deal_amount || 0), 0);

      // Find top investor
      const investorCounts = new Map<string, number>();
      deals.forEach((deal) => {
        if (deal.investor_name) {
          const count = investorCounts.get(deal.investor_name) || 0;
          investorCounts.set(deal.investor_name, count + 1);
        }
      });
      const topInvestor =
        Array.from(investorCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ||
        'Unknown';

      // Find top industry
      const industryCounts = new Map<string, number>();
      deals.forEach((deal) => {
        if (deal.industry) {
          const count = industryCounts.get(deal.industry) || 0;
          industryCounts.set(deal.industry, count + 1);
        }
      });
      const topIndustry =
        Array.from(industryCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ||
        'Unknown';

      const dealSuccessRate =
        totalDeals > 0 ? (successfulDeals / totalDeals) * 100 : 0;

      return {
        totalDeals,
        successfulDeals,
        averageValuation: Math.round(averageValuation),
        totalInvested: Math.round(totalInvested),
        topInvestor,
        topIndustry,
        dealSuccessRate: Math.round(dealSuccessRate * 100) / 100,
      };
    } catch (error) {
      this.logger.error('Error calculating deal stats:', error);
      throw error;
    }
  }

  async getBatchDeals(companies: string[]): Promise<DealDto[]> {
    try {
      this.logger.log(`Fetching batch deals for ${companies.length} companies`);

      const deals: DealDto[] = [];

      for (const company of companies) {
        const deal = await this.getDealByCompany(company);
        if (deal) {
          deals.push(deal);
        }
      }

      return deals;
    } catch (error) {
      this.logger.error('Error fetching batch deals:', error);
      throw error;
    }
  }

  private buildFilter(filters?: DealSearchDto['filters']): any {
    if (!filters) return undefined;

    const must: any[] = [];

    if (filters.industry) {
      must.push({ key: 'industry', match: { value: filters.industry } });
    }

    if (filters.dealMade !== undefined) {
      must.push({ key: 'deal_made', match: { value: filters.dealMade } });
    }

    if (filters.season) {
      must.push({ key: 'season', match: { value: filters.season } });
    }

    if (filters.investor) {
      must.push({ key: 'investor_name', match: { value: filters.investor } });
    }

    if (filters.minValuation) {
      must.push({ key: 'valuation', range: { gte: filters.minValuation } });
    }

    if (filters.maxValuation) {
      must.push({ key: 'valuation', range: { lte: filters.maxValuation } });
    }

    return must.length > 0 ? { must } : undefined;
  }

  async getTermSheet(companyName: string): Promise<any> {
    try {
      this.logger.log(`Fetching term sheet for company: ${companyName}`);

      // Get the deal first
      const deal = await this.getDealByCompany(companyName);

      if (!deal) {
        return null;
      }

      // Build term sheet from deal data
      const termSheet = {
        company: deal.company,
        entrepreneur: deal.entrepreneur,
        season: deal.season,
        episode: deal.episode,
        industry: deal.industry,
        originalAsk: {
          amount: deal.askAmount,
          equity: deal.askEquity,
          valuation: deal.valuation,
        },
        finalDeal: deal.dealMade ? {
          amount: deal.dealAmount,
          equity: deal.dealEquity,
          valuation: deal.dealAmount && deal.dealEquity 
            ? Math.round((deal.dealAmount / deal.dealEquity) * 100)
            : deal.valuation,
          investors: deal.investors,
        } : null,
        dealMade: deal.dealMade,
        summary: deal.pitchSummary,
        description: deal.description,
      };

      return termSheet;
    } catch (error) {
      this.logger.error(`Error fetching term sheet for ${companyName}:`, error);
      throw error;
    }
  }

  private mapPayloadToDeal(payload: any): DealDto {
    return {
      company: payload.company || 'Unknown',
      entrepreneur: payload.entrepreneur || 'Unknown',
      askAmount: payload.ask_amount || 0,
      askEquity: payload.equity_offered || 0,
      dealAmount: payload.deal_amount || null,
      dealEquity: payload.deal_equity || null,
      valuation: payload.valuation || 0,
      investors: payload.investor_name ? [payload.investor_name] : [],
      season: payload.season || 0,
      episode: payload.episode || 0,
      dealMade: payload.deal_made || false,
      industry: payload.industry || undefined,
      description: payload.description || undefined,
      pitchSummary: payload.parent_summary || undefined,
    };
  }
}
