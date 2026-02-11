# Frontend Integration Guide - Shark Tank AI Conversations

## Quick Start

The Shark Tank AI now supports persistent conversations with full history tracking. Users can create conversations, send messages, and the AI maintains context throughout the entire conversation.

---

## Key Concepts

### 1. Conversations
- Each conversation has a unique ID
- Contains all messages between user and AI
- Automatically tracks mentioned companies, sharks, and deals
- Persists across sessions

### 2. Messages
- Two roles: `user` and `assistant`
- Each message has a timestamp
- AI responses include extracted entities (companies, sharks, deals)

### 3. Context Awareness
- The AI remembers the entire conversation history
- Users can ask follow-up questions without repeating context
- Example: "Tell me about Scrub Daddy" → "What was the deal?" (AI knows you're still talking about Scrub Daddy)

---

## Implementation Guide

### Basic Flow

```
1. User starts chatting → Auto-create conversation
2. User sends message → Add to conversation + Get AI response
3. User continues → AI uses full conversation history
4. User can view past conversations → Retrieve from API
```

### Recommended UI Components

1. **Conversation List** - Show all user's conversations
2. **Chat Interface** - Display messages in a conversation
3. **New Chat Button** - Start a new conversation
4. **Search** - Find past conversations
5. **Conversation Settings** - Rename, delete conversations

---

## API Integration Examples

### Example 1: Simple Chat (Auto-Create Conversation)

```typescript
// TypeScript/React Example
import { useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

function ChatComponent() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:3000/conversations/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversationId, // null for first message
          message: input,
          userId: 'current-user-id' // Your user ID
        })
      });

      const data = await response.json();

      // Save conversation ID for future messages
      if (!conversationId) {
        setConversationId(data.conversationId);
      }

      // Add both user message and AI response to UI
      setMessages([
        ...messages,
        data.message,
        data.response
      ]);

      setInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <p>{msg.content}</p>
            <span className="timestamp">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
      
      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask about Shark Tank..."
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
```

### Example 2: Load Existing Conversation

```typescript
async function loadConversation(conversationId: string) {
  const response = await fetch(
    `http://localhost:3000/conversations/${conversationId}`
  );
  const data = await response.json();
  
  return {
    id: data.conversation.id,
    title: data.conversation.title,
    messages: data.conversation.messages,
    metadata: data.conversation.metadata
  };
}

// Usage
const conversation = await loadConversation('conv_1234567890_abc123');
setMessages(conversation.messages);
setConversationId(conversation.id);
```

### Example 3: Conversation List

```typescript
interface ConversationListItem {
  id: string;
  title: string;
  messageCount: number;
  lastMessage?: {
    content: string;
    timestamp: string;
    role: 'user' | 'assistant';
  };
  preview: string;
  updatedAt: string;
}

async function getConversations(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<ConversationListItem[]> {
  const response = await fetch(
    `http://localhost:3000/conversations?userId=${userId}&page=${page}&limit=${limit}`
  );
  const data = await response.json();
  
  return data.conversations;
}

// Usage in React
function ConversationList() {
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);

  useEffect(() => {
    getConversations('current-user-id').then(setConversations);
  }, []);

  return (
    <div className="conversation-list">
      {conversations.map(conv => (
        <div 
          key={conv.id} 
          className="conversation-item"
          onClick={() => openConversation(conv.id)}
        >
          <h3>{conv.title}</h3>
          <p className="preview">{conv.preview}</p>
          <div className="meta">
            <span>{conv.messageCount} messages</span>
            <span>{new Date(conv.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Example 4: Search Conversations

```typescript
async function searchConversations(query: string, userId: string) {
  const response = await fetch(
    `http://localhost:3000/conversations/search?q=${encodeURIComponent(query)}&userId=${userId}`
  );
  const data = await response.json();
  
  return data.conversations;
}

// Usage
const results = await searchConversations('Scrub Daddy', 'current-user-id');
```

### Example 5: Update Conversation Title

```typescript
async function updateConversationTitle(conversationId: string, newTitle: string) {
  const response = await fetch(
    `http://localhost:3000/conversations/${conversationId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle })
    }
  );
  
  return response.json();
}
```

### Example 6: Delete Conversation

```typescript
async function deleteConversation(conversationId: string) {
  await fetch(`http://localhost:3000/conversations/${conversationId}`, {
    method: 'DELETE'
  });
}
```

---

## Complete React Component Example

```typescript
import React, { useState, useEffect, useRef } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    entities?: {
      companies?: string[];
      sharks?: string[];
    };
  };
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
}

const API_BASE = 'http://localhost:3000';
const USER_ID = 'your-user-id'; // Replace with actual user ID

export function SharkTankChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  const loadConversations = async () => {
    try {
      const response = await fetch(`${API_BASE}/conversations?userId=${USER_ID}`);
      const data = await response.json();
      setConversations(data.conversations.map((c: any) => ({
        id: c.id,
        title: c.title,
        messages: []
      })));
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`${API_BASE}/conversations/${conversationId}`);
      const data = await response.json();
      setCurrentConversation(data.conversation);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const startNewConversation = () => {
    setCurrentConversation(null);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/conversations/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: currentConversation?.id,
          message: userMessage,
          userId: USER_ID
        })
      });

      const data = await response.json();

      // Update current conversation
      if (currentConversation) {
        setCurrentConversation({
          ...currentConversation,
          messages: [...currentConversation.messages, data.message, data.response]
        });
      } else {
        // New conversation created
        const newConv = await loadConversation(data.conversationId);
        await loadConversations(); // Refresh list
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!confirm('Delete this conversation?')) return;

    try {
      await fetch(`${API_BASE}/conversations/${conversationId}`, {
        method: 'DELETE'
      });
      
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
      }
      
      await loadConversations();
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  return (
    <div className="shark-tank-chat">
      {/* Sidebar with conversation list */}
      <div className="sidebar">
        <button onClick={startNewConversation} className="new-chat-btn">
          + New Conversation
        </button>
        
        <div className="conversation-list">
          {conversations.map(conv => (
            <div
              key={conv.id}
              className={`conversation-item ${currentConversation?.id === conv.id ? 'active' : ''}`}
              onClick={() => loadConversation(conv.id)}
            >
              <span className="title">{conv.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
                className="delete-btn"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="chat-area">
        {currentConversation ? (
          <>
            <div className="chat-header">
              <h2>{currentConversation.title}</h2>
            </div>
            
            <div className="messages">
              {currentConversation.messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.role}`}>
                  <div className="message-content">
                    <p>{msg.content}</p>
                    {msg.metadata?.entities && (
                      <div className="entities">
                        {msg.metadata.entities.companies && (
                          <span className="tag">
                            🏢 {msg.metadata.entities.companies.join(', ')}
                          </span>
                        )}
                        {msg.metadata.entities.sharks && (
                          <span className="tag">
                            🦈 {msg.metadata.entities.sharks.join(', ')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="timestamp">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </>
        ) : (
          <div className="welcome">
            <h1>🦈 Shark Tank AI</h1>
            <p>Ask me anything about Shark Tank deals, companies, and investors!</p>
          </div>
        )}

        <div className="input-area">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about Shark Tank..."
            disabled={loading}
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()}>
            {loading ? '⏳' : '📤'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## CSS Styling Example

```css
.shark-tank-chat {
  display: flex;
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.sidebar {
  width: 300px;
  background: #f5f5f5;
  border-right: 1px solid #ddd;
  display: flex;
  flex-direction: column;
}

.new-chat-btn {
  margin: 16px;
  padding: 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

.new-chat-btn:hover {
  background: #0056b3;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
}

.conversation-item {
  padding: 12px 16px;
  border-bottom: 1px solid #ddd;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.conversation-item:hover {
  background: #e9ecef;
}

.conversation-item.active {
  background: #007bff;
  color: white;
}

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
}

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-header {
  padding: 16px;
  border-bottom: 1px solid #ddd;
  background: white;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #fafafa;
}

.message {
  margin-bottom: 16px;
  max-width: 70%;
}

.message.user {
  margin-left: auto;
}

.message.user .message-content {
  background: #007bff;
  color: white;
  border-radius: 18px 18px 4px 18px;
}

.message.assistant .message-content {
  background: white;
  border: 1px solid #ddd;
  border-radius: 18px 18px 18px 4px;
}

.message-content {
  padding: 12px 16px;
}

.message-content p {
  margin: 0;
  line-height: 1.5;
}

.entities {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  font-size: 12px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 12px;
}

.timestamp {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
  display: block;
}

.welcome {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  color: #666;
}

.input-area {
  padding: 16px;
  background: white;
  border-top: 1px solid #ddd;
  display: flex;
  gap: 8px;
}

.input-area input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 24px;
  font-size: 14px;
}

.input-area input:focus {
  outline: none;
  border-color: #007bff;
}

.input-area button {
  width: 48px;
  height: 48px;
  border: none;
  background: #007bff;
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 20px;
}

.input-area button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
```

---

## Best Practices

### 1. User Experience
- Show loading indicators while waiting for AI response
- Auto-scroll to latest message
- Display timestamps for context
- Show entity tags (companies, sharks) for quick reference

### 2. Error Handling
```typescript
try {
  // API call
} catch (error) {
  // Show user-friendly error message
  alert('Failed to send message. Please check your connection and try again.');
  // Log for debugging
  console.error('API Error:', error);
}
```

### 3. Performance
- Paginate conversation list for users with many conversations
- Lazy load conversation messages
- Debounce search input

### 4. State Management
- Use React Context or Redux for global conversation state
- Cache loaded conversations to avoid redundant API calls
- Optimistically update UI before API response

---

## Testing

Use the provided test script:

```bash
node test-conversations.js
```

This will test all conversation endpoints and verify the functionality.

---

## Support

For questions or issues, refer to:
- Full API documentation: `CONVERSATION_API.md`
- Backend implementation: `src/agent/conversation.controller.ts`
- Test examples: `test-conversations.js`
