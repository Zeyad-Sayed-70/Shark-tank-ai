import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TaskEmbedderService } from './task-embedder.service';
import { VectorStoreService } from '../vector-store/vector-store.service';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockSavePoint = jest.fn().mockResolvedValue('mock-point-id');
const mockVectorStoreService = {
  savePoint: mockSavePoint,
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, string> = {
      'mongodb.uri': 'mongodb://localhost:27017',
      'mongodb.dbName': 'playlist_automation',
      'mongodb.collection': 'tasks',
    };
    return config[key] ?? null;
  }),
};

// Minimal valid payload that matches the real schema
const VALID_PAYLOAD = JSON.stringify({
  meta: {
    company_name: 'Zipz Wine',
    entrepreneurs: ['Andrew McMurray'],
    industry: 'Food & Bev',
    pitch_summary: 'A patented single-serve wine packaging system.',
    season_context: 'Season 6 Episode 11',
    tags: ['Patented', 'Licensing'],
    product_stage: 'Revenue Generating',
  },
  financials: {
    ask_amount: 2500000,
    ask_equity_percentage: 0.1,
    implied_valuation: 25000000,
    margins: { retail_price: 2.99, production_cost: 0.95, gross_margin: 0.68 },
    financial_notes: 'Raised $8.5M before the tank.',
  },
  negotiation_timeline: [
    {
      event_type: 'Offer',
      actor: 'Andrew McMurray',
      details: 'Initial ask: $2.5M for 10%.',
      timestamp_approx: '00:46',
    },
  ],
  dropout_reasons: [
    {
      shark: 'Mark Cuban',
      category: 'Bad Pitch',
      explanation: 'Disagreed with brand name.',
    },
  ],
  analysis: {
    entrepreneur_temperament: 'Data-Driven',
    key_red_flags: ['High capital burn'],
    key_green_flags: ['Robust patented technology'],
  },
  outcome: {
    success: true,
    investors: ["Kevin O'Leary"],
    final_deal_terms: '$2.5M for 10% contingent on Costco deal.',
    deal_structure: 'Equity + Option',
  },
  business_lessons: [
    {
      shark: "Kevin O'Leary",
      principle: 'Power of Purchase Contingency',
      lesson_content: 'Use retail goals as contingencies to protect capital.',
      topic: 'Valuation',
    },
  ],
  verbatim_quote: 'Packaging, packaging, packaging.',
});

const GARBAGE_PAYLOAD =
  'code\nJSON\ndownload\ncontent_copy\nexpand_less\n{\n  "meta": {}...';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TaskEmbedderService', () => {
  let service: TaskEmbedderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskEmbedderService,
        { provide: VectorStoreService, useValue: mockVectorStoreService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<TaskEmbedderService>(TaskEmbedderService);

    // Prevent actual MongoDB connection in unit tests
    jest
      .spyOn(service as any, 'onModuleInit')
      .mockImplementation(async () => {});

    jest.clearAllMocks();
  });

  // ─── isValidJsonPayload ──────────────────────────────────────────────────

  describe('isValidJsonPayload', () => {
    it('returns true for a valid JSON string starting with "{"', () => {
      expect(service.isValidJsonPayload('{"key": "value"}')).toBe(true);
    });

    it('returns true for (whitespace-)padded valid JSON', () => {
      expect(service.isValidJsonPayload('  \n{"key": "value"}')).toBe(true);
    });

    it('returns false for the garbage UI-rendered prefix', () => {
      expect(service.isValidJsonPayload(GARBAGE_PAYLOAD)).toBe(false);
    });

    it('returns false for an empty string', () => {
      expect(service.isValidJsonPayload('')).toBe(false);
    });

    it('returns false for null', () => {
      expect(service.isValidJsonPayload(null)).toBe(false);
    });

    it('returns false for non-string values', () => {
      expect(service.isValidJsonPayload(42)).toBe(false);
    });

    it('returns false for a JSON array (starts with "[")', () => {
      expect(service.isValidJsonPayload('[1, 2, 3]')).toBe(false);
    });

    it('returns false for malformed JSON that starts with "{"', () => {
      expect(service.isValidJsonPayload('{ broken json :')).toBe(false);
    });
  });

  // ─── processUnembeddedTasks ───────────────────────────────────────────────

  describe('processUnembeddedTasks', () => {
    const makeTask = (payload: string) => ({
      _id: { toString: () => 'mock-object-id' } as any,
      status: 'completed',
      payload,
      video_url: 'https://youtube.com/watch?v=test',
      video_title: 'Test Video',
    });

    it('skips tasks with an invalid payload and does not call savePoint', async () => {
      const task = makeTask(GARBAGE_PAYLOAD);
      // Inject a fake collection
      (service as any).tasksCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([task]),
        }),
        updateOne: jest.fn(),
      };

      await service.processUnembeddedTasks();

      expect(mockSavePoint).not.toHaveBeenCalled();
    });

    it('calls savePoint for each non-empty chunk and marks the task as embedded', async () => {
      const task = makeTask(VALID_PAYLOAD);
      const mockUpdateOne = jest.fn().mockResolvedValue({});
      (service as any).tasksCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([task]),
        }),
        updateOne: mockUpdateOne,
      };

      await service.processUnembeddedTasks();

      // Should have saved multiple points (7 chunk types in the valid payload)
      expect(mockSavePoint).toHaveBeenCalled();
      expect(mockSavePoint.mock.calls.length).toBeGreaterThanOrEqual(5);

      // Task should be marked as embedded
      expect(mockUpdateOne).toHaveBeenCalledWith(
        { _id: task._id },
        expect.objectContaining({
          $set: expect.objectContaining({ embedded: true }),
        }),
      );
    });

    it('continues processing other tasks even if one throws', async () => {
      const badTask = makeTask(VALID_PAYLOAD);
      const goodTask = makeTask(VALID_PAYLOAD);
      goodTask._id = { toString: () => 'good-id' } as any;

      let callCount = 0;
      mockSavePoint.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) throw new Error('Qdrant timeout');
        return 'ok';
      });

      const mockUpdateOne = jest.fn().mockResolvedValue({});
      (service as any).tasksCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([badTask, goodTask]),
        }),
        updateOne: mockUpdateOne,
      };

      // Should NOT throw
      await expect(service.processUnembeddedTasks()).resolves.not.toThrow();
    });
  });
});
