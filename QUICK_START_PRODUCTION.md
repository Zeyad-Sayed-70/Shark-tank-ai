# Quick Start - Production Ready Agent

Get the AI Agent with queue system running in 5 minutes.

## 1. Start Redis

```bash
# Using Docker (easiest)
docker run -d -p 6379:6379 --name redis redis:alpine
```

## 2. Check Redis

```bash
node check-redis.js
```

Expected: `✅ Redis is running!`

## 3. Start Application

```bash
# With automatic Redis check
node start-with-redis-check.js

# Or directly
npm run start:dev
```

## 4. Test the Agent

```bash
node test-agent-production.js
```

## 5. Use the API

### Submit a job:

```bash
curl -X POST http://localhost:3000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is Shark Tank?", "userId": "user-123"}'
```

Response:
```json
{
  "success": true,
  "jobId": "1",
  "statusUrl": "/agent/queue/job/1",
  "resultUrl": "/agent/queue/job/1/result"
}
```

### Check job status:

```bash
curl http://localhost:3000/agent/queue/job/1
```

### Get result:

```bash
curl http://localhost:3000/agent/queue/job/1/result
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/agent/chat` | POST | Submit chat job |
| `/agent/queue/job/:id` | GET | Get job status |
| `/agent/queue/job/:id/result` | GET | Get job result |
| `/agent/queue/stats` | GET | Queue statistics |
| `/agent/health` | GET | Health check |
| `/agent/queue/health` | GET | Queue health |

## How It Works

```
1. POST /agent/chat
   ↓
2. Returns jobId immediately
   ↓
3. Job queued in Redis
   ↓
4. Worker processes job
   ↓
5. GET /agent/queue/job/:id
   ↓
6. Returns result when complete
```

## Job Status Flow

```
waiting → active → completed
                 ↘ failed (with retry)
```

## Example: Complete Flow

```javascript
// 1. Submit job
const response = await fetch('http://localhost:3000/agent/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'What is Shark Tank?',
    userId: 'user-123'
  })
});

const { jobId } = await response.json();
console.log('Job ID:', jobId);

// 2. Poll for result
async function waitForResult(jobId) {
  while (true) {
    const statusRes = await fetch(`http://localhost:3000/agent/queue/job/${jobId}`);
    const { job } = await statusRes.json();
    
    console.log(`Status: ${job.status}, Progress: ${job.progress}%`);
    
    if (job.status === 'completed') {
      return job.result;
    }
    
    if (job.status === 'failed') {
      throw new Error(job.error);
    }
    
    await new Promise(r => setTimeout(r, 2000)); // Wait 2s
  }
}

// 3. Get result
const result = await waitForResult(jobId);
console.log('Response:', result.response);
```

## Troubleshooting

### Redis not running?

```bash
# Check
redis-cli ping

# Start
docker run -d -p 6379:6379 --name redis redis:alpine
```

### Jobs not processing?

```bash
# Check queue stats
curl http://localhost:3000/agent/queue/stats

# Check logs
npm run start:dev
```

### Need help?

1. Run: `node check-redis.js`
2. Check: `curl http://localhost:3000/agent/health`
3. Test: `node test-agent-production.js`
4. Read: [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md)

## Configuration

Create `.env`:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
PORT=3000
```

## Features

✅ **Queue-based processing** - Non-blocking, scalable  
✅ **Automatic retries** - 3 attempts with exponential backoff  
✅ **Progress tracking** - Real-time job progress  
✅ **Job management** - Status, cancel, retry  
✅ **Session support** - Conversation context  
✅ **Production-ready** - Error handling, monitoring  

## Next Steps

- Read [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) for detailed setup
- Check [AGENT_QUEUE_INTEGRATION.md](./AGENT_QUEUE_INTEGRATION.md) for API docs
- See [README_QUEUE.md](./README_QUEUE.md) for complete guide

## Support

- Health: `curl http://localhost:3000/agent/health`
- Stats: `curl http://localhost:3000/agent/queue/stats`
- Test: `node test-agent-production.js`
