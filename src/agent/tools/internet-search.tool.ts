import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

export function createInternetSearchTool(httpService: HttpService, searchApiKey?: string) {
  return new DynamicStructuredTool({
    name: 'internet_search',
    description: `Search the internet for current information about Shark Tank companies, entrepreneurs, or business topics.
    
Use this tool when you need:
- Current status of a company (e.g., "What is Scrub Daddy doing now?")
- Recent news about entrepreneurs or investors
- Company revenue, growth, or acquisition information
- Product availability or market presence
- Updates after the show aired
- Verification of facts or claims

This tool provides real-time, up-to-date information from the web.`,
    
    schema: z.object({
      query: z.string().describe('Search query for current information about companies, entrepreneurs, or business topics'),
      max_results: z.number().optional().default(5).describe('Maximum number of search results to return (default: 5)'),
    }),

    func: async ({ query, max_results = 5 }) => {
      try {
        // Using DuckDuckGo as a free alternative (no API key needed)
        // For production, consider using Google Custom Search API, Bing API, or Serper API
        
        const searchUrl = 'https://api.duckduckgo.com/';
        const response = await lastValueFrom(
          httpService.get(searchUrl, {
            params: {
              q: query,
              format: 'json',
              no_html: 1,
              skip_disambig: 1,
            },
          }),
        );

        const data = response.data;

        // Format results
        const results: Array<{
          type: string;
          title: string;
          snippet: string;
          source?: string;
          url: string;
        }> = [];

        // Add instant answer if available
        if (data.AbstractText) {
          results.push({
            type: 'instant_answer',
            title: data.Heading || 'Quick Answer',
            snippet: data.AbstractText,
            source: data.AbstractSource,
            url: data.AbstractURL,
          });
        }

        // Add related topics
        if (data.RelatedTopics && data.RelatedTopics.length > 0) {
          const topics = data.RelatedTopics
            .filter((topic: any) => topic.Text && topic.FirstURL)
            .slice(0, max_results)
            .map((topic: any) => ({
              type: 'related_topic',
              title: topic.Text.split(' - ')[0] || 'Related',
              snippet: topic.Text,
              url: topic.FirstURL,
            }));
          
          results.push(...topics);
        }

        if (results.length === 0) {
          return JSON.stringify({
            success: true,
            message: 'No specific results found. Try rephrasing your search query.',
            query,
            results: [],
          });
        }

        return JSON.stringify({
          success: true,
          query,
          count: results.length,
          results,
          note: 'This information is from the internet and may need verification.',
        }, null, 2);
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          message: 'Failed to search the internet. The service may be temporarily unavailable.',
        });
      }
    },
  });
}
