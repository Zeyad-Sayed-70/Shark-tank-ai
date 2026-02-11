export class CreateConversationDto {
  title?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export class ConversationMessageDto {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    entities?: {
      companies?: string[];
      sharks?: string[];
      deals?: any[];
    };
    processingTime?: number;
  };
}

export class ConversationDto {
  id: string;
  title: string;
  userId?: string;
  messages: ConversationMessageDto[];
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    totalMessages: number;
    companiesMentioned: string[];
    sharksMentioned: string[];
    lastDealDiscussed?: {
      company: string;
      timestamp: Date;
    };
  };
}

export class SendMessageDto {
  conversationId?: string;
  message: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export class UpdateConversationDto {
  title?: string;
  metadata?: Record<string, any>;
}

export class ConversationListItemDto {
  id: string;
  title: string;
  userId?: string;
  messageCount: number;
  lastMessage?: {
    content: string;
    timestamp: Date;
    role: 'user' | 'assistant';
  };
  createdAt: Date;
  updatedAt: Date;
  preview: string;
}

export class ConversationResponseDto {
  success: boolean;
  conversation?: ConversationDto;
  message?: string;
}

export class ConversationListResponseDto {
  success: boolean;
  conversations: ConversationListItemDto[];
  total: number;
  page: number;
  limit: number;
}

export class MessageResponseDto {
  success: boolean;
  conversationId: string;
  message: ConversationMessageDto;
  response: ConversationMessageDto;
  entities?: {
    companies?: string[];
    sharks?: string[];
    deals?: any[];
  };
}
