import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AgentQueueService } from './agent-queue.service';
import { AgentJobData } from './agent-queue.processor';

export class QueueChatRequestDto {
  message: string;
  sessionId?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  userId?: string;
  metadata?: Record<string, any>;
}

export class BatchChatRequestDto {
  messages: AgentJobData[];
  userId?: string;
}

@Controller('agent/queue')
export class AgentQueueController {
  constructor(private readonly queueService: AgentQueueService) {}

  @Post('chat')
  async queueChat(@Body() body: QueueChatRequestDto) {
    if (!body.message || body.message.trim() === '') {
      throw new HttpException(
        'Message is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const jobId = await this.queueService.addChatJob(
        body.message,
        body.sessionId,
        body.conversationHistory,
        body.userId,
        body.metadata,
      );

      return {
        success: true,
        jobId,
        message: 'Chat job queued successfully',
        statusUrl: `/agent/queue/job/${jobId}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Failed to queue chat job',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('batch')
  async queueBatchChat(@Body() body: BatchChatRequestDto) {
    if (!body.messages || body.messages.length === 0) {
      throw new HttpException(
        'Messages array is required and cannot be empty',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const jobId = await this.queueService.addBatchChatJob(
        body.messages,
        body.userId,
      );

      return {
        success: true,
        jobId,
        messageCount: body.messages.length,
        message: 'Batch chat job queued successfully',
        statusUrl: `/agent/queue/job/${jobId}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Failed to queue batch chat job',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('job/:jobId')
  async getJobStatus(@Param('jobId') jobId: string) {
    const jobInfo = await this.queueService.getJobStatus(jobId);

    if (!jobInfo) {
      throw new HttpException(
        'Job not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      success: true,
      job: jobInfo,
    };
  }

  @Get('job/:jobId/result')
  async getJobResult(@Param('jobId') jobId: string) {
    const result = await this.queueService.getJobResult(jobId);

    if (!result) {
      const jobInfo = await this.queueService.getJobStatus(jobId);
      
      if (!jobInfo) {
        throw new HttpException(
          'Job not found',
          HttpStatus.NOT_FOUND,
        );
      }

      if (jobInfo.status === 'active' || jobInfo.status === 'waiting') {
        return {
          success: false,
          message: 'Job is still processing',
          status: jobInfo.status,
          progress: jobInfo.progress,
        };
      }

      if (jobInfo.status === 'failed') {
        return {
          success: false,
          message: 'Job failed',
          error: jobInfo.error || jobInfo.failedReason,
        };
      }

      throw new HttpException(
        'Job result not available',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      success: true,
      result,
    };
  }

  @Delete('job/:jobId')
  async cancelJob(@Param('jobId') jobId: string) {
    const cancelled = await this.queueService.cancelJob(jobId);

    if (!cancelled) {
      throw new HttpException(
        'Job not found or cannot be cancelled',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      success: true,
      message: 'Job cancelled successfully',
    };
  }

  @Post('job/:jobId/retry')
  async retryJob(@Param('jobId') jobId: string) {
    const retried = await this.queueService.retryJob(jobId);

    if (!retried) {
      throw new HttpException(
        'Job not found or cannot be retried',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      success: true,
      message: 'Job retry initiated',
    };
  }

  @Get('stats')
  async getQueueStats() {
    const stats = await this.queueService.getQueueStats();

    return {
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('jobs')
  async getRecentJobs(
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const jobs = await this.queueService.getRecentJobs(
      limitNum,
      status as any,
    );

    return {
      success: true,
      count: jobs.length,
      jobs,
    };
  }

  @Post('clean')
  async cleanOldJobs(@Query('olderThan') olderThan?: string) {
    const olderThanMs = olderThan
      ? parseInt(olderThan, 10)
      : 24 * 60 * 60 * 1000; // Default: 24 hours

    await this.queueService.cleanOldJobs(olderThanMs);

    return {
      success: true,
      message: `Cleaned jobs older than ${olderThanMs}ms`,
    };
  }

  @Post('pause')
  async pauseQueue() {
    await this.queueService.pauseQueue();

    return {
      success: true,
      message: 'Queue paused',
    };
  }

  @Post('resume')
  async resumeQueue() {
    await this.queueService.resumeQueue();

    return {
      success: true,
      message: 'Queue resumed',
    };
  }

  @Get('health')
  async healthCheck() {
    const stats = await this.queueService.getQueueStats();

    return {
      success: true,
      status: 'healthy',
      service: 'Agent Queue',
      stats,
      timestamp: new Date().toISOString(),
    };
  }
}
