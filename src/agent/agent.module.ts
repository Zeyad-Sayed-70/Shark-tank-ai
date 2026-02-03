import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { AgentQueueService } from './agent-queue.service';
import { AgentQueueController } from './agent-queue.controller';
import { AgentQueueProcessor } from './agent-queue.processor';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    BullModule.registerQueueAsync({
      name: 'agent-queue',
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST') || configService.get<string>('redis.host') || 'localhost',
          port: configService.get<number>('REDIS_PORT') || configService.get<number>('redis.port') || 6379,
          password: configService.get<string>('REDIS_PASSWORD') || configService.get<string>('redis.password'),
          maxRetriesPerRequest: 3,
          enableReadyCheck: false,
          retryStrategy: (times: number) => {
            if (times > 3) {
              return null; // Stop retrying
            }
            return Math.min(times * 1000, 3000);
          },
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 100,
          timeout: 60000, // 60 seconds timeout
        },
        settings: {
          lockDuration: 30000, // 30 seconds
          stalledInterval: 30000,
          maxStalledCount: 1,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AgentController, AgentQueueController],
  providers: [AgentService, AgentQueueService, AgentQueueProcessor],
  exports: [AgentService, AgentQueueService],
})
export class AgentModule {}
