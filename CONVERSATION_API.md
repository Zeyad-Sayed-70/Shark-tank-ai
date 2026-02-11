# Shark Tank AI - Conversation API Documentation

## Overview
The Conversation API allows users to have persistent conversations with the Shark Tank AI agent. All messages and responses are saved, and the agent maintains awareness of conversation history for contextual responses.

## Base URL
```
http://localhost:3000
```

---

## Endpoints

### 1. Create a New Conversation

**POST** `/conversations`

Creates a new conversation thread.

**Request Body:**
```json
{
  "title": "My Shark Tank Questions",  // Optional
  "userId": "user123",                  // Optional
  "metadata": {                         // Optional
    "source": "web",
    "tags": ["investments", "deals"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "conversation": {
    "id": "conv_1234567890_abc123",
    "title": "My Shark Tank Questions",
    "userId": "user123",
    "messages": [],
    "createdAt": "2026-02-04T10:00:00.000Z",
    "updatedAt": "2026-02-04T10:00:00.000Z",
    "metadata": {
      "totalMessages": 0,
      "companiesMentioned": [],
      "sharksMentioned": []
    }
  }
}
```

---

### 2. Send a Message (Create or Continue Conversation)

**POST** `/conversations/send`

Send a message to an existing conversation or create a new one if no conversationId is provided.

**Request Body:**
```json
{
  "conversationId": "conv_1234567890_abc123",  // Optional - creates new if omitted
  "message": "Tell me about Scrub Daddy",
  "userId": "user123",                          // Optional
  "metadata": {}                                // Optional
}
```

**Response:**
```json
{
  "success": true,
  "conversationId": "conv_1234567890_abc123",
  "message": {
    "role": "user",
    "content": "Tell me about Scrub Daddy",
    "timestamp": "2026-02-04T10:01:00.000Z"
  },
  "response": {
    "role": "assistant",
    "content": "Scrub Daddy is one of the most successful products from Shark Tank...",
    "timestamp": "2026-02-04T10:01:05.000Z",
    "metadata": {
      "entities": {
        "companies": ["Scrub Daddy"],
        "sharks": ["Lori Greiner"],
        "deals": [
          {
            "company": "Scrub Daddy",
            "shark": "Lori Greiner",
            "amount": 200000,
            "equity": 20
          }
        ]
      },
      "processingTime": 5234
    }
  },
  "entities": {
    "companies": ["Scrub Daddy"],
    "sharks": ["Lori Greiner"],
    "deals": [...]
  }
}
```

---

### 3. Send Message to Specific Conversation

**POST** `/conversations/:id/messages`

Send a message to a specific conversation.

**URL Parameters:**
- `id` - Conversation ID

**Request Body:**
```json
{
  "message": "What was the deal amount?",
  "userId": "user123",              // Optional
  "metadata": {}                    // Optional
}
```

**Response:** Same as `/conversations/send`

---

### 4. Get All Conversations

**GET** `/conversations`

Retrieve all conversations with pagination.

**Query Parameters:**
- `userId` (optional) - Filter by user ID
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20) - Items per page

**Example:**
```
GET /conversations?userId=user123&page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "conversations": [
    {
      "id": "conv_1234567890_abc123",
      "title": "Scrub Daddy Questions",
      "userId": "user123",
      "messageCount": 6,
      "lastMessage": {
        "content": "That's very helpful, thank you!",
        "timestamp": "2026-02-04T10:15:00.000Z",
        "role": "user"
      },
      "createdAt": "2026-02-04T10:00:00.000Z",
      "updatedAt": "2026-02-04T10:15:00.000Z",
      "preview": "That's very helpful, thank you!"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 10
}
```

---

### 5. Get Specific Conversation

**GET** `/conversations/:id`

Retrieve a specific conversation with all messages.

**URL Parameters:**
- `id` - Conversation ID

**Response:**
```json
{
  "success": true,
  "conversation": {
    "id": "conv_1234567890_abc123",
    "title": "Scrub Daddy Questions",
    "userId": "user123",
    "messages": [
      {
        "role": "user",
        "content": "Tell me about Scrub Daddy",
        "timestamp": "2026-02-04T10:01:00.000Z"
      },
      {
        "role": "assistant",
        "content": "Scrub Daddy is one of the most successful...",
        "timestamp": "2026-02-04T10:01:05.000Z",
        "metadata": {
          "entities": {...},
          "processingTime": 5234
        }
      }
    ],
    "createdAt": "2026-02-04T10:00:00.000Z",
    "updatedAt": "2026-02-04T10:15:00.000Z",
    "metadata": {
      "totalMessages": 6,
      "companiesMentioned": ["Scrub Daddy"],
      "sharksMentioned": ["Lori Greiner"],
      "lastDealDiscussed": {
        "company": "Scrub Daddy",
        "timestamp": "2026-02-04T10:01:05.000Z"
      }
    }
  }
}
```

---

### 6. Get Conversation Messages

**GET** `/conversations/:id/messages`

Retrieve all messages from a specific conversation.

**URL Parameters:**
- `id` - Conversation ID

**Response:**
```json
{
  "success": true,
  "conversationId": "conv_1234567890_abc123",
  "messages": [
    {
      "role": "user",
      "content": "Tell me about Scrub Daddy",
      "timestamp": "2026-02-04T10:01:00.000Z"
    },
    {
      "role": "assistant",
      "content": "Scrub Daddy is one of the most successful...",
      "timestamp": "2026-02-04T10:01:05.000Z",
      "metadata": {
        "entities": {...},
        "processingTime": 5234
      }
    }
  ],
  "total": 6
}
```

---

### 7. Update Conversation

**PUT** `/conversations/:id`

Update conversation title or metadata.

**URL Parameters:**
- `id` - Conversation ID

**Request Body:**
```json
{
  "title": "Updated Title",
  "metadata": {
    "tags": ["favorite", "important"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "conversation": {
    "id": "conv_1234567890_abc123",
    "title": "Updated Title",
    ...
  }
}
```

---

### 8. Delete Conversation

**DELETE** `/conversations/:id`

Delete a conversation and all its messages.

**URL Parameters:**
- `id` - Conversation ID

**Response:**
```json
{
  "success": true,
  "message": "Conversation deleted successfully"
}
```

---

### 9. Search Conversations

**GET** `/conversations/search`

Search conversations by content.

**Query Parameters:**
- `q` (required) - Search query
- `userId` (optional) - Filter by user ID

**Example:**
```
GET /conversations/search?q=Scrub%20Daddy&userId=user123
```

**Response:**
```json
{
  "success": true,
  "conversations": [
    {
      "id": "conv_1234567890_abc123",
      "title": "Scrub Daddy Questions",
      "userId": "user123",
      "messageCount": 6,
      ...
    }
  ],
  "total": 3
}
```

---

### 10. Get Conversation Statistics

**GET** `/conversations/stats`

Get statistics about conversations.

**Query Parameters:**
- `userId` (optional) - Filter by user ID

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalConversations": 15,
    "totalMessages": 87,
    "averageMessagesPerConversation": 5.8,
    "mostMentionedCompanies": [
      { "name": "Scrub Daddy", "count": 12 },
      { "name": "Ring", "count": 8 },
      { "name": "Bombas", "count": 6 }
    ],
    "mostMentionedSharks": [
      { "name": "Lori Greiner", "count": 15 },
      { "name": "Mark Cuban", "count": 12 },
      { "name": "Kevin O'Leary", "count": 10 }
    ]
  }
}
```

---

## Data Models

### ConversationMessage
```typescript
{
  role: 'user' | 'assistant',
  content: string,
  timestamp: Date,
  metadata?: {
    entities?: {
      companies?: string[],
      sharks?: string[],
      deals?: Array<{
        company: string,
        shark: string,
        amount: number,
        equity: number
      }>
    },
    processingTime?: number
  }
}
```

### Conversation
```typescript
{
  id: string,
  title: string,
  userId?: string,
  messages: ConversationMessage[],
  createdAt: Date,
  updatedAt: Date,
  metadata: {
    totalMessages: number,
    companiesMentioned: string[],
    sharksMentioned: string[],
    lastDealDiscussed?: {
      company: string,
      timestamp: Date
    }
  }
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (missing required fields)
- `404` - Not Found (conversation doesn't exist)
- `500` - Internal Server Error

---

## Usage Examples

### Example 1: Start a New Conversation

```javascript
// 1. Send first message (creates conversation automatically)
const response = await fetch('http://localhost:3000/conversations/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "What are the most successful Shark Tank companies?",
    userId: "user123"
  })
});

const data = await response.json();
const conversationId = data.conversationId;

// 2. Continue the conversation
const followUp = await fetch('http://localhost:3000/conversations/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conversationId: conversationId,
    message: "Tell me more about the first one",
    userId: "user123"
  })
});
```

### Example 2: Retrieve Conversation History

```javascript
// Get all user's conversations
const conversations = await fetch('http://localhost:3000/conversations?userId=user123');
const conversationList = await conversations.json();

// Get specific conversation with all messages
const conversation = await fetch(`http://localhost:3000/conversations/${conversationId}`);
const fullConversation = await conversation.json();
```

### Example 3: Search and Update

```javascript
// Search for conversations about a topic
const search = await fetch('http://localhost:3000/conversations/search?q=Scrub%20Daddy&userId=user123');
const results = await search.json();

// Update conversation title
const update = await fetch(`http://localhost:3000/conversations/${conversationId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: "My Favorite Shark Tank Products"
  })
});
```

---

## Features

✅ **Persistent Storage** - All conversations saved to disk
✅ **Context Awareness** - Agent remembers full conversation history
✅ **Entity Tracking** - Automatically tracks mentioned companies, sharks, and deals
✅ **Search** - Full-text search across all conversations
✅ **Pagination** - Efficient handling of large conversation lists
✅ **Metadata** - Rich metadata for analytics and filtering
✅ **User Isolation** - Optional userId for multi-user support

---

## Notes

- Conversations are stored in `data/conversations/` directory
- Each conversation is saved as a separate JSON file
- The agent maintains full context of the conversation history
- Entity extraction happens automatically for each response
- Conversation titles are auto-generated from the first message if not provided
- All timestamps are in ISO 8601 format (UTC)
