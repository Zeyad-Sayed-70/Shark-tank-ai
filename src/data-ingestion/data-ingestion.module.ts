import { Module } from '@nestjs/common';
import { DataIngestionService } from './data-ingestion.service';
import { YoutubeModule } from '../youtube/youtube.module';
import { AiModule } from '../ai/ai.module';
import { VectorStoreModule } from '../vector-store/vector-store.module';

@Module({
  imports: [YoutubeModule, AiModule, VectorStoreModule],
  providers: [DataIngestionService],
  exports: [DataIngestionService],
})
export class DataIngestionModule {}
