import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import * as crypto from 'crypto';

@Injectable()
export class VectorStoreService implements OnModuleInit {
  private client: QdrantClient;
  private readonly COLLECTION_NAME = 'shark_tank_pitches';
  private readonly VECTOR_SIZE = 1024; // mxbai-embed-large output dimension
  private readonly EMBEDDING_MODEL = 'mxbai-embed-large';
  private readonly OLLAMA_URL = 'http://localhost:11434';
  private readonly logger = new Logger(VectorStoreService.name);

  /** Resolves once the Qdrant collection and indexes are fully ready. */
  readonly collectionReady: Promise<void>;
  private resolveCollectionReady!: () => void;
  private rejectCollectionReady!: (err: unknown) => void;

  constructor(private readonly configService: ConfigService) {
    // Set up the ready-promise BEFORE any async work so consumers can await it immediately.
    this.collectionReady = new Promise<void>((resolve, reject) => {
      this.resolveCollectionReady = resolve;
      this.rejectCollectionReady = reject;
    });

    const qdrantUrl = this.configService.get<string>('qdrant.url') ?? '';
    const qdrantApiKey = this.configService.get<string>('qdrant.apiKey');

    // Qdrant cloud runs on HTTPS (port 443). The client defaults to port 6333
    // (local), so we must override it explicitly for cloud instances.
    const isHttps = qdrantUrl.startsWith('https://');
    this.client = new QdrantClient({
      url: qdrantUrl,
      apiKey: qdrantApiKey,
      ...(isHttps ? { port: 443 } : {}),
      checkCompatibility: false,
    });
  }

  async onModuleInit() {
    try {
      await this.ensureCollection();
      await this.ensureIndexes();
      this.resolveCollectionReady();
    } catch (error) {
      this.logger.error('Failed to initialize Qdrant collection', error);
      this.rejectCollectionReady(error);
    }
  }

  // ─── Collection Management ────────────────────────────────────────────────

  private async ensureCollection() {
    const collections = await this.client.getCollections();
    const existing = collections.collections.find(
      (c) => c.name === this.COLLECTION_NAME,
    );

    if (existing) {
      // Fetch collection info to check vector size
      const info = await this.client.getCollection(this.COLLECTION_NAME);
      const currentSize = (info.config?.params?.vectors as any)?.size;

      if (currentSize !== this.VECTOR_SIZE) {
        this.logger.warn(
          `Collection has vector size ${currentSize}, expected ${this.VECTOR_SIZE}. Recreating…`,
        );
        await this.client.deleteCollection(this.COLLECTION_NAME);
        await this.createCollection();
      } else {
        this.logger.log(`Collection "${this.COLLECTION_NAME}" is ready`);
      }
    } else {
      await this.createCollection();
    }
  }

  private async createCollection() {
    this.logger.log(
      `Creating collection "${this.COLLECTION_NAME}" (${this.VECTOR_SIZE} dims, Cosine)`,
    );
    await this.client.createCollection(this.COLLECTION_NAME, {
      vectors: {
        size: this.VECTOR_SIZE,
        distance: 'Cosine',
      },
    });
  }

  // ─── Payload Indexes ──────────────────────────────────────────────────────

  private async ensureIndexes() {
    this.logger.log('Ensuring payload indexes…');

    const keywordFields = [
      'investor_name',
      'industry',
      'company',
      'entrepreneur',
      'company_name',
      'tags',
      'season_context',
      'chunk_type',
      'task_id',
      'video_url',
    ];

    const boolFields = ['deal_made', 'outcome_success'];
    const floatFields = [
      'ask_amount',
      'equity_offered',
      'valuation',
      'implied_valuation',
    ];

    for (const field of keywordFields) {
      await this.safeCreateIndex(field, 'keyword');
    }
    for (const field of boolFields) {
      await this.safeCreateIndex(field, 'bool');
    }
    for (const field of floatFields) {
      await this.safeCreateIndex(field, 'float');
    }

    this.logger.log('All payload indexes ensured');
  }

  private async safeCreateIndex(field: string, schema: string) {
    try {
      await this.client.createPayloadIndex(this.COLLECTION_NAME, {
        field_name: field,
        field_schema: schema as any,
      });
    } catch (error) {
      if (!error.message?.includes('already exists')) {
        this.logger.warn(
          `Could not create index for "${field}": ${error.message}`,
        );
      }
    }
  }

  async setupIndexes() {
    await this.ensureIndexes();
  }

  // ─── Embedding ────────────────────────────────────────────────────────────

  async getEmbeddings(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('Cannot generate embeddings for empty text');
    }

    try {
      const response = await fetch(`${this.OLLAMA_URL}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.EMBEDDING_MODEL,
          input: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      const embedding = data.embeddings?.[0] || data.embedding;
      
      if (!embedding || embedding.length === 0) {
        throw new Error('Ollama returned empty embedding');
      }
      
      return embedding;
    } catch (error) {
      this.logger.error(`Error generating embedding: ${error.message}`);
      throw error;
    }
  }

  // ─── Save / Search ────────────────────────────────────────────────────────

  async savePoint(
    metadata: any,
    summary: string,
    chunkText: string,
    videoUrl: string,
  ) {
    const embedding = await this.getEmbeddings(chunkText);
    const pointId = crypto.randomUUID();

    await this.client.upsert(this.COLLECTION_NAME, {
      points: [
        {
          id: pointId,
          vector: embedding,
          payload: {
            ...metadata,
            parent_summary: summary,
            chunk_text: chunkText,
            video_url: videoUrl,
          },
        },
      ],
    });

    return pointId;
  }

  async search(queryText: string, filter?: any, limit: number = 5) {
    // If no query text, use a generic query for browsing
    const searchText = queryText && queryText.trim().length > 0 
      ? queryText 
      : 'shark tank pitch deal';
    
    const vector = await this.getEmbeddings(searchText);

    const searchParams: any = {
      vector,
      limit,
      with_payload: true,
    };

    if (filter) {
      searchParams.filter = filter;
    }

    return await this.client.search(this.COLLECTION_NAME, searchParams);
  }
}
