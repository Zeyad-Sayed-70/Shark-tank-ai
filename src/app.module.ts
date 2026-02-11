import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { DataIngestionModule } from './data-ingestion/data-ingestion.module';
import { RetrievalModule } from './retrieval/retrieval.module';
import { YoutubeModule } from './youtube/youtube.module';
import { AiModule } from './ai/ai.module';
import { VectorStoreModule } from './vector-store/vector-store.module';
import { AgentModule } from './agent/agent.module';
import { DealsModule } from './deals/deals.module';
import { SharksModule } from './sharks/sharks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    YoutubeModule,
    AiModule,
    VectorStoreModule,
    DataIngestionModule,
    RetrievalModule,
    AgentModule,
    DealsModule,
    SharksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
