# Quick API Reference - Shark Tank AI Conversations

## Base URL
```
http://localhost:3000
```

---

## 🚀 Quick Start (3 Steps)

### 1. Send First Message (Auto-creates conversation)
```javascript
POST /conversations/send
{
  "message": "Tell me about Scrub Daddy",
  "userId": "user123"
}

Response:
{
  "conversationId": "conv_xxx",
  "message": { ... },
  "response": { ... }
}
```

### 2. Continue Conversation
```javascript
POST /conversations/send
{
  "conversationId": "conv_xxx",
  "message": "What was the deal?",
  "userId": "user123"
}
```

### 3. Get Conversation History
```javascript
GET /conversations/conv_xxx

Response:
{
  "conversation": {
    "id": "conv_xxx",
    "messages": [...],
    "metadata": {...}
  }
}
```

---

## 📋 All Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/conversations` | Create new conversation |
| GET | `/conversations` | List all conversations |
| GET | `/conversations/:id` | Get specific conversation |
| PUT | `/conversations/:id` | Update conversation |
| DELETE | `/conversations/:id` | Delete conversation |
| POST | `/conversations/send` | Send message (auto-create) |
| POST | `/conversations/:id/messages` | Send to specific conversation |
| GET | `/conversations/:id/messages` | Get all messages |
| GET | `/conversations/search?q=query` | Search conversations |
| GET | `/conversations/stats` | Get statistics |

---

## 💬 Message Format

### Request
```json
{
  "conversationId": "conv_xxx",  // Optional for /send
  "message": "Your question here",
  "userId": "user123"            // Optional
}
```

### Response
```json
{
  "success": true,
  "conversationId": "conv_xxx",
  "message": {
    "role": "user",
    "content": "Your question",
    "timestamp": "2026-02-04T10:00:00.000Z"
  },
  "response": {
    "role": "assistant",
    "content": "AI response here...",
    "timestamp": "2026-02-04T10:00:05.000Z",
    "metadata": {
      "entities": {
        "companies": ["Scrub Daddy"],
        "sharks": ["Lori Greiner"],
        "deals": [...]
      },
      "processingTime": 5234
    }
  }
}
```

---

## 📦 TypeScript Types

```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    entities?: {
      companies?: string[];
      sharks?: string[];
      deals?: any[];
    };
    processingTime?: number;
  };
}

interface Conversation {
  id: string;
  title: string;
  userId?: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  metadata: {
    totalMessages: number;
    companiesMentioned: string[];
    sharksMentioned: string[];
  };
}

interface SendMessageRequest {
  conversationId?: string;
  message: string;
  userId?: string;
}

interface SendMessageResponse {
  success: boolean;
  conversationId: string;
  message: Message;
  response: Message;
  entities?: any;
}
```

---

## 🎯 Common Use Cases

### Start New Chat
```javascript
const response = await fetch('http://localhost:3000/conversations/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "What are the most successful Shark Tank companies?",
    userId: "user123"
  })
});
const data = await response.json();
// Save data.conversationId for future messages
```

### Continue Chat
```javascript
const response = await fetch('http://localhost:3000/conversations/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conversationId: savedConversationId,
    message: "Tell me more about the first one",
    userId: "user123"
  })
});
```

### Load Past Conversations
```javascript
const response = await fetch('http://localhost:3000/conversations?userId=user123');
const data = await response.json();
// data.conversations = array of conversation summaries
```

### Load Full Conversation
```javascript
const response = await fetch(`http://localhost:3000/conversations/${conversationId}`);
const data = await response.json();
// data.conversation.messages = all messages
```

### Search
```javascript
const response = await fetch(
  `http://localhost:3000/conversations/search?q=Scrub%20Daddy&userId=user123`
);
const data = await response.json();
// data.conversations = matching conversations
```

### Delete
```javascript
await fetch(`http://localhost:3000/conversations/${conversationId}`, {
  method: 'DELETE'
});
```

---

## ⚡ Quick Tips

1. **Always save conversationId** from first message response
2. **Pass conversationId** in subsequent messages for context
3. **Use /send endpoint** - it auto-creates if no conversationId
4. **Check entities** in response for mentioned companies/sharks
5. **userId is optional** but recommended for multi-user apps

---

## 🐛 Error Handling

```javascript
try {
  const response = await fetch(url, options);
  const data = await response.json();
  
  if (!data.success) {
    console.error('API Error:', data.message);
  }
} catch (error) {
  console.error('Network Error:', error);
}
```

---

## 📚 Full Documentation

- **Complete API Docs**: `CONVERSATION_API.md`
- **Frontend Guide**: `FRONTEND_CONVERSATION_GUIDE.md`
- **Feature Summary**: `CONVERSATION_FEATURE_SUMMARY.md`

---

## 🧪 Test It

```bash
node test-conversations.js
```

---

## ✅ Checklist for Frontend

- [ ] Save conversationId after first message
- [ ] Pass conversationId in follow-up messages
- [ ] Display both user and assistant messages
- [ ] Show timestamps
- [ ] Handle loading states
- [ ] Show error messages
- [ ] Auto-scroll to latest message
- [ ] Display entity tags (companies, sharks)
- [ ] Implement conversation list
- [ ] Add search functionality
