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
    const prompt = `Analyze the user's query for a Shark Tank search engine and respond with ONLY valid JSON.

Query: "${userQuery}"

Classify the intent type:
- FACTUAL: Looking for specific structured data (e.g., "companies by Kevin O'Leary", "deals with > 1M valuation")
- SEMANTIC: Looking for concepts, arguments, or similar pitches (e.g., "pitches about food that failed", "arguments about royalty deals")
- HYBRID: Both factual and semantic

Extract filters:
- investor_name: Name of the investor (e.g., "Mark Cuban", "Kevin O'Leary") or empty string
- industry: Industry category or empty string
- deal_made: "true", "false", or "any"
- valuation_gt: Minimum valuation in dollars or 0
- valuation_lt: Maximum valuation in dollars or 0

Generate a search_term: Core concept or keywords for semantic search

Respond with ONLY this JSON structure (no markdown, no explanation):
{
  "type": "FACTUAL" | "SEMANTIC" | "HYBRID",
  "filters": {
    "investor_name": "string",
    "industry": "string",
    "deal_made": "true" | "false" | "any",
    "valuation_gt": number,
    "valuation_lt": number
  },
  "search_term": "string"
}`;

    const instructions = 'You are a query analyzer. Extract structured data from user queries and respond with valid JSON only.';

    try {
      const response = await this.aiService.generateMistralResponse(
        prompt,
        instructions,
        [],
        {
          model: 'mistral-large-latest',
          temperature: 0.3,
          maxTokens: 1000,
        },
      );

      // Parse the JSON response
      let parsed;
      try {
        // Try to extract JSON if wrapped in markdown code blocks
        const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : response;
        parsed = JSON.parse(jsonStr.trim());
      } catch (parseError) {
        this.logger.error('Failed to parse Mistral response as JSON:', response);
        // Fallback to default structure
        parsed = {
          type: 'SEMANTIC',
          filters: {
            investor_name: '',
            industry: '',
            deal_made: 'any',
            valuation_gt: 0,
            valuation_lt: 0,
          },
          search_term: userQuery,
        };
      }

      return parsed;
    } catch (error) {
      this.logger.error('Intent classification failed:', error.message);
      // Return default structure on error
      return {
        type: 'SEMANTIC',
        filters: {
          investor_name: '',
          industry: '',
          deal_made: 'any',
          valuation_gt: 0,
          valuation_lt: 0,
        },
        search_term: userQuery,
      };
    }
  }

  async search(intent: any) {
    const { type, filters, search_term } = intent;
    this.logger.log(`Executing search: ${type} - "${search_term}"`);

    // Build Qdrant Filter
    let qdrantFilter: any = undefined;
    if (filters && Object.keys(filters).length > 0) {
      const must: any[] = [];
      for (const [key, value] of Object.entries(filters)) {
        // Skip null, undefined, empty strings, and zero values
        if (value === null || value === undefined || value === '' || value === 0 || value === 'any') {
          continue;
        }

        if (key === 'deal_made') {
          // Handle boolean deal_made
          if (typeof value === 'boolean') {
            must.push({ key: key, match: { value: value } });
          } else if (value === 'true' || value === 'false') {
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

    this.logger.log(`Qdrant filter:`, JSON.stringify(qdrantFilter, null, 2));

    let results: any[] = [];

    // Search Logic
    results = await this.vectorStoreService.search(
      search_term || '',
      qdrantFilter,
    );

    // Deduplication
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
