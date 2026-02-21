import { Injectable, Logger } from '@nestjs/common';
import { VectorStoreService } from '../vector-store/vector-store.service';
import { SharkDto, SharkDealDto } from './dto/shark.dto';

@Injectable()
export class SharksService {
  private readonly logger = new Logger(SharksService.name);

  // Static shark data
  private readonly sharks: SharkDto[] = [
    {
      id: 'mark-cuban',
      name: 'Mark Cuban',
      netWorth: '$5.1 billion',
      industries: ['Technology', 'Sports', 'Entertainment', 'Consumer Products'],
      totalDeals: 0, // Will be calculated dynamically
      avatar: '/avatars/mark-cuban.jpg',
      bio: 'Entrepreneur, investor, and owner of the Dallas Mavericks',
    },
    {
      id: 'kevin-oleary',
      name: "Kevin O'Leary",
      netWorth: '$400 million',
      industries: ['Finance', 'Software', 'Consumer Products', 'Royalty Deals'],
      totalDeals: 0,
      avatar: '/avatars/kevin-oleary.jpg',
      bio: 'Businessman, author, and television personality known as "Mr. Wonderful"',
    },
    {
      id: 'lori-greiner',
      name: 'Lori Greiner',
      netWorth: '$150 million',
      industries: ['Consumer Products', 'Retail', 'Home & Garden', 'Beauty'],
      totalDeals: 0,
      avatar: '/avatars/lori-greiner.jpg',
      bio: 'Inventor and entrepreneur known as the "Queen of QVC"',
    },
    {
      id: 'barbara-corcoran',
      name: 'Barbara Corcoran',
      netWorth: '$100 million',
      industries: ['Real Estate', 'Consumer Products', 'Food & Beverage', 'Services'],
      totalDeals: 0,
      avatar: '/avatars/barbara-corcoran.jpg',
      bio: 'Real estate mogul and business expert',
    },
    {
      id: 'robert-herjavec',
      name: 'Robert Herjavec',
      netWorth: '$200 million',
      industries: ['Technology', 'Cybersecurity', 'Software', 'Services'],
      totalDeals: 0,
      avatar: '/avatars/robert-herjavec.jpg',
      bio: 'Cybersecurity expert and technology entrepreneur',
    },
    {
      id: 'daymond-john',
      name: 'Daymond John',
      netWorth: '$350 million',
      industries: ['Fashion', 'Apparel', 'Consumer Products', 'Branding'],
      totalDeals: 0,
      avatar: '/avatars/daymond-john.jpg',
      bio: 'Fashion mogul and founder of FUBU',
    },
  ];

  constructor(private readonly vectorStoreService: VectorStoreService) {}

  async getAllSharks(): Promise<SharkDto[]> {
    try {
      this.logger.log('Fetching all sharks with deal counts');

      // Get deal counts for each shark
      const sharksWithCounts = await Promise.all(
        this.sharks.map(async (shark) => {
          const deals = await this.getSharkDeals(shark.id, 1000);
          return {
            ...shark,
            totalDeals: deals.length,
          };
        }),
      );

      return sharksWithCounts;
    } catch (error) {
      this.logger.error('Error fetching sharks:', error);
      // Return sharks with zero counts on error
      return this.sharks;
    }
  }

  async getSharkById(sharkId: string): Promise<SharkDto | null> {
    try {
      this.logger.log(`Fetching shark: ${sharkId}`);

      const shark = this.sharks.find((s) => s.id === sharkId);
      if (!shark) {
        return null;
      }

      // Get deal count
      const deals = await this.getSharkDeals(sharkId, 1000);

      return {
        ...shark,
        totalDeals: deals.length,
      };
    } catch (error) {
      this.logger.error(`Error fetching shark ${sharkId}:`, error);
      return this.sharks.find((s) => s.id === sharkId) || null;
    }
  }

  async getSharkDeals(sharkId: string, limit: number = 10): Promise<SharkDealDto[]> {
    try {
      const shark = this.sharks.find((s) => s.id === sharkId);
      if (!shark) {
        this.logger.warn(`Shark not found: ${sharkId}`);
        return [];
      }

      this.logger.log(`Fetching deals for shark: ${shark.name}`);

      // Search for deals by this shark with a query to improve results
      const filter = {
        must: [
          {
            key: 'investor_name',
            match: { value: shark.name },
          },
          {
            key: 'deal_made',
            match: { value: true },
          },
        ],
      };

      // Use a search query to get better results
      const searchQuery = `${shark.name} investment deal`;
      const results = await this.vectorStoreService.search(searchQuery, filter, limit * 3);

      this.logger.log(`Found ${results.length} results for ${shark.name}`);

      // Deduplicate by company
      const uniqueDeals = new Map<string, any>();
      for (const result of results) {
        const company = result.payload?.company as string;
        if (company && !uniqueDeals.has(company)) {
          uniqueDeals.set(company, result.payload);
        }
      }

      const deals = Array.from(uniqueDeals.values())
        .slice(0, limit)
        .map((payload) => this.mapPayloadToSharkDeal(payload));

      this.logger.log(`Returning ${deals.length} unique deals for ${shark.name}`);

      return deals;
    } catch (error) {
      this.logger.error(`Error fetching deals for shark ${sharkId}:`, error.message);
      return [];
    }
  }

  extractMentionedSharks(text: string): string[] {
    const mentioned: string[] = [];
    const lowerText = text.toLowerCase();

    for (const shark of this.sharks) {
      const lowerName = shark.name.toLowerCase();
      if (lowerText.includes(lowerName)) {
        mentioned.push(shark.name);
      }
    }

    return mentioned;
  }

  getSharksByNames(names: string[]): SharkDto[] {
    return this.sharks.filter((shark) =>
      names.some((name) => name.toLowerCase() === shark.name.toLowerCase()),
    );
  }

  private mapPayloadToSharkDeal(payload: any): SharkDealDto {
    return {
      company: payload.company || 'Unknown',
      entrepreneur: payload.entrepreneur || 'Unknown',
      dealAmount: payload.deal_amount || 0,
      dealEquity: payload.deal_equity || 0,
      valuation: payload.valuation || 0,
      season: payload.season || 0,
      episode: payload.episode || 0,
      industry: payload.industry || undefined,
    };
  }
}
