import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue, Job, JobStatus } from 'bull';
import { AgentJobData, AgentJobResult } from './agent-queue.processor';

export interface JobInfo {
  id: string;
  status: JobStatus | 'stuck';
  progress: number;
  data: AgentJobData;
  result?: AgentJobResult;
  error?: string;
  createdAt: Date;
  processedAt?: Date;
  finishedAt?: Date;
  attemptsMade: number;
  failedReason?: string;
}

@Injectable()
export class AgentQueueService {
  private readonly logger = new Logger(AgentQueueService.name);

  constructor(
    @InjectQueue('agent-queue')
    private readonly agentQueue: Queue,
  ) {}

  async addChatJob(
    message: string,
    sessionId?: string,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
    userId?: string,
    metadata?: Record<string, any>,
  ): Promise<string> {
    const jobData: AgentJobData = {
      message,
      sessionId,
      conversationHistory,
      userId,
      metadata,
    };

    const job = await this.agentQueue.add('chat', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: false, // Keep completed jobs for retrieval
      removeOnFail: false, // Keep failed jobs for debugging
    });

    this.logger.log(`Added chat job ${job.id} for user ${userId || 'anonymous'}`);

    return job.id.toString();
  }

  async addBatchChatJob(
    messages: AgentJobData[],
    userId?: string,
  ): Promise<string> {
    const job = await this.agentQueue.add(
      'batch-chat',
      { messages },
      {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
        removeOnComplete: false,
        removeOnFail: false,
      },
    );

    this.logger.log(
      `Added batch chat job ${job.id} with ${messages.length} messages for user ${userId || 'anonymous'}`,
    );

    return job.id.toString();
  }

  async getJobStatus(jobId: string): Promise<JobInfo | null> {
    try {
      const job = await this.agentQueue.getJob(jobId);

      if (!job) {
        return null;
      }

      const state = await job.getState();
      const progress = await job.progress();

      const jobInfo: JobInfo = {
        id: job.id.toString(),
        status: state,
        progress: typeof progress === 'number' ? progress : 0,
        data: job.data,
        createdAt: new Date(job.timestamp),
        processedAt: job.processedOn ? new Date(job.processedOn) : undefined,
        finishedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
        attemptsMade: job.attemptsMade,
        failedReason: job.failedReason,
      };

      // Add result if completed
      if (state === 'completed') {
        jobInfo.result = job.returnvalue;
      }

      // Add error if failed
      if (state === 'failed' && job.stacktrace) {
        jobInfo.error = job.stacktrace[0];
      }

      return jobInfo;
    } catch (error) {
      this.logger.error(`Error getting job ${jobId}: ${error}`);
      return null;
    }
  }

  async getJobResult(jobId: string): Promise<AgentJobResult | null> {
    try {
      const job = await this.agentQueue.getJob(jobId);

      if (!job) {
        return null;
      }

      const state = await job.getState();

      if (state === 'completed') {
        return job.returnvalue;
      }

      return null;
    } catch (error) {
      this.logger.error(`Error getting job result ${jobId}: ${error}`);
      return null;
    }
  }

  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const job = await this.agentQueue.getJob(jobId);

      if (!job) {
        return false;
      }

      const state = await job.getState();

      if (state === 'active' || state === 'waiting' || state === 'delayed') {
        await job.remove();
        this.logger.log(`Cancelled job ${jobId}`);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Error cancelling job ${jobId}: ${error}`);
      return false;
    }
  }

  async retryJob(jobId: string): Promise<boolean> {
    try {
      const job = await this.agentQueue.getJob(jobId);

      if (!job) {
        return false;
      }

      const state = await job.getState();

      if (state === 'failed') {
        await job.retry();
        this.logger.log(`Retrying job ${jobId}`);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Error retrying job ${jobId}: ${error}`);
      return false;
    }
  }

  async getQueueStats() {
    const [
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused,
    ] = await Promise.all([
      this.agentQueue.getWaitingCount(),
      this.agentQueue.getActiveCount(),
      this.agentQueue.getCompletedCount(),
      this.agentQueue.getFailedCount(),
      this.agentQueue.getDelayedCount(),
      this.agentQueue.getPausedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused,
      total: waiting + active + completed + failed + delayed + paused,
    };
  }

  async getRecentJobs(limit: number = 10, status?: JobStatus) {
    let jobs: Job[] = [];

    if (status) {
      switch (status) {
        case 'completed':
          jobs = await this.agentQueue.getCompleted(0, limit - 1);
          break;
        case 'failed':
          jobs = await this.agentQueue.getFailed(0, limit - 1);
          break;
        case 'active':
          jobs = await this.agentQueue.getActive(0, limit - 1);
          break;
        case 'waiting':
          jobs = await this.agentQueue.getWaiting(0, limit - 1);
          break;
        case 'delayed':
          jobs = await this.agentQueue.getDelayed(0, limit - 1);
          break;
        default:
          jobs = await this.agentQueue.getJobs(['completed', 'failed', 'active', 'waiting'], 0, limit - 1);
      }
    } else {
      jobs = await this.agentQueue.getJobs(['completed', 'failed', 'active', 'waiting'], 0, limit - 1);
    }

    const jobInfos: JobInfo[] = [];

    for (const job of jobs) {
      const state = await job.getState();
      const progress = await job.progress();

      jobInfos.push({
        id: job.id.toString(),
        status: state,
        progress: typeof progress === 'number' ? progress : 0,
        data: job.data,
        result: state === 'completed' ? job.returnvalue : undefined,
        error: state === 'failed' && job.stacktrace ? job.stacktrace[0] : undefined,
        createdAt: new Date(job.timestamp),
        processedAt: job.processedOn ? new Date(job.processedOn) : undefined,
        finishedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
        attemptsMade: job.attemptsMade,
        failedReason: job.failedReason,
      });
    }

    return jobInfos;
  }

  async cleanOldJobs(olderThanMs: number = 24 * 60 * 60 * 1000) {
    // Clean jobs older than specified time (default: 24 hours)
    await this.agentQueue.clean(olderThanMs, 'completed');
    await this.agentQueue.clean(olderThanMs, 'failed');
    
    this.logger.log(`Cleaned jobs older than ${olderThanMs}ms`);
  }

  async pauseQueue() {
    await this.agentQueue.pause();
    this.logger.log('Queue paused');
  }

  async resumeQueue() {
    await this.agentQueue.resume();
    this.logger.log('Queue resumed');
  }
}
