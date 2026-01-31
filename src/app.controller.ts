import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { DataIngestionService } from './data-ingestion/data-ingestion.service';
import { RetrievalService } from './retrieval/retrieval.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly dataIngestionService: DataIngestionService,
    private readonly retrievalService: RetrievalService,
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
    const intent = await this.retrievalService.classifyIntent(query);
    return {
      intent,
      results: await this.retrievalService.search(intent),
    };
  }
}
