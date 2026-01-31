import { Module } from '@nestjs/common';
import { RetrievalService } from './retrieval.service';
import { AiModule } from '../ai/ai.module';
import { VectorStoreModule } from '../vector-store/vector-store.module';

@Module({
  imports: [AiModule, VectorStoreModule],
  providers: [RetrievalService],
  exports: [RetrievalService],
})
export class RetrievalModule {}
