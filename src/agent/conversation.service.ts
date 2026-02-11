import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Conversation, ConversationMessage } from './entities/conversation.entity';
import { CreateConversationDto, UpdateConversationDto } from './dto/conversation.dto';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class ConversationService implements OnModuleInit {
  private readonly logger = new Logger(ConversationService.name);
  private conversations: Map<string, Conversation> = new Map();
  private readonly storageDir = path.join(process.cwd(), 'data', 'conversations');
  private initialized = false;

  async onModuleInit() {
    await this.ensureStorageDirectory();
    await this.loadConversations();
    this.initialized = true;
    this.logger.log('Conversation service initialized');
  }

  private async ensureStorageDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
    } catch (error) {
      this.logger.error('Failed to create storage directory:', error);
    }
  }

  private async loadConversations(): Promise<void> {
    try {
      const files = await fs.readdir(this.storageDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      for (const file of jsonFiles) {
        try {
          const filePath = path.join(this.storageDir, file);
          const data = await fs.readFile(filePath, 'utf-8');
          const conversationData = JSON.parse(data);
          
          // Convert date strings back to Date objects
          conversationData.createdAt = new Date(conversationData.createdAt);
          conversationData.updatedAt = new Date(conversationData.updatedAt);
          conversationData.messages = conversationData.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));
          
          if (conversationData.metadata?.lastDealDiscussed?.timestamp) {
            conversationData.metadata.lastDealDiscussed.timestamp = 
              new Date(conversationData.metadata.lastDealDiscussed.timestamp);
          }
          
          const conversation = new Conversation(conversationData);
          this.conversations.set(conversation.id, conversation);
        } catch (error) {
          this.logger.error(`Failed to load conversation from ${file}:`, error);
        }
      }

      this.logger.log(`Loaded ${this.conversations.size} conversations from storage`);
    } catch (error) {
      this.logger.error('Failed to load conversations:', error);
    }
  }

  private async saveConversation(conversation: Conversation): Promise<void> {
    try {
      const filePath = path.join(this.storageDir, `${conversation.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(conversation.toJSON(), null, 2), 'utf-8');
    } catch (error) {
      this.logger.error(`Failed to save conversation ${conversation.id}:`, error);
      throw error;
    }
  }

  async createConversation(dto: CreateConversationDto): Promise<Conversation> {
    const conversation = new Conversation({
      title: dto.title || `Conversation ${new Date().toLocaleDateString()}`,
      userId: dto.userId,
      messages: [],
      metadata: {
        totalMessages: 0,
        companiesMentioned: [],
        sharksMentioned: [],
        ...dto.metadata,
      },
    });

    this.conversations.set(conversation.id, conversation);
    await this.saveConversation(conversation);

    this.logger.log(`Created conversation: ${conversation.id}`);
    return conversation;
  }

  async getConversation(id: string): Promise<Conversation> {
    const conversation = this.conversations.get(id);
    
    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    return conversation;
  }

  async getAllConversations(userId?: string, page = 1, limit = 20): Promise<{
    conversations: Conversation[];
    total: number;
    page: number;
    limit: number;
  }> {
    let conversations = Array.from(this.conversations.values());

    // Filter by userId if provided
    if (userId) {
      conversations = conversations.filter(c => c.userId === userId);
    }

    // Sort by updatedAt descending (most recent first)
    conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    const total = conversations.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedConversations = conversations.slice(startIndex, endIndex);

    return {
      conversations: paginatedConversations,
      total,
      page,
      limit,
    };
  }

  async updateConversation(id: string, dto: UpdateConversationDto): Promise<Conversation> {
    const conversation = await this.getConversation(id);

    if (dto.title) {
      conversation.title = dto.title;
    }

    if (dto.metadata) {
      conversation.metadata = {
        ...conversation.metadata,
        ...dto.metadata,
      };
    }

    conversation.updatedAt = new Date();
    await this.saveConversation(conversation);

    this.logger.log(`Updated conversation: ${id}`);
    return conversation;
  }

  async deleteConversation(id: string): Promise<void> {
    const conversation = await this.getConversation(id);
    
    this.conversations.delete(id);

    try {
      const filePath = path.join(this.storageDir, `${id}.json`);
      await fs.unlink(filePath);
      this.logger.log(`Deleted conversation: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete conversation file ${id}:`, error);
    }
  }

  async addMessage(
    conversationId: string,
    message: ConversationMessage,
  ): Promise<Conversation> {
    const conversation = await this.getConversation(conversationId);
    
    conversation.addMessage(message);
    
    // Update metadata if message has entities
    if (message.metadata?.entities) {
      conversation.updateMetadata(message.metadata.entities);
    }

    await this.saveConversation(conversation);

    return conversation;
  }

  async getConversationHistory(conversationId: string): Promise<ConversationMessage[]> {
    const conversation = await this.getConversation(conversationId);
    return conversation.messages;
  }

  async searchConversations(query: string, userId?: string): Promise<Conversation[]> {
    let conversations = Array.from(this.conversations.values());

    if (userId) {
      conversations = conversations.filter(c => c.userId === userId);
    }

    const lowerQuery = query.toLowerCase();

    return conversations.filter(conversation => {
      // Search in title
      if (conversation.title.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Search in messages
      return conversation.messages.some(msg => 
        msg.content.toLowerCase().includes(lowerQuery)
      );
    }).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async getStats(userId?: string): Promise<{
    totalConversations: number;
    totalMessages: number;
    averageMessagesPerConversation: number;
    mostMentionedCompanies: { name: string; count: number }[];
    mostMentionedSharks: { name: string; count: number }[];
  }> {
    let conversations = Array.from(this.conversations.values());

    if (userId) {
      conversations = conversations.filter(c => c.userId === userId);
    }

    const totalConversations = conversations.length;
    const totalMessages = conversations.reduce((sum, c) => sum + c.messages.length, 0);
    const averageMessagesPerConversation = totalConversations > 0 
      ? totalMessages / totalConversations 
      : 0;

    // Count company mentions
    const companyMentions = new Map<string, number>();
    conversations.forEach(c => {
      c.metadata.companiesMentioned.forEach(company => {
        companyMentions.set(company, (companyMentions.get(company) || 0) + 1);
      });
    });

    // Count shark mentions
    const sharkMentions = new Map<string, number>();
    conversations.forEach(c => {
      c.metadata.sharksMentioned.forEach(shark => {
        sharkMentions.set(shark, (sharkMentions.get(shark) || 0) + 1);
      });
    });

    const mostMentionedCompanies = Array.from(companyMentions.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const mostMentionedSharks = Array.from(sharkMentions.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalConversations,
      totalMessages,
      averageMessagesPerConversation: Math.round(averageMessagesPerConversation * 10) / 10,
      mostMentionedCompanies,
      mostMentionedSharks,
    };
  }
}
