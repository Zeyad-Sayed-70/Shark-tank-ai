import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

export function createSharkTankSearchTool(httpService: HttpService, baseUrl: string) {
  return new DynamicStructuredTool({
    name: 'shark_tank_search',
    description: `Search through Shark Tank pitch database to find information about deals, pitches, investors, and companies.
    
Use this tool when users ask about:
- Specific investors and their deals (e.g., "What deals did Mark Cuban make?")
- Companies and entrepreneurs (e.g., "Tell me about Scrub Daddy")
- Industry-specific pitches (e.g., "Show me food companies")
- Deal outcomes (e.g., "Which pitches failed?")
- Valuation information (e.g., "High valuation companies")
- Pitch analysis (e.g., "What went wrong in failed pitches?")

The tool returns detailed information including:
- Company name and entrepreneur
- Financial details (ask amount, valuation, equity)
- Deal outcome and investor
- Pitch summary and key moments
- Season and episode information`,
    
    schema: z.object({
      query: z.string().describe('Natural language search query about Shark Tank pitches, deals, or companies'),
    }),

    func: async ({ query }) => {
      try {
        const response = await lastValueFrom(
          httpService.post(`${baseUrl}/search`, { query }),
        );

        const { intent, results, count } = response.data;

        if (count === 0) {
          return JSON.stringify({
            success: true,
            message: 'No pitches found matching the query.',
            intent,
            results: [],
            count: 0,
          });
        }

        // Format results for better readability
        const formattedResults = results.map((pitch: any) => ({
          company: pitch.company,
          entrepreneur: pitch.entrepreneur,
          season: pitch.season,
          episode: pitch.episode,
          financial: {
            ask_amount: pitch.ask_amount,
            valuation: pitch.valuation,
            equity_offered: pitch.equity_offered,
          },
          deal: {
            made: pitch.deal_made,
            investor: pitch.investor_name,
          },
          industry: pitch.industry,
          summary: pitch.parent_summary,
          key_moment: pitch.chunk_text,
          video_url: pitch.video_url,
        }));

        return JSON.stringify({
          success: true,
          query_type: intent.type,
          filters_applied: intent.filters,
          search_term: intent.search_term,
          count,
          results: formattedResults,
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          message: 'Failed to search Shark Tank database. Please try rephrasing your query.',
        });
      }
    },
  });
}
