import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { SharkTankAgent } from './shark-tank-agent';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { AgentService } from './agent.service';

export interface AgentJobData {
  message: string;
  sessionId?: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface AgentJobResult {
  response: string;
  sessionId: string;
  entities?: any;
  toolsUsed?: string[];
  processingTime: number;
  timestamp: string;
}

@Processor('agent-queue')
export class AgentQueueProcessor {
  private readonly logger = new Logger(AgentQueueProcessor.name);
  private agent: SharkTankAgent;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly agentService: AgentService,
  ) {
    this.agent = new SharkTankAgent(this.httpService, this.configService);
    this.logger.log('Agent Queue Processor initialized');
  }

  @Process('chat')
  async handleChatJob(job: Job<AgentJobData>): Promise<AgentJobResult> {
    const startTime = Date.now();
    this.logger.log(`Processing job ${job.id} for message: "${job.data.message}"`);

    try {
      // Update job progress
      await job.progress(10);

      // Convert conversation history to LangChain messages
      const conversationHistory = (job.data.conversationHistory || []).map((msg) => {
        if (msg.role === 'user') {
          return new HumanMessage(msg.content);
        } else {
          return new AIMessage(msg.content);
        }
      });

      await job.progress(30);

      // Use AgentService to get response with entities
      const result = await this.agentService.chat(
        job.data.message,
        conversationHistory,
      );

      await job.progress(90);

      const processingTime = Date.now() - startTime;

      const jobResult: AgentJobResult = {
        response: result.response,
        sessionId: job.data.sessionId || `session_${Date.now()}`,
        entities: result.entities,
        processingTime,
        timestamp: new Date().toISOString(),
      };

      await job.progress(100);

      this.logger.log(
        `Job ${job.id} completed in ${processingTime}ms`,
      );

      return jobResult;
    } catch (error) {
      this.logger.error(
        `Job ${job.id} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  @Process('batch-chat')
  async handleBatchChatJob(
    job: Job<{ messages: AgentJobData[] }>,
  ): Promise<AgentJobResult[]> {
    const startTime = Date.now();
    this.logger.log(`Processing batch job ${job.id} with ${job.data.messages.length} messages`);

    try {
      const results: AgentJobResult[] = [];
      const totalMessages = job.data.messages.length;

      for (let i = 0; i < totalMessages; i++) {
        const messageData = job.data.messages[i];
        
        // Update progress
        await job.progress(Math.floor((i / totalMessages) * 100));

        // Convert conversation history
        const conversationHistory = (messageData.conversationHistory || []).map((msg) => {
          if (msg.role === 'user') {
            return new HumanMessage(msg.content);
          } else {
            return new AIMessage(msg.content);
          }
        });

        // Get agent response
        const response = await this.agent.chat(
          messageData.message,
          conversationHistory,
        );

        results.push({
          response,
          sessionId: messageData.sessionId || `session_${Date.now()}_${i}`,
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        });
      }

      await job.progress(100);

      const totalTime = Date.now() - startTime;
      this.logger.log(
        `Batch job ${job.id} completed ${totalMessages} messages in ${totalTime}ms`,
      );

      return results;
    } catch (error) {
      this.logger.error(
        `Batch job ${job.id} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }
}
