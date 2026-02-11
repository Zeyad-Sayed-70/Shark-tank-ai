import { Injectable, Logger } from '@nestjs/common';
import { DealsService } from '../deals/deals.service';
import { SharksService } from '../sharks/sharks.service';
import { DealDto } from '../deals/dto/deal.dto';

export interface ExtractedEntities {
  deals: DealDto[];
  sharks: Array<{ name: string; slug: string; mentioned: boolean }>;
  companies: string[];
}

@Injectable()
export class EntityExtractionService {
  private readonly logger = new Logger(EntityExtractionService.name);

  constructor(
    private readonly dealsService: DealsService,
    private readonly sharksService: SharksService,
  ) {}

  async extractEntities(text: string): Promise<ExtractedEntities> {
    try {
      this.logger.log('Extracting entities from response');

      // Extract shark mentions
      const mentionedSharkNames = this.sharksService.extractMentionedSharks(text);
      const allSharks = await this.sharksService.getAllSharks();
      
      const sharks = allSharks.map((shark) => ({
        name: shark.name,
        slug: shark.id,
        mentioned: mentionedSharkNames.includes(shark.name),
      }));

      // Extract company names (simple pattern matching)
      const companies = this.extractCompanyNames(text);

      // Fetch deal information for mentioned companies
      const deals: DealDto[] = [];
      for (const company of companies.slice(0, 5)) {
        // Limit to 5 companies
        try {
          const deal = await this.dealsService.getDealByCompany(company);
          if (deal) {
            deals.push(deal);
          }
        } catch (error) {
          this.logger.warn(`Could not fetch deal for ${company}`);
        }
      }

      return {
        deals,
        sharks,
        companies,
      };
    } catch (error) {
      this.logger.error('Error extracting entities:', error);
      // Return empty entities on error
      return {
        deals: [],
        sharks: [],
        companies: [],
      };
    }
  }

  private extractCompanyNames(text: string): string[] {
    const companies: string[] = [];

    // Common patterns for company mentions
    // Pattern 1: "Company Name was/is/got..."
    const pattern1 = /([A-Z][a-zA-Z0-9\s&'-]+?)(?:\s+(?:was|is|got|received|pitched|founded|created|makes|sells|offers))/g;
    let match;
    while ((match = pattern1.exec(text)) !== null) {
      const company = match[1].trim();
      if (company.length > 2 && company.length < 50) {
        companies.push(company);
      }
    }

    // Pattern 2: Quoted company names
    const pattern2 = /"([^"]+)"/g;
    while ((match = pattern2.exec(text)) !== null) {
      const company = match[1].trim();
      if (company.length > 2 && company.length < 50 && /^[A-Z]/.test(company)) {
        companies.push(company);
      }
    }

    // Pattern 3: Company names followed by specific keywords
    const pattern3 = /([A-Z][a-zA-Z0-9\s&'-]+?)(?:\s+(?:company|business|product|deal|pitch|entrepreneur))/gi;
    while ((match = pattern3.exec(text)) !== null) {
      const company = match[1].trim();
      if (company.length > 2 && company.length < 50) {
        companies.push(company);
      }
    }

    // Remove duplicates and common false positives
    const uniqueCompanies = [...new Set(companies)];
    const filtered = uniqueCompanies.filter(
      (c) =>
        !['Shark Tank', 'The Shark', 'The Company', 'This Company', 'A Company'].includes(
          c,
        ),
    );

    return filtered;
  }
}
