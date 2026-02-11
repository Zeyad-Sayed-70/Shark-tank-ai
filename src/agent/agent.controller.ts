import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  Param,
  HttpException,
  HttpStatus,
  Sse,
} from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentQueueService } from './agent-queue.service';
import { Observable, from, map } from 'rxjs';

export class ChatRequestDto {
  message: string;
  sessionId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

@Controller('agent')
export class AgentController {
  constructor(
    private readonly agentService: AgentService,
    private readonly queueService: AgentQueueService,
  ) {}

  @Post('chat')
  async chat(@Body() body: ChatRequestDto) {
    if (!body.message || body.message.trim() === '') {
      throw new HttpException(
        'Message is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // Get session to include conversation history
      const session = body.sessionId 
        ? this.agentService.getSession(body.sessionId)
        : undefined;

      const conversationHistory = session?.messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }));

      // Queue the job
      const jobId = await this.queueService.addChatJob(
        body.message,
        body.sessionId,
        conversationHistory,
        body.userId,
        body.metadata,
      );

      return {
        success: true,
        jobId,
        message: 'Chat request queued successfully',
        statusUrl: `/agent/queue/job/${jobId}`,
        resultUrl: `/agent/queue/job/${jobId}/result`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Failed to process chat request',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Sse('chat/stream')
  async streamChat(@Query() query: { message: string; sessionId?: string }): Promise<Observable<any>> {
    if (!query.message || query.message.trim() === '') {
      throw new HttpException(
        'Message is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const { stream, sessionId } = await this.agentService.streamChat(
        query.message,
        query.sessionId,
      );

      return from(stream).pipe(
        map((chunk) => ({
          data: {
            chunk,
            sessionId,
            timestamp: new Date().toISOString(),
          },
        })),
      );
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Failed to stream chat',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('session/:sessionId')
  getSession(@Param('sessionId') sessionId: string) {
    const session = this.agentService.getSession(sessionId);

    if (!session) {
      throw new HttpException(
        'Session not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      success: true,
      session,
    };
  }

  @Delete('session/:sessionId')
  clearSession(@Param('sessionId') sessionId: string) {
    const deleted = this.agentService.clearSession(sessionId);

    if (!deleted) {
      throw new HttpException(
        'Session not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      success: true,
      message: 'Session cleared successfully',
    };
  }

  @Get('sessions')
  getAllSessions() {
    const sessions = this.agentService.getAllSessions();

    return {
      success: true,
      count: sessions.length,
      sessions: sessions.map((s) => ({
        sessionId: s.sessionId,
        messageCount: s.messages.length,
        createdAt: s.createdAt,
        lastActivity: s.lastActivity,
      })),
    };
  }

  @Get('stats')
  getStats() {
    const stats = this.agentService.getStats();

    return {
      success: true,
      stats,
    };
  }

  @Post('chat/sync')
  async chatSync(@Body() body: ChatRequestDto) {
    if (!body.message || body.message.trim() === '') {
      throw new HttpException(
        'Message is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // Get session to include conversation history
      const session = body.sessionId 
        ? this.agentService.getSession(body.sessionId)
        : undefined;

      const conversationHistory = session?.messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }));

      // Queue the job
      const jobId = await this.queueService.addChatJob(
        body.message,
        body.sessionId,
        conversationHistory,
        body.userId,
        body.metadata,
      );

      // Poll for completion (with timeout)
      const maxWaitTime = 60000; // 60 seconds
      const pollInterval = 500; // 500ms
      const startTime = Date.now();

      while (Date.now() - startTime < maxWaitTime) {
        const jobInfo = await this.queueService.getJobStatus(jobId);

        if (!jobInfo) {
          throw new HttpException(
            'Job not found',
            HttpStatus.NOT_FOUND,
          );
        }

        if (jobInfo.status === 'completed') {
          return {
            success: true,
            response: jobInfo.result?.response,
            sessionId: jobInfo.result?.sessionId,
            entities: jobInfo.result?.entities,
            processingTime: jobInfo.result?.processingTime,
            timestamp: new Date().toISOString(),
          };
        }

        if (jobInfo.status === 'failed') {
          throw new HttpException(
            {
              success: false,
              error: jobInfo.error || jobInfo.failedReason,
              message: 'Job processing failed',
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }

      // Timeout
      throw new HttpException(
        {
          success: false,
          message: 'Request timeout - job is still processing',
          jobId,
          statusUrl: `/agent/queue/job/${jobId}`,
        },
        HttpStatus.REQUEST_TIMEOUT,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Failed to process chat request',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('health')
  healthCheck() {
    return {
      success: true,
      status: 'healthy',
      service: 'Shark Tank AI Agent',
      timestamp: new Date().toISOString(),
    };
  }
}
