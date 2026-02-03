# 🦈 Shark Tank AI Agent

An intelligent conversational AI agent powered by LangChain and NestJS that provides expert insights about Shark Tank deals, companies, investors, and business strategies using a comprehensive vector database.

## 🌟 Features

- **Intelligent Search**: Vector-based semantic search across Shark Tank episodes, deals, and companies
- **Conversational AI**: Natural language understanding with context-aware responses
- **Production-Ready Queue System**: Scalable job processing with Redis and Bull
- **Session Management**: Maintains conversation context across multiple interactions
- **Multiple Tools**: Shark Tank database search, internet search, and calculator
- **Real-time Streaming**: Server-Sent Events (SSE) support for streaming responses
- **Comprehensive API**: RESTful endpoints for chat, sessions, and queue management

## 🏗️ Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /agent/chat
       ▼
┌─────────────────────┐
│ Agent Controller    │ ← Returns jobId immediately
└──────┬──────────────┘
       │ addChatJob()
       ▼
┌─────────────────────┐
│ Agent Queue Service │
└──────┬──────────────┘
       │ add to queue
       ▼
┌─────────────────────┐
│   Redis Queue       │ ← Job stored here
│   (Bull)            │
└──────┬──────────────┘
       │ process job
       ▼
┌─────────────────────┐
│ Agent Queue         │ ← Worker processes job
│ Processor           │
└──────┬──────────────┘
       │ chat()
       ▼
┌─────────────────────┐
│ Shark Tank Agent    │ ← LangGraph agent
│ (LangChain)         │
└──────┬──────────────┘
       │ uses tools
       ▼
┌─────────────────────────────────────┐
│  Tools:                             │
│  • Shark Tank Search (Qdrant)      │
│  • Internet Search (Tavily)        │
│  • Calculator                       │
└─────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Redis server
- Qdrant vector database
- AI service endpoint (Gemini compatible)

### Installation

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials
```

### Environment Variables

Create a `.env` file with the following:

```env
# Application
APP_URL=http://localhost:3000

# Qdrant Vector Database
QDRANT_API_KEY=your-qdrant-api-key
QDRANT_ENDPOINT_URL=https://your-qdrant-instance.cloud.qdrant.io

# AI Service
AI_ENDPOINT=http://localhost:8000/v1/chat/gemini

# Redis (for job queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

### Start Redis

```bash
# Using Docker
docker run -d -p 6379:6379 --name redis redis:alpine

# Or using Docker Compose
docker-compose up -d redis
```

### Verify Redis Connection

```bash
node check-redis.js
```

### Start the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod

# With Redis check
node start-with-redis-check.js
```

### Test the Agent

```bash
# Run comprehensive tests
node test-agent-production.js

# Or test manually
curl -X POST http://localhost:3000/agent/chat/sync \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me about Scrub Daddy"}'
```

## 📚 API Documentation

### Chat Endpoints

#### Synchronous Chat (Recommended)

```bash
POST /agent/chat/sync
```

Queues the job and waits for completion (up to 60 seconds).

**Request:**
```json
{
  "message": "What companies got deals from Mark Cuban?",
  "sessionId": "optional-session-id",
  "userId": "user-123",
  "metadata": {
    "source": "web-app"
  }
}
```

**Response:**
```json
{
  "success": true,
  "response": "Mark Cuban has invested in many successful companies...",
  "sessionId": "session_1234567890_abc123",
  "processingTime": 2500,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Asynchronous Chat

```bash
POST /agent/chat
```

Returns immediately with a job ID for polling.

**Request:**
```json
{
  "message": "What is Shark Tank?",
  "sessionId": "optional-session-id"
}
```

**Response:**
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

#### Streaming Chat

```bash
GET /agent/chat/stream?message=Hello&sessionId=session-123
```

Returns Server-Sent Events (SSE) stream.

### Queue Management

#### Get Job Status

```bash
GET /agent/queue/job/:jobId
```

**Response:**
```json
{
  "success": true,
  "job": {
    "id": "1",
    "status": "completed",
    "progress": 100,
    "data": {
      "message": "What is Shark Tank?"
    },
    "result": {
      "response": "Shark Tank is a reality TV show...",
      "sessionId": "session_123"
    },
    "createdAt": "2024-01-15T10:29:57.000Z",
    "finishedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Get Job Result

```bash
GET /agent/queue/job/:jobId/result
```

**Response:**
```json
{
  "success": true,
  "result": {
    "response": "Shark Tank is a reality TV show...",
    "sessionId": "session_123",
    "processingTime": 2500
  }
}
```

#### Queue Statistics

```bash
GET /agent/queue/stats
```

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
    "total": 160
  }
}
```

### Session Management

#### Get Session

```bash
GET /agent/session/:sessionId
```

#### Clear Session

```bash
DELETE /agent/session/:sessionId
```

#### List All Sessions

```bash
GET /agent/sessions
```

### Health & Monitoring

#### Health Check

```bash
GET /agent/health
GET /agent/queue/health
```

#### Agent Statistics

```bash
GET /agent/stats
```

## 🛠️ Tools

The agent has access to three specialized tools:

### 1. Shark Tank Search Tool

Searches the Shark Tank vector database for information about:
- Companies and their pitches
- Deal details and valuations
- Investor behavior and preferences
- Episode information
- Success stories and outcomes

**Usage:** Automatically triggered for Shark Tank-related questions.

### 2. Internet Search Tool

Performs web searches for current information:
- Recent company updates
- Current business status
- Latest news and developments

**Usage:** Triggered for queries about "current", "recent", "latest", or "now".

### 3. Calculator Tool

Performs mathematical calculations:
- Business valuations
- Deal calculations
- Financial computations

**Usage:** Triggered for explicit math operations.

## 💡 Example Queries

```bash
# Company information
"Tell me about Scrub Daddy"
"What happened to Ring after Shark Tank?"

# Deal analysis
"What was the biggest deal in Shark Tank history?"
"Show me all deals from Mark Cuban"

# Investor insights
"Which shark invests the most in tech companies?"
"What types of businesses does Lori Greiner prefer?"

# Business analysis
"Calculate the valuation if they asked for $100k for 10%"
"What are the most successful Shark Tank companies?"

# Current updates
"Is Bombas still in business?"
"What's the latest news about Shark Tank companies?"
```

## 🔧 Configuration

### Queue Settings

Configure in `src/agent/agent.module.ts`:

```typescript
{
  attempts: 3,              // Retry failed jobs 3 times
  backoff: {
    type: 'exponential',    // 2s, 4s, 8s delays
    delay: 2000
  },
  timeout: 60000,           // 60 second timeout
  removeOnComplete: 100,    // Keep last 100 completed jobs
  removeOnFail: 100         // Keep last 100 failed jobs
}
```

### Session Timeout

Configure in `src/agent/agent.service.ts`:

```typescript
private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
```

### Agent System Prompt

Customize in `src/agent/shark-tank-agent.ts`:

```typescript
this.systemPrompt = `You are a Shark Tank expert...`;
```

## 📊 Monitoring

### Real-time Queue Monitoring

```bash
# Watch queue stats every 5 seconds
watch -n 5 'curl -s http://localhost:3000/agent/queue/stats | jq'
```

### Redis Monitoring

```bash
# Check Redis info
redis-cli info stats

# Monitor Redis commands
redis-cli monitor
```

### Application Logs

```bash
# View logs in development
npm run start:dev

# View logs in production
pm2 logs shark-tank-ai
```

## 🚢 Production Deployment

### Using PM2

```bash
# Build the application
npm run build

# Start with PM2
pm2 start dist/main.js --name shark-tank-ai

# Monitor
pm2 monit

# View logs
pm2 logs shark-tank-ai
```

### Using Docker

```bash
# Build image
docker build -t shark-tank-ai .

# Run container
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  --name shark-tank-ai \
  shark-tank-ai
```

### Environment Checklist

- [ ] Redis is running and accessible
- [ ] Qdrant database is configured with data
- [ ] AI service endpoint is available
- [ ] All environment variables are set
- [ ] Health checks pass
- [ ] Test script runs successfully

## 🧪 Testing

### Unit Tests

```bash
npm run test
```

### E2E Tests

```bash
npm run test:e2e
```

### Production Tests

```bash
node test-agent-production.js
```

### Manual Testing

```bash
# Test health
curl http://localhost:3000/agent/health

# Test simple query
curl -X POST http://localhost:3000/agent/chat/sync \
  -H "Content-Type: application/json" \
  -d '{"message": "What is Shark Tank?"}'

# Test with session
curl -X POST http://localhost:3000/agent/chat/sync \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tell me more about that",
    "sessionId": "session_123"
  }'
```

## 🔒 Security

- Environment variables for sensitive data
- Redis password protection
- Job timeout to prevent infinite processing
- Retry limits to prevent infinite loops
- Input validation and sanitization
- Error messages don't expose sensitive data

## 📈 Performance

- **Concurrent Requests**: Handles thousands via queue
- **Response Time**: 2-5 seconds average
- **Throughput**: Limited by AI service and Redis
- **Scalability**: Horizontal scaling via multiple workers

## 🐛 Troubleshooting

### Redis Connection Error

```
Error: Reached the max retries per request limit
```

**Solution:**
1. Check if Redis is running: `redis-cli ping`
2. Verify Redis host/port in `.env`
3. Check Redis password if configured
4. Run `node check-redis.js`

### Job Stuck in Queue

```
Status: active for > 60 seconds
```

**Solution:**
1. Check queue stats: `GET /agent/queue/stats`
2. Check job details: `GET /agent/queue/job/:jobId`
3. Restart the application
4. Clear stalled jobs if needed

### AI Service Error

```
Error: AI service is not configured
```

**Solution:**
1. Verify `AI_ENDPOINT` in `.env`
2. Test AI service directly
3. Check AI service logs
4. Verify API compatibility

### Qdrant Connection Error

```
Error: Failed to connect to Qdrant
```

**Solution:**
1. Verify `QDRANT_ENDPOINT_URL` and `QDRANT_API_KEY`
2. Test Qdrant connection directly
3. Check Qdrant service status
4. Verify network connectivity

## 📖 Additional Documentation

- [Production Setup Guide](./PRODUCTION_SETUP.md)
- [Queue Integration Guide](./AGENT_QUEUE_INTEGRATION.md)
- [Quick Start Guide](./QUICK_START_PRODUCTION.md)
- [API Comparison](./AGENT_QUEUE_COMPARISON.md)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the UNLICENSED license.

## 🙏 Acknowledgments

Built with:
- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [LangChain](https://js.langchain.com/) - LLM application framework
- [LangGraph](https://langchain-ai.github.io/langgraphjs/) - Agent orchestration
- [Bull](https://github.com/OptimalBits/bull) - Redis-based queue
- [Qdrant](https://qdrant.tech/) - Vector database
- [Redis](https://redis.io/) - In-memory data store

## 📞 Support

For issues, questions, or contributions:
- Check the documentation files
- Run test scripts to verify setup
- Review server logs for errors
- Open an issue on GitHub

---

Made with ❤️ for Shark Tank fans and entrepreneurs
