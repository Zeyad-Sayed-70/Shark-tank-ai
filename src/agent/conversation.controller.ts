import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { AgentService } from './agent.service';
import { AgentQueueService } from './agent-queue.service';
import {
  CreateConversationDto,
  SendMessageDto,
  UpdateConversationDto,
  ConversationDto,
  ConversationListItemDto,
  ConversationResponseDto,
  ConversationListResponseDto,
  MessageResponseDto,
  ConversationMessageDto,
} from './dto/conversation.dto';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';

@Controller('conversations')
export class ConversationController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly agentService: AgentService,
    private readonly queueService: AgentQueueService,
  ) {}

  @Post()
  async createConversation(
    @Body() dto: CreateConversationDto,
  ): Promise<ConversationResponseDto> {
    try {
      const conversation = await this.conversationService.createConversation(dto);

      return {
        success: true,
        conversation: this.mapToDto(conversation),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to create conversation',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async getConversations(
    @Query('userId') userId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ): Promise<ConversationListResponseDto> {
    try {
      const result = await this.conversationService.getAllConversations(
        userId,
        Number(page),
        Number(limit),
      );

      return {
        success: true,
        conversations: result.conversations.map(c => this.mapToListItemDto(c)),
        total: result.total,
        page: result.page,
        limit: result.limit,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch conversations',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('search')
  async searchConversations(
    @Query('q') query: string,
    @Query('userId') userId?: string,
  ) {
    try {
      if (!query || query.trim() === '') {
        throw new HttpException(
          'Search query is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const conversations = await this.conversationService.searchConversations(
        query,
        userId,
      );

      return {
        success: true,
        conversations: conversations.map(c => this.mapToListItemDto(c)),
        total: conversations.length,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to search conversations',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats')
  async getStats(@Query('userId') userId?: string) {
    try {
      const stats = await this.conversationService.getStats(userId);

      return {
        success: true,
        stats,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch stats',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getConversation(@Param('id') id: string): Promise<ConversationResponseDto> {
    try {
      const conversation = await this.conversationService.getConversation(id);

      return {
        success: true,
        conversation: this.mapToDto(conversation),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Conversation not found',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Put(':id')
  async updateConversation(
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
  ): Promise<ConversationResponseDto> {
    try {
      const conversation = await this.conversationService.updateConversation(id, dto);

      return {
        success: true,
        conversation: this.mapToDto(conversation),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to update conversation',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async deleteConversation(@Param('id') id: string) {
    try {
      await this.conversationService.deleteConversation(id);

      return {
        success: true,
        message: 'Conversation deleted successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to delete conversation',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/messages')
  async sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ): Promise<MessageResponseDto> {
    try {
      if (!dto.message || dto.message.trim() === '') {
        throw new HttpException(
          'Message is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Get conversation to build history
      const conversation = await this.conversationService.getConversation(id);

      // Add user message to conversation
      const userMessage: ConversationMessageDto = {
        role: 'user',
        content: dto.message,
        timestamp: new Date(),
      };

      await this.conversationService.addMessage(id, userMessage);

      // Convert conversation history to LangChain format
      const conversationHistory: BaseMessage[] = conversation.messages.map(msg => {
        if (msg.role === 'user') {
          return new HumanMessage(msg.content);
        } else {
          return new AIMessage(msg.content);
        }
      });

      // Get AI response
      const startTime = Date.now();
      const result = await this.agentService.chat(dto.message, conversationHistory);
      const processingTime = Date.now() - startTime;

      // Add assistant message to conversation
      const assistantMessage: ConversationMessageDto = {
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
        metadata: {
          entities: result.entities ? {
            companies: result.entities.companies,
            sharks: result.entities.sharks.filter(s => s.mentioned).map(s => s.name),
            deals: result.entities.deals,
          } : undefined,
          processingTime,
        },
      };

      await this.conversationService.addMessage(id, assistantMessage);

      return {
        success: true,
        conversationId: id,
        message: userMessage,
        response: assistantMessage,
        entities: assistantMessage.metadata?.entities,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to send message',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('send')
  async sendMessageOrCreate(@Body() dto: SendMessageDto): Promise<MessageResponseDto> {
    try {
      if (!dto.message || dto.message.trim() === '') {
        throw new HttpException(
          'Message is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      let conversationId = dto.conversationId;

      // Create new conversation if not provided
      if (!conversationId) {
        const conversation = await this.conversationService.createConversation({
          userId: dto.userId,
          metadata: dto.metadata,
        });
        conversationId = conversation.id;
      }

      // Send message to the conversation
      return await this.sendMessage(conversationId, dto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to send message',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/messages')
  async getMessages(@Param('id') id: string) {
    try {
      const messages = await this.conversationService.getConversationHistory(id);

      return {
        success: true,
        conversationId: id,
        messages,
        total: messages.length,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch messages',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private mapToDto(conversation: any): ConversationDto {
    return {
      id: conversation.id,
      title: conversation.title,
      userId: conversation.userId,
      messages: conversation.messages,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      metadata: conversation.metadata,
    };
  }

  private mapToListItemDto(conversation: any): ConversationListItemDto {
    const lastMessage = conversation.messages[conversation.messages.length - 1];

    return {
      id: conversation.id,
      title: conversation.title,
      userId: conversation.userId,
      messageCount: conversation.messages.length,
      lastMessage: lastMessage ? {
        content: lastMessage.content,
        timestamp: lastMessage.timestamp,
        role: lastMessage.role,
      } : undefined,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      preview: conversation.getPreview(),
    };
  }
}
