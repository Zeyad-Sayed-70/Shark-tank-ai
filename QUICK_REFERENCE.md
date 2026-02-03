# Quick Reference Card

## 🚀 Start the System

```bash
# 1. Start Redis
docker run -d -p 6379:6379 --name redis redis:alpine

# 2. Check Redis
node check-redis.js

# 3. Start App
node start-with-redis-check.js

# 4. Test
node test-agent-production.js
```

## 📡 API Endpoints

### Submit Job
```bash
POST /agent/chat
{
  "message": "Your question here",
  "userId": "user-123"
}
```

### Check Status
```bash
GET /agent/queue/job/:jobId
```

### Get Result
```bash
GET /agent/queue/job/:jobId/result
```

### Queue Stats
```bash
GET /agent/queue/stats
```

### Health Check
```bash
GET /agent/health
GET /agent/queue/health
```

## 📊 Job Status

| Status | Meaning |
|--------|---------|
| `waiting` | Queued |
| `active` | Processing |
| `completed` | Done ✅ |
| `failed` | Error ❌ |

## 🔧 Troubleshooting

### Redis not running?
```bash
redis-cli ping
docker run -d -p 6379:6379 redis:alpine
```

### Jobs stuck?
```bash
curl http://localhost:3000/agent/queue/stats
```

### Need help?
```bash
node check-redis.js
node test-agent-production.js
```

## 📝 Example Usage

```javascript
// Submit job
const res = await fetch('http://localhost:3000/agent/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'What is Shark Tank?',
    userId: 'user-123'
  })
});

const { jobId } = await res.json();

// Poll for result
while (true) {
  const status = await fetch(`http://localhost:3000/agent/queue/job/${jobId}`);
  const { job } = await status.json();
  
  if (job.status === 'completed') {
    console.log(job.result.response);
    break;
  }
  
  await new Promise(r => setTimeout(r, 2000));
}
```

## 📚 Documentation

- **Quick Start**: [QUICK_START_PRODUCTION.md](./QUICK_START_PRODUCTION.md)
- **Full Setup**: [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md)
- **API Docs**: [AGENT_QUEUE_INTEGRATION.md](./AGENT_QUEUE_INTEGRATION.md)
- **Summary**: [PRODUCTION_READY_SUMMARY.md](./PRODUCTION_READY_SUMMARY.md)

## ⚙️ Configuration

`.env` file:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
PORT=3000
```

## 🎯 Features

✅ Queue-based processing  
✅ Automatic retries (3x)  
✅ Progress tracking  
✅ Job management  
✅ Session support  
✅ Production-ready  
