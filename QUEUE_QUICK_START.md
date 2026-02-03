# Agent Job Queue - Quick Start

## Installation

### 1. Install Dependencies

```bash
npm install
```

New packages added:
- `@nestjs/bull` - NestJS Bull integration
- `bull` - Redis-based queue
- `@types/bull` - TypeScript types

### 2. Install & Start Redis

**Windows:**
```bash
# Using Chocolatey
choco install redis-64

# Start Redis
redis-server
```

**Linux/Mac:**
```bash
# Install
sudo apt-get install redis-server  # Ubuntu/Debian
brew install redis                  # Mac

# Start Redis
redis-server
```

### 3. Configure Environment

Add to `.env` (optional, has defaults):
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### 4. Start Server

```bash
npm run start:dev
```

You should see:
```
[AgentQueueProcessor] Agent Queue Processor initialized
```

---

## Quick Test

### Test 1: Queue a Chat

```bash
curl -X POST http://localhost:3000/agent/queue/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What deals did Mark Cuban make?"}'
```

**Response:**
```json
{
  "success": true,
  "jobId": "1",
  "statusUrl": "/agent/queue/job/1"
}
```

### Test 2: Check Job Status

```bash
curl http://localhost:3000/agent/queue/job/1
```

**Response:**
```json
{
  "success": true,
  "job": {
    "id": "1",
    "status": "completed",
    "progress": 100,
    "result": {
      "response": "Based on the Shark Tank database..."
    }
  }
}
```

### Test 3: Get Result

```bash
curl http://localhost:3000/agent/queue/job/1/result
```

**Response:**
```json
{
  "success": true,
  "result": {
    "response": "Based on the Shark Tank database...",
    "processingTime": 2500
  }
}
```

---

## Run Full Test Suite

```bash
node test-queue.js
```

This will test:
- Queue health
- Simple chat
- Job status tracking
- Conversation history
- Batch processing
- Queue statistics
- Job cancellation

---

## API Endpoints

### Queue Management
- `POST /agent/queue/chat` - Queue a chat
- `POST /agent/queue/batch` - Queue batch messages
- `GET /agent/queue/job/:id` - Get job status
- `GET /agent/queue/job/:id/result` - Get job result
- `DELETE /agent/queue/job/:id` - Cancel job
- `POST /agent/queue/job/:id/retry` - Retry failed job

### Monitoring
- `GET /agent/queue/stats` - Queue statistics
- `GET /agent/queue/jobs` - Recent jobs
- `GET /agent/queue/health` - Health check

### Administration
- `POST /agent/queue/clean` - Clean old jobs
- `POST /agent/queue/pause` - Pause queue
- `POST /agent/queue/resume` - Resume queue

---

## Usage Example

### JavaScript/Node.js

```javascript
// 1. Queue a job
const response = await fetch('http://localhost:3000/agent/queue/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'What deals did Mark Cuban make?',
    userId: 'user123'
  })
});

const { jobId } = await response.json();

// 2. Poll for result
const pollInterval = setInterval(async () => {
  const result = await fetch(`http://localhost:3000/agent/queue/job/${jobId}/result`);
  const data = await result.json();
  
  if (data.success && data.result) {
    console.log('Response:', data.result.response);
    clearInterval(pollInterval);
  }
}, 2000);
```

### Python

```python
import requests
import time

# 1. Queue a job
response = requests.post('http://localhost:3000/agent/queue/chat', json={
    'message': 'What deals did Mark Cuban make?',
    'userId': 'user123'
})

job_id = response.json()['jobId']

# 2. Poll for result
while True:
    result = requests.get(f'http://localhost:3000/agent/queue/job/{job_id}/result')
    data = result.json()
    
    if data.get('success') and data.get('result'):
        print('Response:', data['result']['response'])
        break
    
    time.sleep(2)
```

---

## When to Use Queue vs Direct Chat

### Use Queue For:
- ✅ Long-running queries
- ✅ Batch processing
- ✅ High-load scenarios
- ✅ Background processing
- ✅ Retry requirements
- ✅ Job tracking needs

### Use Direct Chat For:
- ✅ Real-time interactions
- ✅ Simple, quick responses
- ✅ Low latency requirements
- ✅ Streaming responses

---

## Monitoring

### Check Queue Health

```bash
curl http://localhost:3000/agent/queue/health
```

### Get Statistics

```bash
curl http://localhost:3000/agent/queue/stats
```

### View Recent Jobs

```bash
# Last 10 jobs
curl http://localhost:3000/agent/queue/jobs

# Last 50 jobs
curl "http://localhost:3000/agent/queue/jobs?limit=50"

# Only failed jobs
curl "http://localhost:3000/agent/queue/jobs?status=failed"
```

---

## Troubleshooting

### Redis Not Running

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Solution:**
```bash
# Check if Redis is running
redis-cli ping

# If not, start it
redis-server
```

### Jobs Not Processing

**Check queue stats:**
```bash
curl http://localhost:3000/agent/queue/stats
```

**Resume queue if paused:**
```bash
curl -X POST http://localhost:3000/agent/queue/resume
```

### High Failure Rate

**Check failed jobs:**
```bash
curl "http://localhost:3000/agent/queue/jobs?status=failed&limit=10"
```

**Retry a failed job:**
```bash
curl -X POST http://localhost:3000/agent/queue/job/1/retry
```

---

## Configuration

### Queue Settings

Edit `src/agent/agent.module.ts`:

```typescript
{
  attempts: 3,              // Retry count
  backoff: {
    type: 'exponential',    // Backoff strategy
    delay: 2000            // Initial delay (ms)
  },
  removeOnComplete: 100,    // Keep last N completed
  removeOnFail: 100        // Keep last N failed
}
```

### Redis Settings

Edit `.env`:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
```

---

## Next Steps

1. ✅ Install Redis
2. ✅ Start server
3. ✅ Test queue endpoints
4. ✅ Run test suite
5. ✅ Monitor queue health
6. ✅ Read full documentation: `QUEUE_DOCUMENTATION.md`

---

## Summary

You now have a complete job queue system with:

✅ **Async Processing** - Non-blocking requests  
✅ **Job Tracking** - Monitor status and progress  
✅ **Retry Logic** - Automatic failure recovery  
✅ **Batch Processing** - Handle multiple requests  
✅ **Queue Management** - Pause, resume, clean  
✅ **Statistics** - Real-time metrics  
✅ **Scalability** - Redis-based distribution  

**Start using it:**
```bash
curl -X POST http://localhost:3000/agent/queue/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Teach me about Shark Tank!"}'
```
