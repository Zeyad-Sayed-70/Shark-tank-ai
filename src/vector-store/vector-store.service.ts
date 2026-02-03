import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import * as crypto from 'crypto';

@Injectable()
export class VectorStoreService implements OnModuleInit {
  private client: QdrantClient;
  private readonly COLLECTION_NAME = 'shark_tank_pitches';
  private readonly logger = new Logger(VectorStoreService.name);

  constructor(private readonly configService: ConfigService) {
    this.client = new QdrantClient({
      url: this.configService.get<string>('qdrant.url'),
      apiKey: this.configService.get<string>('qdrant.apiKey'),
    });
  }

  async onModuleInit() {
    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(
        (c) => c.name === this.COLLECTION_NAME,
      );

      if (!exists) {
        this.logger.log(`Creating collection: ${this.COLLECTION_NAME}`);
        await this.client.createCollection(this.COLLECTION_NAME, {
          vectors: {
            size: 4, // Mock embedding size
            distance: 'Cosine',
          },
        });
      } else {
        this.logger.log(`Collection ${this.COLLECTION_NAME} already exists`);
      }

      // Always ensure indexes exist (safe to call even if they already exist)
      await this.ensureIndexes();
    } catch (error) {
      this.logger.error('Failed to initialize Qdrant collection', error);
    }
  }

  private async ensureIndexes() {
    try {
      this.logger.log('Ensuring indexes for filterable fields...');

      // String fields (keyword index)
      const stringFields = [
        'investor_name',
        'industry',
        'company',
        'entrepreneur',
      ];

      for (const field of stringFields) {
        try {
          await this.client.createPayloadIndex(this.COLLECTION_NAME, {
            field_name: field,
            field_schema: 'keyword',
          });
          this.logger.log(`Created index for ${field}`);
        } catch (error) {
          // Index might already exist, that's okay
          if (!error.message?.includes('already exists')) {
            this.logger.warn(`Could not create index for ${field}:`, error.message);
          }
        }
      }

      // Boolean field
      try {
        await this.client.createPayloadIndex(this.COLLECTION_NAME, {
          field_name: 'deal_made',
          field_schema: 'bool',
        });
        this.logger.log('Created index for deal_made');
      } catch (error) {
        if (!error.message?.includes('already exists')) {
          this.logger.warn('Could not create index for deal_made:', error.message);
        }
      }

      // Integer fields
      const integerFields = ['season', 'episode'];
      for (const field of integerFields) {
        try {
          await this.client.createPayloadIndex(this.COLLECTION_NAME, {
            field_name: field,
            field_schema: 'integer',
          });
          this.logger.log(`Created index for ${field}`);
        } catch (error) {
          if (!error.message?.includes('already exists')) {
            this.logger.warn(`Could not create index for ${field}:`, error.message);
          }
        }
      }

      // Float/Number fields
      const floatFields = ['valuation', 'ask_amount', 'equity_offered'];
      for (const field of floatFields) {
        try {
          await this.client.createPayloadIndex(this.COLLECTION_NAME, {
            field_name: field,
            field_schema: 'float',
          });
          this.logger.log(`Created index for ${field}`);
        } catch (error) {
          if (!error.message?.includes('already exists')) {
            this.logger.warn(`Could not create index for ${field}:`, error.message);
          }
        }
      }

      this.logger.log('All indexes ensured successfully');
    } catch (error) {
      this.logger.error('Failed to ensure indexes', error);
    }
  }

  // Public method to manually trigger index setup
  async setupIndexes() {
    await this.ensureIndexes();
  }

  async savePoint(
    metadata: any,
    summary: string,
    chunkText: string,
    videoUrl: string,
  ) {
    const embedding = this.getEmbeddings(chunkText);
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

  async search(queryText: string, filter?: any) {
    const vector = this.getEmbeddings(queryText);

    // Basic search payload
    const searchParams: any = {
      vector,
      limit: 5,
      with_payload: true,
    };

    if (filter) {
      searchParams.filter = filter;
    }

    return await this.client.search(this.COLLECTION_NAME, searchParams);
  }

  getEmbeddings(text: string): number[] {
    // Mock embedding generation: Random vector of size 4
    return Array.from({ length: 4 }, () => Math.random());
  }
}
