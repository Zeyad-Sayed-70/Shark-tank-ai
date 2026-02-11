export interface ConversationMessage {
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

export interface ConversationMetadata {
  totalMessages: number;
  companiesMentioned: string[];
  sharksMentioned: string[];
  lastDealDiscussed?: {
    company: string;
    timestamp: Date;
  };
}

export class Conversation {
  id: string;
  title: string;
  userId?: string;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
  metadata: ConversationMetadata;

  constructor(partial: Partial<Conversation>) {
    Object.assign(this, partial);
    
    if (!this.id) {
      this.id = this.generateId();
    }
    
    if (!this.createdAt) {
      this.createdAt = new Date();
    }
    
    if (!this.updatedAt) {
      this.updatedAt = new Date();
    }
    
    if (!this.messages) {
      this.messages = [];
    }
    
    if (!this.metadata) {
      this.metadata = {
        totalMessages: 0,
        companiesMentioned: [],
        sharksMentioned: [],
      };
    }
    
    if (!this.title) {
      this.title = this.generateTitle();
    }
  }

  private generateId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateTitle(): string {
    if (this.messages.length > 0) {
      const firstUserMessage = this.messages.find(m => m.role === 'user');
      if (firstUserMessage) {
        const preview = firstUserMessage.content.substring(0, 50);
        return preview.length < firstUserMessage.content.length 
          ? `${preview}...` 
          : preview;
      }
    }
    return `Conversation ${new Date().toLocaleDateString()}`;
  }

  addMessage(message: ConversationMessage): void {
    this.messages.push(message);
    this.updatedAt = new Date();
    this.metadata.totalMessages = this.messages.length;
    
    // Update title if this is the first user message
    if (this.messages.length === 1 && message.role === 'user') {
      this.title = this.generateTitle();
    }
  }

  updateMetadata(entities?: { companies?: string[]; sharks?: string[]; deals?: any[] }): void {
    if (!entities) return;

    if (entities.companies && entities.companies.length > 0) {
      this.metadata.companiesMentioned = [
        ...new Set([...this.metadata.companiesMentioned, ...entities.companies]),
      ];
      
      if (entities.deals && entities.deals.length > 0) {
        this.metadata.lastDealDiscussed = {
          company: entities.deals[0].company,
          timestamp: new Date(),
        };
      }
    }
    
    if (entities.sharks && entities.sharks.length > 0) {
      this.metadata.sharksMentioned = [
        ...new Set([...this.metadata.sharksMentioned, ...entities.sharks]),
      ];
    }
    
    this.updatedAt = new Date();
  }

  getPreview(): string {
    const lastMessage = this.messages[this.messages.length - 1];
    if (lastMessage) {
      const preview = lastMessage.content.substring(0, 100);
      return preview.length < lastMessage.content.length 
        ? `${preview}...` 
        : preview;
    }
    return 'No messages yet';
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      userId: this.userId,
      messages: this.messages,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: this.metadata,
    };
  }
}
