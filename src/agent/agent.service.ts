import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { SharkTankAgent } from './shark-tank-agent';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { EntityExtractionService, ExtractedEntities } from './entity-extraction.service';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface ConversationSession {
  sessionId: string;
  messages: ChatMessage[];
  createdAt: Date;
  lastActivity: Date;
  metadata?: {
    totalMessages: number;
    companiesMentioned: string[];
    sharksMentioned: string[];
    lastDealDiscussed?: {
      company: string;
      timestamp: Date;
    };
  };
}

@Injectable()
export class AgentService implements OnModuleInit {
  private readonly logger = new Logger(AgentService.name);
  private agent: SharkTankAgent;
  private sessions: Map<string, ConversationSession> = new Map();
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly entityExtractionService: EntityExtractionService,
  ) {}

  onModuleInit() {
    this.logger.log('Initializing Shark Tank AI Agent...');
    this.agent = new SharkTankAgent(this.httpService, this.configService);
    this.logger.log('Shark Tank AI Agent initialized successfully');
    
    // Start session cleanup interval
    this.startSessionCleanup();
  }

  private startSessionCleanup() {
    setInterval(() => {
      const now = Date.now();
      const expiredSessions: string[] = [];

      this.sessions.forEach((session, sessionId) => {
        if (now - session.lastActivity.getTime() > this.SESSION_TIMEOUT) {
          expiredSessions.push(sessionId);
        }
      });

      expiredSessions.forEach((sessionId) => {
        this.sessions.delete(sessionId);
        this.logger.log(`Cleaned up expired session: ${sessionId}`);
      });

      if (expiredSessions.length > 0) {
        this.logger.log(`Cleaned up ${expiredSessions.length} expired sessions`);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  async chat(
    message: string,
    conversationHistory: BaseMessage[] = [],
  ): Promise<{ response: string; entities?: ExtractedEntities }> {
    try {
      // Get agent response with conversation history
      const response = await this.agent.chat(message, conversationHistory);

      // Extract entities from response
      let entities: ExtractedEntities | undefined;
      try {
        entities = await this.entityExtractionService.extractEntities(response);
      } catch (error) {
        this.logger.warn('Failed to extract entities:', error);
      }

      return {
        response,
        entities,
      };
    } catch (error) {
      this.logger.error('Error in chat:', error);
      throw error;
    }
  }

  // Legacy method for backward compatibility with sessions
  async chatWithSession(
    message: string,
    sessionId?: string,
  ): Promise<{ response: string; sessionId: string; entities?: ExtractedEntities }> {
    try {
      // Get or create session
      const session = this.getOrCreateSession(sessionId);

      // Add user message to session
      session.messages.push({
        role: 'user',
        content: message,
        timestamp: new Date(),
      });

      // Convert session messages to LangChain format
      const conversationHistory = this.convertToLangChainMessages(
        session.messages.slice(0, -1), // Exclude the current message
      );

      // Get agent response
      const result = await this.chat(message, conversationHistory);

      // Update session metadata
      if (result.entities) {
        if (result.entities.companies.length > 0) {
          if (!session.metadata) {
            session.metadata = {
              totalMessages: 0,
              companiesMentioned: [],
              sharksMentioned: [],
            };
          }
          session.metadata.companiesMentioned = [
            ...new Set([...session.metadata.companiesMentioned, ...result.entities.companies]),
          ];
          
          if (result.entities.deals.length > 0) {
            session.metadata.lastDealDiscussed = {
              company: result.entities.deals[0].company,
              timestamp: new Date(),
            };
          }
        }
        
        if (result.entities.sharks.some(s => s.mentioned)) {
          if (!session.metadata) {
            session.metadata = {
              totalMessages: 0,
              companiesMentioned: [],
              sharksMentioned: [],
            };
          }
          const mentionedSharkNames = result.entities.sharks
            .filter(s => s.mentioned)
            .map(s => s.name);
          session.metadata.sharksMentioned = [
            ...new Set([...session.metadata.sharksMentioned, ...mentionedSharkNames]),
          ];
        }
      }

      // Add assistant response to session
      session.messages.push({
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
      });

      // Update session activity and metadata
      session.lastActivity = new Date();
      if (session.metadata) {
        session.metadata.totalMessages = session.messages.length;
      }

      return {
        response: result.response,
        sessionId: session.sessionId,
        entities: result.entities,
      };
    } catch (error) {
      this.logger.error('Error in chat:', error);
      throw error;
    }
  }

  async streamChat(message: string, sessionId?: string) {
    const session = this.getOrCreateSession(sessionId);

    // Add user message to session
    session.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    // Convert session messages to LangChain format
    const conversationHistory = this.convertToLangChainMessages(
      session.messages.slice(0, -1),
    );

    // Update session activity
    session.lastActivity = new Date();

    return {
      stream: await this.agent.stream(message, conversationHistory),
      sessionId: session.sessionId,
    };
  }

  getSession(sessionId: string): ConversationSession | undefined {
    return this.sessions.get(sessionId);
  }

  clearSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  getAllSessions(): ConversationSession[] {
    return Array.from(this.sessions.values());
  }

  private getOrCreateSession(sessionId?: string): ConversationSession {
    if (sessionId && this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId)!;
    }

    const newSessionId = sessionId || this.generateSessionId();
    const newSession: ConversationSession = {
      sessionId: newSessionId,
      messages: [],
      createdAt: new Date(),
      lastActivity: new Date(),
      metadata: {
        totalMessages: 0,
        companiesMentioned: [],
        sharksMentioned: [],
      },
    };

    this.sessions.set(newSessionId, newSession);
    this.logger.log(`Created new session: ${newSessionId}`);

    return newSession;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private convertToLangChainMessages(messages: ChatMessage[]): BaseMessage[] {
    return messages.map((msg) => {
      if (msg.role === 'user') {
        return new HumanMessage(msg.content);
      } else if (msg.role === 'assistant') {
        return new AIMessage(msg.content);
      }
      return new HumanMessage(msg.content); // Fallback
    });
  }

  getStats() {
    return {
      totalSessions: this.sessions.size,
      activeSessions: Array.from(this.sessions.values()).filter(
        (s) => Date.now() - s.lastActivity.getTime() < 5 * 60 * 1000,
      ).length,
      totalMessages: Array.from(this.sessions.values()).reduce(
        (sum, s) => sum + s.messages.length,
        0,
      ),
    };
  }
}
