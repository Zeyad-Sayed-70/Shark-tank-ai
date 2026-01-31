import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { DataIngestionModule } from './data-ingestion/data-ingestion.module';
import { RetrievalModule } from './retrieval/retrieval.module';
import { YoutubeModule } from './youtube/youtube.module';
import { AiModule } from './ai/ai.module';
import { VectorStoreModule } from './vector-store/vector-store.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    YoutubeModule,
    AiModule,
    VectorStoreModule,
    DataIngestionModule,
    RetrievalModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
