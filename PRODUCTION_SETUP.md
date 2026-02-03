# Production Setup Guide

This guide will help you set up the AI Agent with queue system for production use.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Redis** (v6 or higher)
3. **npm** or **yarn**

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- `@nestjs/bull` - Queue management
- `bull` - Job queue library
- `@types/bull` - TypeScript definitions

## Step 2: Start Redis

### Option 1: Docker (Recommended)

```bash
# Start Redis container
docker run -d -p 6379:6379 --name redis redis:alpine

# Verify it's running
docker ps | grep redis
```

### Option 2: Local Installation

**Windows:**
```bash
# Install with Chocolatey
choco install redis-64

# Start Redis
redis-server
```

**macOS:**
```bash
# Install with Homebrew
brew install redis

# Start Redis
brew services start redis
```

**Linux (Ubuntu/Debian):**
```bash
# Install Redis
sudo apt-get update
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### Option 3: Windows WSL

```bash
# In WSL terminal
sudo service redis-server start
```

## Step 3: Verify Redis Connection

```bash
# Check if Redis is running
node check-redis.js
```

Expected output:
```
✅ Redis is running!
   Host: localhost
   Port: 6379
```

## Step 4: Configure Environment

Create or update `.env` file:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# API Configuration (optional)
PORT=3000
NODE_ENV=production

# OpenAI Configuration (if using)
OPENAI_API_KEY=your-api-key-here
```

## Step 5: Build the Application

```bash
npm run build
```

## Step 6: Start the Application

### Development Mode

```bash
# With Redis check
node start-with-redis-check.js

# Or directly
npm run start:dev
```

### Production Mode

```bash
npm run start:prod
```

## Step 7: Verify the System

### Check Health

```bash
curl http://localhost:3000/agent/health
curl http://localhost:3000/agent/queue/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "service": "Shark Tank AI Agent"
}
```

### Check Queue Stats

```bash
curl http://localhost:3000/agent/queue/stats
```

Expected response:
```json
{
  "success": true,
  "stats": {
    "waiting": 0,
    "active": 0,
    "completed": 0,
    "failed": 0,
    "total": 0
  }
}
```

## Step 8: Test the Agent

Run the production test suite:

```bash
node test-agent-production.js
```

This will test:
- ✅ Health checks
- ✅ Queue statistics
- ✅ Simple chat request
- ✅ Conversation with context
- ✅ Job status tracking

## API Usage

### 1. Submit a Chat Job

```bash
curl -X POST http://localhost:3000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is Shark Tank?",
    "userId": "user-123"
  }'
```

Response:
```json
{
  "success": true,
  "jobId": "1",
  "message": "Chat request queued successfully",
  "statusUrl": "/agent/queue/job/1",
  "resultUrl": "/agent/queue/job/1/result",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Check Job Status

```bash
curl http://localhost:3000/agent/queue/job/1
```

Response:
```json
{
  "success": true,
  "job": {
    "id": "1",
    "status": "completed",
    "progress": 100,
    "result": {
      "response": "Shark Tank is a reality TV show...",
      "sessionId": "session_123",
      "processingTime": 2500
    }
  }
}
```

### 3. Get Job Result

```bash
curl http://localhost:3000/agent/queue/job/1/result
```

Response:
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

## Production Configuration

### Redis Configuration

For production, configure Redis with:

1. **Password Protection**:
   ```env
   REDIS_PASSWORD=your-secure-password
   ```

2. **Persistence** (in redis.conf):
   ```
   save 900 1
   save 300 10
   save 60 10000
   appendonly yes
   ```

3. **Memory Limits**:
   ```
   maxmemory 2gb
   maxmemory-policy allkeys-lru
   ```

### Application Configuration

Update `src/agent/agent.module.ts` for production:

```typescript
{
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    retryStrategy: (times) => {
      if (times > 3) return null;
      return Math.min(times * 1000, 3000);
    },
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    timeout: 60000,
    removeOnComplete: 100,
    removeOnFail: 100,
  },
}
```

## Monitoring

### Queue Monitoring

Monitor queue health with:

```bash
# Check stats every 10 seconds
watch -n 10 'curl -s http://localhost:3000/agent/queue/stats | jq'
```

### Redis Monitoring

Monitor Redis with:

```bash
# Redis CLI
redis-cli info stats

# Monitor commands
redis-cli monitor
```

### Application Logs

Monitor application logs:

```bash
# Development
npm run start:dev

# Production (with PM2)
pm2 logs shark-tank-ai
```

## Scaling

### Horizontal Scaling

To scale horizontally:

1. **Deploy multiple instances** of the application
2. **Point all instances** to the same Redis server
3. **Use a load balancer** to distribute requests

### Vertical Scaling

To scale vertically:

1. **Increase Redis memory**
2. **Add more CPU cores** for workers
3. **Adjust concurrency** in Bull configuration

## Troubleshooting

### Redis Connection Issues

**Problem**: `maxRetriesPerRequest` error

**Solution**:
```bash
# Check if Redis is running
redis-cli ping

# Restart Redis
docker restart redis
# or
sudo systemctl restart redis-server
```

### Jobs Stuck in Queue

**Problem**: Jobs not processing

**Solution**:
```bash
# Check queue stats
curl http://localhost:3000/agent/queue/stats

# Check if workers are running
# Look for "Agent Queue Processor initialized" in logs

# Restart application
npm run start:dev
```

### High Memory Usage

**Problem**: Redis using too much memory

**Solution**:
```bash
# Clean old jobs
curl -X POST http://localhost:3000/agent/queue/clean?olderThan=86400000

# Configure Redis maxmemory
redis-cli CONFIG SET maxmemory 2gb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

## Security Checklist

- [ ] Set Redis password
- [ ] Enable Redis TLS (for remote connections)
- [ ] Use environment variables for secrets
- [ ] Implement rate limiting
- [ ] Enable CORS properly
- [ ] Use HTTPS in production
- [ ] Implement authentication/authorization
- [ ] Monitor for suspicious activity

## Backup and Recovery

### Redis Backup

```bash
# Manual backup
redis-cli BGSAVE

# Automated backup (cron)
0 2 * * * redis-cli BGSAVE
```

### Application Backup

```bash
# Backup configuration
cp .env .env.backup

# Backup Redis data
cp /var/lib/redis/dump.rdb /backup/redis-$(date +%Y%m%d).rdb
```

## Performance Optimization

1. **Adjust worker concurrency**:
   ```typescript
   settings: {
     lockDuration: 30000,
     stalledInterval: 30000,
     maxStalledCount: 1,
   }
   ```

2. **Optimize job retention**:
   ```typescript
   removeOnComplete: 50,  // Keep fewer completed jobs
   removeOnFail: 50,      // Keep fewer failed jobs
   ```

3. **Use Redis Cluster** for high availability

4. **Monitor and tune** based on metrics

## Support

For issues or questions:
- Check logs: `npm run start:dev`
- Test Redis: `node check-redis.js`
- Run tests: `node test-agent-production.js`
- Check documentation in this repository

## Next Steps

1. ✅ Redis is running
2. ✅ Application is running
3. ✅ Tests pass
4. 🚀 Deploy to production
5. 📊 Set up monitoring
6. 🔒 Configure security
7. 📈 Scale as needed
