# AI Agent Queue - Quick Start Guide

## What Changed?

The AI Agent now uses a **job queue system** by default instead of direct processing. This means:

✅ Better scalability and reliability  
✅ Automatic retries on failures  
✅ Progress tracking  
✅ Non-blocking requests  

## Quick Examples

### Option 1: Synchronous (Easiest - Recommended)

Use `/agent/chat/sync` - it queues the job and waits for the result:

```bash
curl -X POST http://localhost:3000/agent/chat/sync \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is Shark Tank?",
    "userId": "user-123"
  }'
```

**Response:**
```json
{
  "success": true,
  "response": "Shark Tank is a reality TV show...",
  "sessionId": "session_123",
  "processingTime": 2500
}
```

### Option 2: Asynchronous (For Long-Running Tasks)

Use `/agent/chat` - it returns immediately with a job ID:

```bash
# Step 1: Submit job
curl -X POST http://localhost:3000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is Shark Tank?",
    "userId": "user-123"
  }'
```

**Response:**
```json
{
  "success": true,
  "jobId": "123",
  "statusUrl": "/agent/queue/job/123",
  "resultUrl": "/agent/queue/job/123/result"
}
```

```bash
# Step 2: Check result (poll until completed)
curl http://localhost:3000/agent/queue/job/123/result
```

### Option 3: Legacy Mode (Direct Processing)

Use `useQueue: false` to bypass the queue:

```bash
curl -X POST http://localhost:3000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is Shark Tank?",
    "useQueue": false
  }'
```

## Conversation Example

```javascript
// First message
const res1 = await fetch('http://localhost:3000/agent/chat/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Tell me about Mark Cuban'
  })
});
const result1 = await res1.json();
const sessionId = result1.sessionId;

// Follow-up (with context)
const res2 = await fetch('http://localhost:3000/agent/chat/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'What companies has he invested in?',
    sessionId: sessionId  // Include session for context
  })
});
const result2 = await res2.json();
```

## Monitoring

Check queue statistics:

```bash
curl http://localhost:3000/agent/queue/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "waiting": 5,
    "active": 2,
    "completed": 150,
    "failed": 3
  }
}
```

## Testing

Run the test script:

```bash
node test-agent-queue.js
```

## When to Use Each Mode

| Mode | Use Case |
|------|----------|
| **Sync** (`/agent/chat/sync`) | Most common use case, simple request-response |
| **Async** (`/agent/chat`) | Long-running tasks, batch processing, webhooks |
| **Legacy** (`useQueue: false`) | Debugging, testing, or when queue is unavailable |

## Configuration

Ensure Redis is configured in `.env`:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
```

## Common Issues

**Q: Jobs stuck in "waiting" status?**  
A: Check if Redis is running: `redis-cli ping`

**Q: Want to disable queue temporarily?**  
A: Use `useQueue: false` in your request

**Q: Need to cancel a job?**  
A: `DELETE /agent/queue/job/:jobId`

## Full Documentation

See [AGENT_QUEUE_INTEGRATION.md](./AGENT_QUEUE_INTEGRATION.md) for complete API reference and advanced usage.
