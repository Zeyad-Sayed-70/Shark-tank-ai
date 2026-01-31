import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { VectorStoreService } from '../vector-store/vector-store.service';

@Injectable()
export class RetrievalService {
  private readonly logger = new Logger(RetrievalService.name);

  constructor(
    private readonly aiService: AiService,
    private readonly vectorStoreService: VectorStoreService,
  ) {}

  async classifyIntent(userQuery: string): Promise<any> {
    const prompt = `
      Analyze the user's query for a Shark Tank search engine.
      Classify the intent and extract filters.
      
      Query: "${userQuery}"

      Types:
      - FACTUAL: The user is looking for specific structured data (e.g., "companies formatted by Kevin O'Leary", "deals with > 1M valuation").
      - SEMANTIC: The user is looking for concepts, arguments, or similar pitches (e.g., "pitches about food that failed", "arguments about royalty deals").
      - HYBRID: Both.

      Extract filters for: company, entrepreneur, season (int), episode (int), deal_made (bool), investor_name, industry, ask_amount (number), valuation (number), equity_offered (number).
      For numeric filters, imply equality or range if context suggests, but for now just extract the value or null.
      
      Output Schema:
      {
        "type": "FACTUAL" | "SEMANTIC" | "HYBRID",
        "filters": { key: value, ... },
        "search_term": "extracted core concept for vector search"
      }
    `;

    const schema = {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['FACTUAL', 'SEMANTIC', 'HYBRID'],
          description: 'The type of search query',
        },
        filters: {
          type: 'object',
          properties: {
            investor_name: {
              type: 'string',
              description: 'Name of the investor (e.g., Mark Cuban, Kevin O\'Leary), or empty string if not applicable',
            },
            industry: {
              type: 'string',
              description: 'Industry category of the business, or empty string if not applicable',
            },
            deal_made: {
              type: 'string',
              enum: ['true', 'false', 'any'],
              description: 'Whether a deal was made: "true", "false", or "any" if not filtering by this',
            },
            valuation_gt: {
              type: 'number',
              description: 'Minimum valuation amount in dollars, or 0 if not filtering',
            },
            valuation_lt: {
              type: 'number',
              description: 'Maximum valuation amount in dollars, or 0 if not filtering',
            },
          },
          required: [
            'investor_name',
            'industry',
            'deal_made',
            'valuation_gt',
            'valuation_lt',
          ],
        },
        search_term: {
          type: 'string',
          description: 'Core concept or keywords for semantic search',
        },
      },
      required: ['type', 'filters', 'search_term'],
    };

    return await this.aiService.generateResponse(prompt, schema);
  }

  async search(intent: any) {
    const { type, filters, search_term } = intent;
    this.logger.log(`Executing search: ${type} - "${search_term}"`, filters);

    // Build Qdrant Filter
    let qdrantFilter: any = undefined;
    if (filters && Object.keys(filters).length > 0) {
      const must: any[] = [];
      for (const [key, value] of Object.entries(filters)) {
        // Skip empty strings and zero values (indicating no filter)
        if (value === '' || value === 0 || value === 'any') {
          continue;
        }

        if (key === 'deal_made') {
          // Convert string "true"/"false" to boolean
          if (value === 'true' || value === 'false') {
            must.push({ key: key, match: { value: value === 'true' } });
          }
        } else if (key.endsWith('_gt')) {
          // Handle greater than
          must.push({
            key: key.replace('_gt', ''),
            range: { gt: value as number },
          });
        } else if (key.endsWith('_lt')) {
          // Handle less than
          must.push({
            key: key.replace('_lt', ''),
            range: { lt: value as number },
          });
        } else {
          // Handle string matches
          must.push({ key: key, match: { value } });
        }
      }
      if (must.length > 0) {
        qdrantFilter = { must };
      }
    }

    let results: any[] = [];

    // Search Logic
    // VectorStoreService.search currently abstracts client.search, but for FACTUAL we might want scroll.
    // However, for simplicity and since vectors are mocked, we can use search() for all,
    // relying on the filter. If FACTUAL, search_term might be irrelevant, but we can still pass it.

    // Note: In a real app, if FACTUAL, we might bypass getEmbeddings and just use scroll.
    // But VectorStoreService.search enforces vector generation.
    // Let's use search for everything for now as it handles filters.

    results = await this.vectorStoreService.search(
      search_term || '',
      qdrantFilter,
    );

    // Deduplication
    // Group by video_url or parent_summary unique hash/text
    const uniquePitches = new Map<string, any>();

    for (const res of results) {
      const summary = res.payload?.parent_summary;
      if (summary && !uniquePitches.has(summary)) {
        uniquePitches.set(summary, res.payload);
      }
    }

    return Array.from(uniquePitches.values());
  }
}
