import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { DataIngestionService } from './data-ingestion/data-ingestion.service';
import { RetrievalService } from './retrieval/retrieval.service';
import { VectorStoreService } from './vector-store/vector-store.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly dataIngestionService: DataIngestionService,
    private readonly retrievalService: RetrievalService,
    private readonly vectorStoreService: VectorStoreService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('ingest')
  async ingest(@Body('youtube_url') youtubeUrl: string) {
    return await this.dataIngestionService.ingestVideo(youtubeUrl);
  }

  @Get('search')
  async search(@Query('q') query: string) {
    if (!query) {
      return {
        error: 'Query parameter "q" is required',
        example: '/search?q=Show me Mark Cuban deals',
      };
    }

    const intent = await this.retrievalService.classifyIntent(query);
    const results = await this.retrievalService.search(intent);

    return {
      query,
      intent,
      results,
      count: results.length,
    };
  }

  @Post('search')
  async searchPost(@Body('query') query: string) {
    if (!query) {
      return {
        error: 'Body parameter "query" is required',
        example: { query: 'Show me Mark Cuban deals' },
      };
    }

    const intent = await this.retrievalService.classifyIntent(query);
    const results = await this.retrievalService.search(intent);

    return {
      query,
      intent,
      results,
      count: results.length,
    };
  }

  @Post('setup-indexes')
  async setupIndexes() {
    await this.vectorStoreService.setupIndexes();
    return {
      status: 'success',
      message: 'Indexes created successfully',
    };
  }
}
