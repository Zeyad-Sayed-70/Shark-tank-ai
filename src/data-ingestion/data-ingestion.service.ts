import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { VectorStoreService } from '../vector-store/vector-store.service';

@Injectable()
export class DataIngestionService {
  private readonly logger = new Logger(DataIngestionService.name);

  constructor(
    private readonly aiService: AiService,
    private readonly vectorStoreService: VectorStoreService,
  ) {}

  async ingestVideo(url: string): Promise<any> {
    this.logger.log(`Starting ingestion for URL: ${url}`);

    // Bypass manual transcript fetching. The AI service now handles the video URL directly.

    // 2. AI Processing (Bucketing)
    const prompt = `
    ROLE
    You are a Lead Data Compliance Auditor for a venture capital database. Your task is to extract structured data from Shark Tank video transcripts with 100% forensic accuracy. Your highest priority is factual integrity; you must never guess, hallucinate, or fill in missing data with assumptions.
    OBJECTIVE
    Analyze the provided video context to identify distinct pitches. For each pitch, extract specific metadata, synthesize a detailed negotiation summary, and isolate key verbatim segments.
    INSTRUCTIONS
    1. Segmentation
    Identify where each specific company pitch begins and ends.
    Treat each company as a separate entry in the output array.
    2. Metadata Extraction Rules (Strict Compliance)
    Extract the following fields based only on audio/visual evidence.
    Company: Exact spelling as seen on the set background or display.
    Entrepreneur: Full names of presenters.
    Season/Episode: Extract ONLY if explicitly mentioned in the input context (e.g., video title or intro). If not found, use 0 (integer) to indicate "Unknown" to satisfy schema requirements without guessing.
    Ask Amount: The specific amount of money ($) requested in the initial offer.
    Equity Offered: The specific percentage (%) offered in the initial offer.
    Valuation: Calculate this strictly based on the initial ask: (Ask Amount / Equity %) * 100. Do not use implied valuations unless mathematically derived from the initial ask.
    Deal Made: Boolean (True/False). True only if a handshake or verbal "You got a deal" occurs on screen.
    Investor Name: The name(s) of the Shark(s) who closed the deal. If no deal was made, return "None".
    Industry: Categorize based on the product type (e.g., "Food & Beverage", "Technology", "Apparel").
    3. Summary Guidelines (300-500 words)
    Write a factual, chronological summary of the negotiation. You must include:
    The Entrepreneur's backstory or "sob story" if present.
    The product's unique selling point (USP) and current sales figures (margins, lifetime sales, last year's sales) explicitly mentioned.
    The counter-offers made by Sharks (specific numbers and structures, e.g., royalties, lines of credit).
    The specific reasons Sharks dropped out (e.g., "valuation too high," "product too early").
    The exact terms of the final deal or the final reason for rejection.
    4. Chunk Extraction
    Select 3-5 distinct blocks of text (3-5 sentences each) that capture:
    The "Hook" (opening pitch).
    The "Shark Fight" (tense negotiation or argument).
    The "Closing" (final agreement or exit).
    Note: These must be verbatim or near-verbatim representations of the dialogue.
    NEGATIVE CONSTRAINTS (CRITICAL)
    NO GUESSING: If a name is mumbled, transcribe phonetically or mark as "Unknown." Do not invent names.
    NO EXTERNAL KNOWLEDGE: Do not use outside knowledge about the company (e.g., what happened after the show). Use only what is in the video.
    NO HALLUCINATION: If the Season/Episode is not in the provided text/metadata, do NOT guess based on the Sharks' appearance. Use 0.
    PRECISION: Ensure numbers (Sales, Ask, Valuation) are exact. Do not round $150,000 to $200k.
    VERIFICATION STEP
    Before generating the final JSON, mentally double-check:
    Did I calculate the valuation correctly based on the ask?
    Did I confuse the Final Deal equity with the Initial Ask equity? (Metadata requires Initial Ask).
    Are the sales figures accurate to what was spoken?
    `;

    const schema = {
      type: 'object',
      properties: {
        pitches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metadata: {
                type: 'object',
                properties: {
                  company: { 
                    type: 'string',
                    description: 'Name of the company or product'
                  },
                  entrepreneur: { 
                    type: 'string',
                    description: 'Name of the entrepreneur(s)'
                  },
                  season: { 
                    type: 'integer',
                    description: 'Season number'
                  },
                  episode: { 
                    type: 'integer',
                    description: 'Episode number'
                  },
                  ask_amount: { 
                    type: 'number',
                    description: 'Amount of money requested in dollars'
                  },
                  valuation: { 
                    type: 'number',
                    description: 'Company valuation in dollars'
                  },
                  equity_offered: { 
                    type: 'number',
                    description: 'Percentage of equity offered'
                  },
                  deal_made: { 
                    type: 'boolean',
                    description: 'Whether a deal was made'
                  },
                  investor_name: { 
                    type: 'string',
                    description: 'Name of the investor who made the deal, or "None" if no deal'
                  },
                  industry: { 
                    type: 'string',
                    description: 'Industry category of the business'
                  },
                },
                required: [
                  'company',
                  'entrepreneur',
                  'season',
                  'episode',
                  'ask_amount',
                  'valuation',
                  'equity_offered',
                  'deal_made',
                  'investor_name',
                  'industry',
                ],
              },
              summary: { 
                type: 'string',
                description: 'A 300-500 word detailed summary of the pitch and negotiation'
              },
              chunks: {
                type: 'array',
                description: 'List of 3-5 sentence chunks representing key moments, arguments, or quotes',
                items: { type: 'string' },
              },
            },
            required: ['metadata', 'summary', 'chunks'],
          },
        },
      },
      required: ['pitches'],
    };

    // Pass the URL to the AI service
    const response = await this.aiService.generateResponse(prompt, schema, url);

    if (!response || !response.pitches || !Array.isArray(response.pitches)) {
      throw new Error('AI failed to return valid pitch structure');
    }

    const pitches = response.pitches;

    // 3. Store in Vector Database
    for (const pitch of pitches) {
      if (pitch.chunks) {
        for (const chunk of pitch.chunks) {
          await this.vectorStoreService.savePoint(
            pitch.metadata,
            pitch.summary,
            chunk,
            url,
          );
        }
      }
    }

    this.logger.log(`Ingestion complete. Processed ${pitches.length} pitches.`);
    return { status: 'success', processed_pitches: pitches.length };
  }
}
