# AI Agent Queue Integration

This document explains how the AI Agent has been integrated with the job queue system for better scalability and reliability.

## Overview

The AI Agent now supports both **queue-based processing** (default) and **direct processing** (legacy mode). Queue-based processing provides:

- **Asynchronous execution**: Submit requests and check status later
- **Better scalability**: Handle multiple concurrent requests efficiently
- **Fault tolerance**: Automatic retries on failures
- **Progress tracking**: Monitor job progress in real-time
- **Job management**: Cancel, retry, and monitor jobs

## Architecture

```
Client Request
     ↓
Agent Controller (/agent/chat)
     ↓
Agent Queue Service (adds job to queue)
     ↓
Redis Queue (Bull)
     ↓
Agent Queue Processor (processes job)
     ↓
Shark Tank Agent (LangChain)
     ↓
Result stored in job
```

## API Endpoints

### 1. Queue Chat (Async) - Default Behavior

**POST** `/agent/chat`

Submit a chat message to the queue for asynchronous processing.

**Request:**
```json
{
  "message": "What is Shark Tank?",
  "sessionId": "optional-session-id",
  "userId": "optional-user-id",
  "metadata": {
    "source": "web-app"
  }
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "123",
  "message": "Chat request queued successfully",
  "statusUrl": "/agent/queue/job/123",
  "resultUrl": "/agent/queue/job/123/result",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Synchronous Chat (Queue + Wait)

**POST** `/agent/chat/sync`

Submit a chat message and wait for the result (with 60-second timeout).

**Request:**
```json
{
  "message": "Who are the sharks?",
  "sessionId": "optional-session-id",
  "userId": "optional-user-id"
}
```

**Response:**
```json
{
  "success": true,
  "response": "The sharks on Shark Tank are...",
  "sessionId": "session_123",
  "processingTime": 2500,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 3. Direct Processing (Legacy Mode)

**POST** `/agent/chat`

Process chat message directly without using the queue.

**Request:**
```json
{
  "message": "What is Shark Tank?",
  "sessionId": "optional-session-id",
  "useQueue": false
}
```

**Response:**
```json
{
  "success": true,
  "response": "Shark Tank is...",
  "sessionId": "session_123",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 4. Check Job Status

**GET** `/agent/queue/job/:jobId`

Check the status of a queued job.

**Response:**
```json
{
  "success": true,
  "job": {
    "id": "123",
    "status": "completed",
    "progress": 100,
    "data": {
      "message": "What is Shark Tank?",
      "sessionId": "session_123"
    },
    "result": {
      "response": "Shark Tank is...",
      "sessionId": "session_123",
      "processingTime": 2500,
      "timestamp": "2024-01-15T10:30:00.000Z"
    },
    "createdAt": "2024-01-15T10:29:57.000Z",
    "finishedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Job Statuses:**
- `waiting`: Job is in queue
- `active`: Job is being processed
- `completed`: Job finished successfully
- `failed`: Job failed (check `error` field)
- `delayed`: Job is delayed
- `paused`: Queue is paused

### 5. Get Job Result

**GET** `/agent/queue/job/:jobId/result`

Get the result of a completed job.

**Response:**
```json
{
  "success": true,
  "result": {
    "response": "Shark Tank is...",
    "sessionId": "session_123",
    "processingTime": 2500,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### 6. Queue Statistics

**GET** `/agent/queue/stats`

Get queue statistics.

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

## Usage Examples

### Example 1: Async Processing with Polling

```javascript
// Submit job
const submitResponse = await fetch('http://localhost:3000/agent/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'What is Shark Tank?',
    userId: 'user-123'
  })
});

const { jobId } = await submitResponse.json();

// Poll for result
async function waitForResult(jobId) {
  while (true) {
    const statusResponse = await fetch(`http://localhost:3000/agent/queue/job/${jobId}`);
    const { job } = await statusResponse.json();
    
    if (job.status === 'completed') {
      return job.result;
    }
    
    if (job.status === 'failed') {
      throw new Error(job.error);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

const result = await waitForResult(jobId);
console.log(result.response);
```

### Example 2: Synchronous Processing

```javascript
const response = await fetch('http://localhost:3000/agent/chat/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Who are the sharks?',
    userId: 'user-123'
  })
});

const result = await response.json();
console.log(result.response);
```

### Example 3: Conversation with Session

```javascript
// First message
const response1 = await fetch('http://localhost:3000/agent/chat/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Tell me about Mark Cuban'
  })
});

const result1 = await response1.json();
const sessionId = result1.sessionId;

// Follow-up message with context
const response2 = await fetch('http://localhost:3000/agent/chat/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'What companies has he invested in?',
    sessionId: sessionId
  })
});

const result2 = await response2.json();
console.log(result2.response);
```

## Configuration

The queue system uses Redis for job storage. Configure Redis connection in your `.env` file:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
```

## Queue Settings

Default queue settings (configured in `agent.module.ts`):

- **Attempts**: 3 retries on failure
- **Backoff**: Exponential backoff starting at 2 seconds
- **Job Retention**: Keep last 100 completed and failed jobs

## Session Management

Sessions are automatically managed:

1. When a job is queued with a `sessionId`, the conversation history is included
2. After job completion, the session is updated with the new messages
3. Sessions expire after 30 minutes of inactivity

## Benefits of Queue-Based Processing

1. **Scalability**: Handle high traffic by distributing work across multiple workers
2. **Reliability**: Automatic retries on failures with exponential backoff
3. **Monitoring**: Track job progress and status in real-time
4. **Resource Management**: Prevent server overload by controlling concurrent jobs
5. **Fault Tolerance**: Jobs persist in Redis even if the server restarts

## Migration from Direct Processing

To migrate existing code:

**Before (Direct):**
```javascript
const response = await fetch('/agent/chat', {
  method: 'POST',
  body: JSON.stringify({ message: 'Hello' })
});
const result = await response.json();
console.log(result.response);
```

**After (Queue - Async):**
```javascript
const response = await fetch('/agent/chat', {
  method: 'POST',
  body: JSON.stringify({ message: 'Hello' })
});
const { jobId } = await response.json();

// Poll for result
const resultResponse = await fetch(`/agent/queue/job/${jobId}/result`);
const result = await resultResponse.json();
console.log(result.result.response);
```

**After (Queue - Sync):**
```javascript
const response = await fetch('/agent/chat/sync', {
  method: 'POST',
  body: JSON.stringify({ message: 'Hello' })
});
const result = await response.json();
console.log(result.response);
```

**Legacy Mode (No Changes):**
```javascript
const response = await fetch('/agent/chat', {
  method: 'POST',
  body: JSON.stringify({ 
    message: 'Hello',
    useQueue: false  // Disable queue
  })
});
const result = await response.json();
console.log(result.response);
```

## Testing

Run the test script to verify the queue integration:

```bash
node test-agent-queue.js
```

This will test:
- Async queue processing
- Job status checking
- Synchronous processing
- Conversation with sessions
- Queue statistics
- Direct processing (legacy mode)

## Troubleshooting

### Jobs stuck in "waiting" status
- Check if Redis is running: `redis-cli ping`
- Check if queue processor is running
- Check queue stats: `GET /agent/queue/stats`

### Jobs failing repeatedly
- Check job error: `GET /agent/queue/job/:jobId`
- Check server logs for detailed error messages
- Verify API keys and configuration

### High queue latency
- Check active worker count
- Monitor Redis performance
- Consider scaling workers horizontally

## Next Steps

- Add webhook notifications for job completion
- Implement priority queues for urgent requests
- Add rate limiting per user
- Implement job scheduling for delayed execution
- Add metrics and monitoring dashboards
