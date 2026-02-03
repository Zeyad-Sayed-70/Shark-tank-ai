# Agent Job Queue Documentation

## Overview

The Agent Job Queue system provides asynchronous processing for AI agent requests using Bull (Redis-based queue). This allows for better scalability, reliability, and monitoring of agent interactions.

---

## Features

- **Asynchronous Processing**: Queue chat requests for background processing
- **Job Tracking**: Monitor job status, progress, and results
- **Retry Logic**: Automatic retry with exponential backoff
- **Batch Processing**: Process multiple messages in a single job
- **Queue Management**: Pause, resume, and clean the queue
- **Statistics**: Real-time queue metrics
- **Job History**: Keep track of completed and failed jobs

---

## Architecture

```
Client Request
    ↓
Queue Controller (Add Job)
    ↓
Bull Queue (Redis)
    ↓
Queue Processor (Process Job)
    ↓
Shark Tank Agent
    ↓
Store Result in Redis
    ↓
Client Polls for Result
```

---

## Installation

### 1. Install Dependencies

Already added to `package.json`:
- `@nestjs/bull` - NestJS Bull integration
- `bull` - Redis-based queue
- `@types/bull` - TypeScript types

```bash
npm install
```

### 2. Install Redis

**Windows:**
```bash
# Using Chocolatey
choco install redis-64

# Or download from: https://github.com/microsoftarchive/redis/releases
```

**Linux/Mac:**
```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# Mac
brew install redis
```

### 3. Start Redis

```bash
# Windows
redis-server

# Linux/Mac
redis-server
```

### 4. Configure Environment

Add to `.env`:
```env
# Redis Configuration (optional, defaults provided)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

---

## API Endpoints

### 1. Queue Chat Job

**POST /agent/queue/chat**

Queue a chat message for async processing.

**Request:**
```json
{
  "message": "What deals did Mark Cuban make?",
  "sessionId": "optional_session_id",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Previous message"
    },
    {
      "role": "assistant",
      "content": "Previous response"
    }
  ],
  "userId": "user123",
  "metadata": {
    "source": "web",
    "priority": "high"
  }
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "1",
  "message": "Chat job queued successfully",
  "statusUrl": "/agent/queue/job/1",
  "timestamp": "2026-01-31T15:30:00.000Z"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/agent/queue/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What deals did Mark Cuban make?",
    "userId": "user123"
  }'
```

---

### 2. Queue Batch Chat Job

**POST /agent/queue/batch**

Queue multiple messages for batch processing.

**Request:**
```json
{
  "messages": [
    {
      "message": "What deals did Mark Cuban make?",
      "sessionId": "session1"
    },
    {
      "message": "Show me food companies",
      "sessionId": "session2"
    }
  ],
  "userId": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "2",
  "messageCount": 2,
  "message": "Batch chat job queued successfully",
  "statusUrl": "/agent/queue/job/2",
  "timestamp": "2026-01-31T15:30:00.000Z"
}
```

---

### 3. Get Job Status

**GET /agent/queue/job/:jobId**

Get detailed status of a job.

**Response:**
```json
{
  "success": true,
  "job": {
    "id": "1",
    "status": "completed",
    "progress": 100,
    "data": {
      "message": "What deals did Mark Cuban make?",
      "userId": "user123"
    },
    "result": {
      "response": "Based on the Shark Tank database...",
      "sessionId": "session_1234567890",
      "processingTime": 2500,
      "timestamp": "2026-01-31T15:30:05.000Z"
    },
    "createdAt": "2026-01-31T15:30:00.000Z",
    "processedAt": "2026-01-31T15:30:02.000Z",
    "finishedAt": "2026-01-31T15:30:05.000Z",
    "attemptsMade": 1
  }
}
```

**Job Statuses:**
- `waiting` - Job is in queue
- `active` - Job is being processed
- `completed` - Job finished successfully
- `failed` - Job failed after retries
- `delayed` - Job is delayed
- `paused` - Queue is paused

**Example:**
```bash
curl http://localhost:3000/agent/queue/job/1
```

---

### 4. Get Job Result

**GET /agent/queue/job/:jobId/result**

Get only the result of a completed job.

**Response (Completed):**
```json
{
  "success": true,
  "result": {
    "response": "Based on the Shark Tank database...",
    "sessionId": "session_1234567890",
    "processingTime": 2500,
    "timestamp": "2026-01-31T15:30:05.000Z"
  }
}
```

**Response (Still Processing):**
```json
{
  "success": false,
  "message": "Job is still processing",
  "status": "active",
  "progress": 45
}
```

**Response (Failed):**
```json
{
  "success": false,
  "message": "Job failed",
  "error": "AI Service call failed: Connection timeout"
}
```

---

### 5. Cancel Job

**DELETE /agent/queue/job/:jobId**

Cancel a waiting or active job.

**Response:**
```json
{
  "success": true,
  "message": "Job cancelled successfully"
}
```

**Example:**
```bash
curl -X DELETE http://localhost:3000/agent/queue/job/1
```

---

### 6. Retry Failed Job

**POST /agent/queue/job/:jobId/retry**

Retry a failed job.

**Response:**
```json
{
  "success": true,
  "message": "Job retry initiated"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/agent/queue/job/1/retry
```

---

### 7. Get Queue Statistics

**GET /agent/queue/stats**

Get real-time queue statistics.

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
  "timestamp": "2026-01-31T15:30:00.000Z"
}
```

---

### 8. Get Recent Jobs

**GET /agent/queue/jobs**

Get list of recent jobs.

**Query Parameters:**
- `limit` (optional): Number of jobs to return (default: 10)
- `status` (optional): Filter by status (waiting, active, completed, failed)

**Response:**
```json
{
  "success": true,
  "count": 10,
  "jobs": [
    {
      "id": "1",
      "status": "completed",
      "progress": 100,
      "data": {
        "message": "What deals did Mark Cuban make?"
      },
      "result": {
        "response": "..."
      },
      "createdAt": "2026-01-31T15:30:00.000Z",
      "finishedAt": "2026-01-31T15:30:05.000Z"
    }
  ]
}
```

**Examples:**
```bash
# Get last 20 jobs
curl "http://localhost:3000/agent/queue/jobs?limit=20"

# Get only failed jobs
curl "http://localhost:3000/agent/queue/jobs?status=failed"

# Get only completed jobs
curl "http://localhost:3000/agent/queue/jobs?status=completed&limit=50"
```

---

### 9. Clean Old Jobs

**POST /agent/queue/clean**

Remove old completed and failed jobs.

**Query Parameters:**
- `olderThan` (optional): Milliseconds (default: 86400000 = 24 hours)

**Response:**
```json
{
  "success": true,
  "message": "Cleaned jobs older than 86400000ms"
}
```

**Examples:**
```bash
# Clean jobs older than 24 hours (default)
curl -X POST http://localhost:3000/agent/queue/clean

# Clean jobs older than 1 hour
curl -X POST "http://localhost:3000/agent/queue/clean?olderThan=3600000"
```

---

### 10. Pause Queue

**POST /agent/queue/pause**

Pause job processing.

**Response:**
```json
{
  "success": true,
  "message": "Queue paused"
}
```

---

### 11. Resume Queue

**POST /agent/queue/resume**

Resume job processing.

**Response:**
```json
{
  "success": true,
  "message": "Queue resumed"
}
```

---

### 12. Queue Health Check

**GET /agent/queue/health**

Check queue health and get stats.

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
  "timestamp": "2026-01-31T15:30:00.000Z"
}
```

---

## Usage Patterns

### Pattern 1: Simple Async Chat

```javascript
// 1. Queue the job
const queueResponse = await fetch('http://localhost:3000/agent/queue/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'What deals did Mark Cuban make?',
    userId: 'user123'
  })
});

const { jobId } = await queueResponse.json();

// 2. Poll for result
const pollInterval = setInterval(async () => {
  const statusResponse = await fetch(`http://localhost:3000/agent/queue/job/${jobId}/result`);
  const data = await statusResponse.json();
  
  if (data.success && data.result) {
    console.log('Response:', data.result.response);
    clearInterval(pollInterval);
  } else if (data.message === 'Job failed') {
    console.error('Job failed:', data.error);
    clearInterval(pollInterval);
  }
}, 2000); // Poll every 2 seconds
```

---

### Pattern 2: Batch Processing

```javascript
// Queue multiple messages
const response = await fetch('http://localhost:3000/agent/queue/batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { message: 'What deals did Mark Cuban make?' },
      { message: 'Show me food companies' },
      { message: 'Calculate 100000 / 0.10' }
    ],
    userId: 'user123'
  })
});

const { jobId } = await response.json();

// Wait for batch to complete
// ... poll for result
```

---

### Pattern 3: With Conversation History

```javascript
const response = await fetch('http://localhost:3000/agent/queue/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Tell me more about the first one',
    sessionId: 'session_123',
    conversationHistory: [
      {
        role: 'user',
        content: 'What deals did Mark Cuban make?'
      },
      {
        role: 'assistant',
        content: 'Mark Cuban has made several deals...'
      }
    ],
    userId: 'user123'
  })
});
```

---

## Configuration

### Queue Options

Configured in `agent.module.ts`:

```typescript
{
  attempts: 3,              // Retry failed jobs 3 times
  backoff: {
    type: 'exponential',    // Exponential backoff
    delay: 2000            // Start with 2 second delay
  },
  removeOnComplete: 100,    // Keep last 100 completed jobs
  removeOnFail: 100        // Keep last 100 failed jobs
}
```

### Redis Configuration

Set in `.env`:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password  # Optional
```

---

## Monitoring

### Dashboard Metrics

Monitor these endpoints:

1. **Queue Stats**: `GET /agent/queue/stats`
   - Active jobs
   - Waiting jobs
   - Completed/failed counts

2. **Recent Jobs**: `GET /agent/queue/jobs`
   - Job history
   - Success/failure rates

3. **Health Check**: `GET /agent/queue/health`
   - Overall queue health

### Logging

The queue processor logs:
- Job start/completion
- Processing time
- Errors and failures

Check console output for:
```
[AgentQueueProcessor] Processing job 1 for message: "..."
[AgentQueueProcessor] Job 1 completed in 2500ms
```

---

## Error Handling

### Automatic Retries

Failed jobs are automatically retried:
- Attempt 1: Immediate
- Attempt 2: After 2 seconds
- Attempt 3: After 4 seconds

### Failed Job Handling

```javascript
// Check if job failed
const status = await fetch(`http://localhost:3000/agent/queue/job/${jobId}`);
const data = await status.json();

if (data.job.status === 'failed') {
  console.error('Job failed:', data.job.failedReason);
  
  // Retry manually
  await fetch(`http://localhost:3000/agent/queue/job/${jobId}/retry`, {
    method: 'POST'
  });
}
```

---

## Best Practices

### 1. Use Queue for Long-Running Tasks

Use the queue for:
- Complex queries requiring multiple tools
- Batch processing
- High-load scenarios

Use direct chat for:
- Simple, quick responses
- Real-time interactions

### 2. Poll Intelligently

```javascript
// Good: Exponential backoff
let delay = 1000;
const maxDelay = 10000;

const poll = async () => {
  const result = await checkJobResult(jobId);
  
  if (!result) {
    delay = Math.min(delay * 1.5, maxDelay);
    setTimeout(poll, delay);
  }
};
```

### 3. Clean Up Old Jobs

```javascript
// Run daily cleanup
setInterval(async () => {
  await fetch('http://localhost:3000/agent/queue/clean', {
    method: 'POST'
  });
}, 24 * 60 * 60 * 1000);
```

### 4. Monitor Queue Health

```javascript
// Check queue health regularly
setInterval(async () => {
  const health = await fetch('http://localhost:3000/agent/queue/health');
  const data = await health.json();
  
  if (data.stats.failed > 10) {
    console.warn('High failure rate detected');
  }
}, 60000); // Every minute
```

---

## Troubleshooting

### Redis Connection Issues

**Error**: `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Solution**:
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# If not running, start Redis
redis-server
```

### Jobs Stuck in Queue

**Check**:
```bash
curl http://localhost:3000/agent/queue/stats
```

**Solution**:
```bash
# Resume queue if paused
curl -X POST http://localhost:3000/agent/queue/resume

# Or restart the server
```

### High Failure Rate

**Check recent failed jobs**:
```bash
curl "http://localhost:3000/agent/queue/jobs?status=failed&limit=10"
```

**Common causes**:
- AI endpoint down
- Database connection issues
- Invalid job data

---

## Summary

The Agent Job Queue provides:

✅ **Async Processing** - Non-blocking chat requests  
✅ **Job Tracking** - Monitor status and progress  
✅ **Retry Logic** - Automatic failure recovery  
✅ **Batch Processing** - Handle multiple requests  
✅ **Queue Management** - Pause, resume, clean  
✅ **Statistics** - Real-time metrics  
✅ **Scalability** - Redis-based distribution  

**Start using it:**
```bash
# Install Redis
redis-server

# Queue a chat
curl -X POST http://localhost:3000/agent/queue/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What deals did Mark Cuban make?"}'
```
