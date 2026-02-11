# 🎯 Frontend API Documentation

Complete API reference for integrating the Shark Tank AI Agent into your frontend application.

**Base URL:** `http://localhost:3000` (or your deployed server URL)

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Chat Endpoints](#chat-endpoints)
3. [Deals Endpoints](#deals-endpoints)
4. [Sharks Endpoints](#sharks-endpoints)
5. [Session Management](#session-management)
6. [Queue Management](#queue-management)
7. [Health & Monitoring](#health--monitoring)
8. [Error Handling](#error-handling)
9. [Code Examples](#code-examples)

---

## 🚀 Quick Start

### Simplest Implementation (Recommended)

```javascript
// Send a message and get response with entities
const response = await fetch('http://localhost:3000/agent/chat/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Tell me about Scrub Daddy'
  })
});

const data = await response.json();
console.log(data.response); // AI response
console.log(data.sessionId); // Save this for conversation context
console.log(data.entities); // Extracted deals, sharks, companies
```

---

## 💬 Chat Endpoints

### 1. Synchronous Chat (Recommended for Most Use Cases)

**Endpoint:** `POST /agent/chat/sync`

Sends a message and waits for the response (up to 60 seconds). Best for typical chat interfaces.

**Request:**
```json
{
  "message": "What companies got deals from Mark Cuban?",
  "sessionId": "session_1234567890_abc123",
  "userId": "user-123",
  "metadata": {
    "source": "web-app",
    "page": "chat"
  }
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | ✅ Yes | User's question or message |
| `sessionId` | string | ❌ No | Session ID for conversation context |
| `userId` | string | ❌ No | User identifier for tracking |
| `metadata` | object | ❌ No | Additional metadata |

**Response (Success):**
```json
{
  "success": true,
  "response": "Mark Cuban has invested in many successful companies on Shark Tank...",
  "sessionId": "session_1234567890_abc123",
  "entities": {
    "deals": [
      {
        "company": "Ten Thirty One Productions",
        "entrepreneur": "Melissa Carbone",
        "askAmount": 200000,
        "askEquity": 10,
        "dealAmount": 2000000,
        "dealEquity": 20,
        "valuation": 10000000,
        "investors": ["Mark Cuban"],
        "season": 4,
        "episode": 3,
        "dealMade": true,
        "industry": "Entertainment"
      }
    ],
    "sharks": [
      {
        "name": "Mark Cuban",
        "slug": "mark-cuban",
        "mentioned": true
      },
      {
        "name": "Lori Greiner",
        "slug": "lori-greiner",
        "mentioned": false
      }
    ],
    "companies": ["Ten Thirty One Productions"]
  },
  "processingTime": 2500,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Response (Timeout):**
```json
{
  "success": false,
  "message": "Request timeout - job is still processing",
  "jobId": "42",
  "statusUrl": "/agent/queue/job/42"
}
```

---

### 2. Asynchronous Chat (For Long-Running Queries)

**Endpoint:** `POST /agent/chat`

Returns immediately with a job ID. Poll for results using the job ID.

**Request:**
```json
{
  "message": "Analyze all tech deals from season 10",
  "sessionId": "session_1234567890_abc123",
  "userId": "user-123"
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "42",
  "message": "Chat request queued successfully",
  "statusUrl": "/agent/queue/job/42",
  "resultUrl": "/agent/queue/job/42/result",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Then poll for results:**
```javascript
// Poll every 1 second
const checkResult = async (jobId) => {
  const response = await fetch(`http://localhost:3000/agent/queue/job/${jobId}/result`);
  const data = await response.json();
  
  if (data.success) {
    return data.result; // Got the answer with entities!
  } else if (data.status === 'active' || data.status === 'waiting') {
    // Still processing, wait and try again
    await new Promise(resolve => setTimeout(resolve, 1000));
    return checkResult(jobId);
  } else {
    throw new Error(data.error || 'Job failed');
  }
};
```

---

### 3. Streaming Chat (Real-time Responses)

**Endpoint:** `GET /agent/chat/stream`

Server-Sent Events (SSE) for real-time streaming responses.

**Request:**
```
GET /agent/chat/stream?message=Tell%20me%20about%20Shark%20Tank&sessionId=session_123
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | ✅ Yes | User's question (URL encoded) |
| `sessionId` | string | ❌ No | Session ID for context |

**Response (SSE Stream):**
```javascript
const eventSource = new EventSource(
  'http://localhost:3000/agent/chat/stream?message=Hello&sessionId=session_123'
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.chunk); // Partial response
  console.log(data.sessionId); // Session ID
};

eventSource.onerror = (error) => {
  console.error('Stream error:', error);
  eventSource.close();
};
```

---

## 🎯 Deals Endpoints

### Get Deal by Company Name

**Endpoint:** `GET /deals/:companyName`

**Example:**
```
GET /deals/Scrub%20Daddy
```

**Response:**
```json
{
  "success": true,
  "deal": {
    "company": "Scrub Daddy",
    "entrepreneur": "Aaron Krause",
    "askAmount": 100000,
    "askEquity": 10,
    "dealAmount": 200000,
    "dealEquity": 20,
    "valuation": 1000000,
    "investors": ["Lori Greiner"],
    "season": 4,
    "episode": 7,
    "dealMade": true,
    "industry": "Home & Garden",
    "description": "Smiley-faced sponge that changes texture with water temperature",
    "pitchSummary": "Aaron Krause pitched Scrub Daddy..."
  }
}
```

---

### Search Deals (GET)

**Endpoint:** `GET /deals`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `company` | string | Search by company name |
| `industry` | string | Filter by industry |
| `dealMade` | boolean | Filter by deal status (true/false) |
| `season` | number | Filter by season |
| `investor` | string | Filter by investor name |
| `minValuation` | number | Minimum valuation |
| `maxValuation` | number | Maximum valuation |
| `limit` | number | Number of results (default: 20) |

**Example:**
```
GET /deals?industry=Food%20%26%20Beverage&dealMade=true&limit=10
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "company": "Cousins Maine Lobster",
      "entrepreneur": "Jim Tselikis & Sabin Lomac",
      "dealAmount": 55000,
      "dealEquity": 15,
      "valuation": 366667,
      "investors": ["Barbara Corcoran"],
      "season": 4,
      "episode": 6,
      "dealMade": true,
      "industry": "Food & Beverage"
    }
  ],
  "totalResults": 10
}
```

---

### Search Deals (POST)

**Endpoint:** `POST /deals/search`

**Request:**
```json
{
  "query": "food companies that got deals",
  "filters": {
    "industry": "Food & Beverage",
    "dealMade": true,
    "season": 10,
    "minValuation": 500000,
    "maxValuation": 5000000
  },
  "limit": 20
}
```

**Response:**
```json
{
  "success": true,
  "query": "food companies that got deals",
  "results": [...],
  "totalResults": 15
}
```

---

### Get Recent Deals

**Endpoint:** `GET /deals/recent/list`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 10 | Number of deals to return |

**Example:**
```
GET /deals/recent/list?limit=10
```

**Response:**
```json
{
  "success": true,
  "deals": [
    {
      "company": "Scrub Daddy",
      "entrepreneur": "Aaron Krause",
      "dealAmount": 200000,
      "dealEquity": 20,
      "valuation": 1000000,
      "investors": ["Lori Greiner"],
      "season": 4,
      "episode": 7,
      "dealMade": true
    }
  ],
  "count": 10
}
```

---

### Get Popular Deals

**Endpoint:** `GET /deals/popular/list`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 10 | Number of deals to return |

**Example:**
```
GET /deals/popular/list?limit=10
```

**Response:**
```json
{
  "success": true,
  "deals": [...],
  "count": 10
}
```

---

### Get Deal Statistics

**Endpoint:** `GET /deals/stats/summary`

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalDeals": 1200,
    "successfulDeals": 650,
    "averageValuation": 2500000,
    "totalInvested": 150000000,
    "topInvestor": "Mark Cuban",
    "topIndustry": "Food & Beverage",
    "dealSuccessRate": 54.17
  }
}
```

---

### Get Batch Deals

**Endpoint:** `POST /deals/batch`

**Request:**
```json
{
  "companies": ["Scrub Daddy", "Ring", "Bombas"]
}
```

**Response:**
```json
{
  "success": true,
  "deals": [
    {
      "company": "Scrub Daddy",
      ...
    },
    {
      "company": "Ring",
      ...
    },
    {
      "company": "Bombas",
      ...
    }
  ],
  "count": 3
}
```

---

## 🦈 Sharks Endpoints

### Get All Sharks

**Endpoint:** `GET /sharks`

**Response:**
```json
{
  "success": true,
  "sharks": [
    {
      "id": "mark-cuban",
      "name": "Mark Cuban",
      "netWorth": "$5.1 billion",
      "industries": ["Technology", "Sports", "Entertainment", "Consumer Products"],
      "totalDeals": 85,
      "avatar": "/avatars/mark-cuban.jpg",
      "bio": "Entrepreneur, investor, and owner of the Dallas Mavericks"
    },
    {
      "id": "lori-greiner",
      "name": "Lori Greiner",
      "netWorth": "$150 million",
      "industries": ["Consumer Products", "Retail", "Home & Garden", "Beauty"],
      "totalDeals": 120,
      "avatar": "/avatars/lori-greiner.jpg",
      "bio": "Inventor and entrepreneur known as the 'Queen of QVC'"
    }
  ],
  "count": 6
}
```

---

### Get Shark by ID

**Endpoint:** `GET /sharks/:sharkId`

**Example:**
```
GET /sharks/mark-cuban
```

**Response:**
```json
{
  "success": true,
  "shark": {
    "id": "mark-cuban",
    "name": "Mark Cuban",
    "netWorth": "$5.1 billion",
    "industries": ["Technology", "Sports", "Entertainment", "Consumer Products"],
    "totalDeals": 85,
    "avatar": "/avatars/mark-cuban.jpg",
    "bio": "Entrepreneur, investor, and owner of the Dallas Mavericks"
  }
}
```

---

### Get Shark's Deals

**Endpoint:** `GET /sharks/:sharkId/deals`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 10 | Number of deals to return |

**Example:**
```
GET /sharks/mark-cuban/deals?limit=20
```

**Response:**
```json
{
  "success": true,
  "sharkId": "mark-cuban",
  "deals": [
    {
      "company": "Ten Thirty One Productions",
      "entrepreneur": "Melissa Carbone",
      "dealAmount": 2000000,
      "dealEquity": 20,
      "valuation": 10000000,
      "season": 4,
      "episode": 3,
      "industry": "Entertainment"
    }
  ],
  "count": 20
}
```

---

## 🗂️ Session Management

Sessions maintain conversation context across multiple messages.

### Get Session Details

**Endpoint:** `GET /agent/session/:sessionId`

**Response:**
```json
{
  "success": true,
  "session": {
    "sessionId": "session_1234567890_abc123",
    "messages": [
      {
        "role": "user",
        "content": "What is Shark Tank?",
        "timestamp": "2024-01-15T10:29:00.000Z"
      },
      {
        "role": "assistant",
        "content": "Shark Tank is a reality TV show...",
        "timestamp": "2024-01-15T10:29:02.000Z"
      }
    ],
    "createdAt": "2024-01-15T10:29:00.000Z",
    "lastActivity": "2024-01-15T10:29:02.000Z",
    "metadata": {
      "totalMessages": 10,
      "companiesMentioned": ["Scrub Daddy", "Ring"],
      "sharksMentioned": ["Mark Cuban", "Lori Greiner"],
      "lastDealDiscussed": {
        "company": "Scrub Daddy",
        "timestamp": "2024-01-15T10:29:02.000Z"
      }
    }
  }
}
```

---

### Clear Session

**Endpoint:** `DELETE /agent/session/:sessionId`

**Response:**
```json
{
  "success": true,
  "message": "Session cleared successfully"
}
```

---

### List All Sessions

**Endpoint:** `GET /agent/sessions`

**Response:**
```json
{
  "success": true,
  "count": 5,
  "sessions": [
    {
      "sessionId": "session_1234567890_abc123",
      "messageCount": 10,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "lastActivity": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

## 🔄 Queue Management

### Get Job Status

**Endpoint:** `GET /agent/queue/job/:jobId`

**Response:**
```json
{
  "success": true,
  "job": {
    "id": "42",
    "status": "completed",
    "progress": 100,
    "data": {
      "message": "What is Shark Tank?",
      "userId": "user-123"
    },
    "result": {
      "response": "Shark Tank is a reality TV show...",
      "sessionId": "session_123",
      "processingTime": 2500
    },
    "createdAt": "2024-01-15T10:29:57.000Z",
    "finishedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Job Status Values:**
- `waiting` - Job is queued
- `active` - Job is being processed
- `completed` - Job finished successfully
- `failed` - Job failed (check `error` field)
- `delayed` - Job is delayed for retry

---

### Get Job Result

**Endpoint:** `GET /agent/queue/job/:jobId/result`

**Response (Completed):**
```json
{
  "success": true,
  "result": {
    "response": "Shark Tank is a reality TV show...",
    "sessionId": "session_123",
    "processingTime": 2500,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response (Still Processing):**
```json
{
  "success": false,
  "message": "Job is still processing",
  "status": "active",
  "progress": 50
}
```

**Response (Failed):**
```json
{
  "success": false,
  "message": "Job failed",
  "error": "AI service unavailable"
}
```

---

### Cancel Job

**Endpoint:** `DELETE /agent/queue/job/:jobId`

**Response:**
```json
{
  "success": true,
  "message": "Job cancelled successfully"
}
```

---

### Retry Failed Job

**Endpoint:** `POST /agent/queue/job/:jobId/retry`

**Response:**
```json
{
  "success": true,
  "message": "Job retry initiated"
}
```

---

### Queue Statistics

**Endpoint:** `GET /agent/queue/stats`

**Response:**
```json
{
  "success": true,
  "stats": {
    "waiting": 5,
    "active": 2,
    "completed": 150,
    "failed": 3,
    "delayed": 0,
    "paused": 0,
    "total": 160
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Get Recent Jobs

**Endpoint:** `GET /agent/queue/jobs?limit=10&status=completed`

**Parameters:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | number | 10 | Number of jobs to return |
| `status` | string | all | Filter by status (waiting, active, completed, failed) |

**Response:**
```json
{
  "success": true,
  "count": 10,
  "jobs": [
    {
      "id": "42",
      "status": "completed",
      "data": { "message": "What is Shark Tank?" },
      "result": { "response": "..." },
      "createdAt": "2024-01-15T10:29:57.000Z"
    }
  ]
}
```

---

## 🏥 Health & Monitoring

### Agent Health Check

**Endpoint:** `GET /agent/health`

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "service": "Shark Tank AI Agent",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Queue Health Check

**Endpoint:** `GET /agent/queue/health`

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "service": "Agent Queue",
  "stats": {
    "waiting": 5,
    "active": 2,
    "completed": 150,
    "failed": 3
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Agent Statistics

**Endpoint:** `GET /agent/stats`

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalSessions": 25,
    "activeSessions": 5,
    "totalMessages": 150
  }
}
```

---

## ⚠️ Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message here",
  "message": "Human-readable description",
  "statusCode": 400
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid input)
- `404` - Not Found (job/session doesn't exist)
- `408` - Request Timeout (job took too long)
- `500` - Internal Server Error

---

## 💻 Code Examples

### React Hook Example

```javascript
import { useState, useEffect } from 'react';

function useSharkTankChat() {
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = async (message) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/agent/chat/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          sessionId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSessionId(data.sessionId);
        return data.response;
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearSession = () => {
    setSessionId(null);
  };

  return { sendMessage, loading, error, sessionId, clearSession };
}

// Usage in component
function ChatComponent() {
  const { sendMessage, loading, error } = useSharkTankChat();
  const [messages, setMessages] = useState([]);

  const handleSend = async (userMessage) => {
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    try {
      const response = await sendMessage(userMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      console.error('Chat error:', err);
    }
  };

  return (
    <div>
      {messages.map((msg, i) => (
        <div key={i} className={msg.role}>
          {msg.content}
        </div>
      ))}
      {loading && <div>Thinking...</div>}
      {error && <div>Error: {error}</div>}
    </div>
  );
}
```

---

### Vue.js Composition API Example

```javascript
import { ref } from 'vue';

export function useSharkTankChat() {
  const sessionId = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const sendMessage = async (message) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch('http://localhost:3000/agent/chat/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          sessionId: sessionId.value,
        }),
      });

      const data = await response.json();

      if (data.success) {
        sessionId.value = data.sessionId;
        return data.response;
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const clearSession = () => {
    sessionId.value = null;
  };

  return { sendMessage, loading, error, sessionId, clearSession };
}
```

---

### Vanilla JavaScript Example

```javascript
class SharkTankChat {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.sessionId = null;
  }

  async sendMessage(message) {
    const response = await fetch(`${this.baseUrl}/agent/chat/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        sessionId: this.sessionId,
      }),
    });

    const data = await response.json();

    if (data.success) {
      this.sessionId = data.sessionId;
      return data.response;
    } else {
      throw new Error(data.error || 'Failed to get response');
    }
  }

  async sendMessageAsync(message) {
    // Submit job
    const submitResponse = await fetch(`${this.baseUrl}/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        sessionId: this.sessionId,
      }),
    });

    const submitData = await submitResponse.json();
    const jobId = submitData.jobId;

    // Poll for result
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const resultResponse = await fetch(
        `${this.baseUrl}/agent/queue/job/${jobId}/result`
      );
      const resultData = await resultResponse.json();

      if (resultData.success) {
        this.sessionId = resultData.result.sessionId;
        return resultData.result.response;
      } else if (resultData.message === 'Job failed') {
        throw new Error(resultData.error);
      }
      // Continue polling if still processing
    }
  }

  clearSession() {
    this.sessionId = null;
  }

  async getQueueStats() {
    const response = await fetch(`${this.baseUrl}/agent/queue/stats`);
    const data = await response.json();
    return data.stats;
  }
}

// Usage
const chat = new SharkTankChat();

async function example() {
  const response1 = await chat.sendMessage('What is Shark Tank?');
  console.log(response1);

  const response2 = await chat.sendMessage('Tell me more');
  console.log(response2); // Has context from previous message

  const stats = await chat.getQueueStats();
  console.log('Queue stats:', stats);
}
```

---

### TypeScript Types

```typescript
// Request types
interface ChatRequest {
  message: string;
  sessionId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

// Response types
interface ChatSyncResponse {
  success: true;
  response: string;
  sessionId: string;
  processingTime: number;
  timestamp: string;
}

interface ChatAsyncResponse {
  success: true;
  jobId: string;
  message: string;
  statusUrl: string;
  resultUrl: string;
  timestamp: string;
}

interface JobStatus {
  id: string;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
  progress: number;
  data: any;
  result?: any;
  error?: string;
  createdAt: string;
  finishedAt?: string;
}

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
  total: number;
}

// API Client
class SharkTankAPI {
  constructor(private baseUrl: string = 'http://localhost:3000') {}

  async sendMessage(request: ChatRequest): Promise<ChatSyncResponse> {
    const response = await fetch(`${this.baseUrl}/agent/chat/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return response.json();
  }

  async getJobStatus(jobId: string): Promise<JobStatus> {
    const response = await fetch(`${this.baseUrl}/agent/queue/job/${jobId}`);
    const data = await response.json();
    return data.job;
  }

  async getQueueStats(): Promise<QueueStats> {
    const response = await fetch(`${this.baseUrl}/agent/queue/stats`);
    const data = await response.json();
    return data.stats;
  }
}
```

---

## 🎯 Best Practices

1. **Always save the sessionId** - Include it in subsequent requests for conversation context
2. **Use sync endpoint for chat UIs** - Simpler and better UX for typical chat interfaces
3. **Use async endpoint for batch processing** - Better for processing multiple queries
4. **Handle timeouts gracefully** - Switch to polling if sync request times out
5. **Show loading states** - Chat responses take 2-5 seconds on average
6. **Implement retry logic** - Network issues can happen
7. **Clear sessions when done** - Prevents memory buildup on server
8. **Monitor queue stats** - Check if server is overloaded
9. **Cache responses** - Don't re-ask identical questions
10. **Validate user input** - Check message is not empty before sending

---

## 🔗 Related Documentation

- [Main README](./README.md) - Full project documentation
- [Production Setup](./PRODUCTION_SETUP.md) - Deployment guide
- [Queue Integration](./AGENT_QUEUE_INTEGRATION.md) - Detailed queue documentation

---

## 📞 Support

For issues or questions:
- Check the [troubleshooting section](./README.md#-troubleshooting) in main README
- Test server health: `GET /agent/health`
- Check queue stats: `GET /agent/queue/stats`

---

**Last Updated:** January 2024  
**API Version:** 1.0.0
