import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { SharkTankAgent } from './shark-tank-agent';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';

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
    sessionId?: string,
  ): Promise<{ response: string; sessionId: string }> {
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
      const response = await this.agent.chat(message, conversationHistory);

      // Add assistant response to session
      session.messages.push({
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      });

      // Update session activity
      session.lastActivity = new Date();

      return {
        response,
        sessionId: session.sessionId,
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
