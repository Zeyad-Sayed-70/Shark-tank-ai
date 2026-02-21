import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { MongoClient, Collection, ObjectId } from 'mongodb';
import { VectorStoreService } from '../vector-store/vector-store.service';

/** Shape of a task document from MongoDB */
interface TaskDocument {
  _id: ObjectId;
  status: string;
  payload: string;
  video_url?: string;
  video_title?: string;
  video_thumbnail_url?: string;
  video_duration?: string;
  embedded?: boolean;
  [key: string]: any;
}

@Injectable()
export class TaskEmbedderService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TaskEmbedderService.name);
  private mongoClient: MongoClient;
  private tasksCollection: Collection<TaskDocument>;

  constructor(
    private readonly configService: ConfigService,
    private readonly vectorStoreService: VectorStoreService,
  ) {}

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  async onModuleInit() {
    const uri =
      this.configService.get<string>('mongodb.uri') ??
      'mongodb://localhost:27017';
    const dbName =
      this.configService.get<string>('mongodb.dbName') ?? 'playlist_automation';
    const collectionName =
      this.configService.get<string>('mongodb.collection') ?? 'tasks';

    this.mongoClient = new MongoClient(uri);
    await this.mongoClient.connect();
    this.tasksCollection = this.mongoClient
      .db(dbName)
      .collection<TaskDocument>(collectionName);

    this.logger.log(`Connected to MongoDB: ${dbName}.${collectionName}`);

    // Wait for VectorStoreService to finish creating/verifying the Qdrant
    // collection before we attempt any upserts — both onModuleInit hooks run
    // in parallel, so without this guard we'd get a 404 Not Found.
    this.logger.log('Waiting for Qdrant collection to be ready…');
    await this.vectorStoreService.collectionReady;
    this.logger.log('Qdrant collection ready — starting embedding run');

    // Run immediately on startup so we don't wait 5 min for first run
    await this.processUnembeddedTasks();
  }

  async onModuleDestroy() {
    await this.mongoClient?.close();
    this.logger.log('MongoDB connection closed');
  }

  // ─── Cron Job ─────────────────────────────────────────────────────────────

  @Cron('*/5 * * * *')
  async scheduledEmbedding() {
    this.logger.log('Cron: checking for unembedded tasks…');
    await this.processUnembeddedTasks();
  }

  // ─── Core Logic ───────────────────────────────────────────────────────────

  async processUnembeddedTasks(): Promise<void> {
    const tasks = await this.tasksCollection
      .find({ status: 'completed', embedded: { $ne: true } })
      .toArray();

    if (tasks.length === 0) {
      this.logger.log('No unembedded tasks found');
      return;
    }

    this.logger.log(`Found ${tasks.length} unembedded task(s)`);
    for (const task of tasks) {
      try {
        await this.embedTask(task);
      } catch (err) {
        this.logger.error(
          `Failed to embed task ${task._id}: ${err.message}`,
          err.stack,
        );
      }
    }
  }

  private async embedTask(task: TaskDocument): Promise<void> {
    if (!this.isValidJsonPayload(task.payload)) {
      // this.logger.warn(
      //   `Task ${task._id} skipped — payload is not valid JSON (likely raw UI text)`,
      // );
      return;
    }

    const parsed = JSON.parse(task.payload);
    const videoUrl = task.video_url ?? '';
    const videoTitle = task.video_title ?? '';

    // Build shared base metadata attached to every Qdrant point
    const baseMetadata = this.buildBaseMetadata(parsed, task);

    const chunks = this.buildChunks(parsed);
    let savedCount = 0;

    for (const { chunkType, text } of chunks) {
      if (!text || text.trim().length === 0) continue;

      await this.vectorStoreService.savePoint(
        { ...baseMetadata, chunk_type: chunkType },
        parsed.meta?.pitch_summary ?? '',
        text,
        videoUrl,
      );
      savedCount++;
    }

    // Mark task as embedded in MongoDB
    await this.tasksCollection.updateOne(
      { _id: task._id },
      {
        $set: {
          embedded: true,
          embedded_at: new Date(),
        },
      },
    );

    this.logger.log(
      `Task ${task._id} (${parsed.meta?.company_name ?? 'unknown'}) → ${savedCount} point(s) stored in Qdrant`,
    );
  }

  // ─── Validation ───────────────────────────────────────────────────────────

  /**
   * Returns true only when the payload is a string that:
   *  1. Starts with '{' (after trimming whitespace)
   *  2. Is valid JSON
   *
   * Rejects the garbage "code\nJSON\ndownload\ncontent_copy\nexpand_less\n{..."
   * pattern that appears when the AI returns UI-rendered text instead of raw JSON.
   */
  isValidJsonPayload(payload: unknown): boolean {
    if (typeof payload !== 'string' || payload.trim().length === 0) {
      return false;
    }

    if (!payload.trimStart().startsWith('{')) {
      return false;
    }

    try {
      JSON.parse(payload);
      return true;
    } catch {
      return false;
    }
  }

  // ─── Embeddable Text Chunks ───────────────────────────────────────────────

  /**
   * Breaks the payload into semantically distinct text chunks.
   * Each chunk becomes one Qdrant point, letting the retriever
   * surface the most relevant section of a pitch.
   */
  private buildChunks(parsed: any): Array<{ chunkType: string; text: string }> {
    const chunks: Array<{ chunkType: string; text: string }> = [];
    const meta = parsed.meta ?? {};
    const financials = parsed.financials ?? {};
    const outcome = parsed.outcome ?? {};
    const analysis = parsed.analysis ?? {};

    // 1. Pitch summary — high-level overview
    if (meta.pitch_summary) {
      chunks.push({
        chunkType: 'pitch_summary',
        text: [
          `Company: ${meta.company_name ?? 'Unknown'}`,
          `Industry: ${meta.industry ?? 'Unknown'}`,
          `Season: ${meta.season_context ?? 'Unknown'}`,
          `Tags: ${(meta.tags ?? []).join(', ')}`,
          `Stage: ${meta.product_stage ?? 'Unknown'}`,
          '',
          meta.pitch_summary,
        ].join('\n'),
      });
    }

    // 2. Financials & deal terms
    const finText = [
      `Ask: $${financials.ask_amount?.toLocaleString()} for ${(financials.ask_equity_percentage * 100).toFixed(1)}% equity`,
      `Implied valuation: $${financials.implied_valuation?.toLocaleString()}`,
      `Gross margin: ${((financials.margins?.gross_margin ?? 0) * 100).toFixed(1)}%`,
      `Retail price: $${financials.margins?.retail_price ?? 'N/A'}`,
      `Production cost: $${financials.margins?.production_cost ?? 'N/A'}`,
      financials.financial_notes ? `Notes: ${financials.financial_notes}` : '',
      outcome.success
        ? `DEAL MADE with ${(outcome.investors ?? []).join(', ')} — ${outcome.final_deal_terms}`
        : 'No deal made',
    ]
      .filter(Boolean)
      .join('\n');

    if (finText.trim()) {
      chunks.push({ chunkType: 'financials', text: finText });
    }

    // 3. Negotiation timeline narrative
    const timeline: any[] = parsed.negotiation_timeline ?? [];
    if (timeline.length > 0) {
      const timelineText = timeline
        .map(
          (e) =>
            `[${e.timestamp_approx ?? '??'}] ${e.actor} (${e.event_type}): ${e.details}`,
        )
        .join('\n');

      chunks.push({
        chunkType: 'negotiation_timeline',
        text: `Negotiation timeline for ${meta.company_name}:\n${timelineText}`,
      });
    }

    // 4. Dropout reasons
    const dropouts: any[] = parsed.dropout_reasons ?? [];
    if (dropouts.length > 0) {
      const dropoutText = dropouts
        .map((d) => `${d.shark} dropped out (${d.category}): ${d.explanation}`)
        .join('\n');

      chunks.push({
        chunkType: 'dropout_reasons',
        text: `Shark dropout reasons for ${meta.company_name}:\n${dropoutText}`,
      });
    }

    // 5. Analysis — red flags & green flags
    const redFlags: string[] = analysis.key_red_flags ?? [];
    const greenFlags: string[] = analysis.key_green_flags ?? [];
    if (redFlags.length > 0 || greenFlags.length > 0) {
      const analysisText = [
        `Entrepreneur temperament: ${analysis.entrepreneur_temperament ?? 'Unknown'}`,
        redFlags.length > 0
          ? `Red flags:\n${redFlags.map((f) => `  - ${f}`).join('\n')}`
          : '',
        greenFlags.length > 0
          ? `Green flags:\n${greenFlags.map((f) => `  - ${f}`).join('\n')}`
          : '',
      ]
        .filter(Boolean)
        .join('\n');

      chunks.push({ chunkType: 'analysis', text: analysisText });
    }

    // 6. Business lessons
    const lessons: any[] = parsed.business_lessons ?? [];
    if (lessons.length > 0) {
      const lessonsText = lessons
        .map(
          (l) =>
            `[${l.shark}] "${l.principle}" (${l.topic}): ${l.lesson_content}`,
        )
        .join('\n\n');

      chunks.push({
        chunkType: 'business_lessons',
        text: `Business lessons from ${meta.company_name}:\n${lessonsText}`,
      });
    }

    // 7. Verbatim quote
    if (parsed.verbatim_quote) {
      chunks.push({
        chunkType: 'verbatim_quote',
        text: `Verbatim quote from ${meta.company_name}: "${parsed.verbatim_quote}"`,
      });
    }

    return chunks;
  }

  // ─── Metadata ─────────────────────────────────────────────────────────────

  private buildBaseMetadata(
    parsed: any,
    task: TaskDocument,
  ): Record<string, any> {
    const meta = parsed.meta ?? {};
    const financials = parsed.financials ?? {};
    const outcome = parsed.outcome ?? {};

    return {
      // Identifiers
      task_id: task._id.toString(),
      video_url: task.video_url ?? '',
      video_title: task.video_title ?? '',
      video_thumbnail_url: task.video_thumbnail_url ?? '',
      video_duration: task.video_duration ?? '',

      // Company info
      company_name: meta.company_name ?? '',
      entrepreneurs: (meta.entrepreneurs ?? []).join(', '),
      industry: meta.industry ?? '',
      season_context: meta.season_context ?? '',
      tags: meta.tags ?? [],
      product_stage: meta.product_stage ?? '',

      // Financials (for filtering)
      ask_amount: financials.ask_amount ?? 0,
      equity_offered: financials.ask_equity_percentage ?? 0,
      implied_valuation: financials.implied_valuation ?? 0,

      // Outcome (for filtering)
      outcome_success: outcome.success ?? false,
      investors: (outcome.investors ?? []).join(', '),
      final_deal_terms: outcome.final_deal_terms ?? '',
      deal_structure: outcome.deal_structure ?? '',
    };
  }
}
