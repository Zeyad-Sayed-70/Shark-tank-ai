# Shark Tank AI Agent - Quick Start Guide

## Installation

### 1. Install Dependencies

```bash
npm install
```

This will install the new LangGraph dependencies:
- `@langchain/core`
- `@langchain/langgraph`
- `langchain`
- `zod`

### 2. Environment Setup

Make sure your `.env` file has:

```env
QDRANT_API_KEY=your_key
QDRANT_ENDPOINT_URL=your_url
AI_ENDPOINT=your_ai_endpoint
APP_URL=http://localhost:3000
```

### 3. Start the Server

```bash
npm run start:dev
```

You should see:
```
[AgentService] Initializing Shark Tank AI Agent...
[AgentService] Shark Tank AI Agent initialized successfully
```

---

## Quick Test

### Option 1: Browser (Simplest)

Open your browser's console and paste:

```javascript
fetch('http://localhost:3000/agent/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'What deals did Mark Cuban make?'
  })
})
.then(r => r.json())
.then(d => console.log(d.response));
```

### Option 2: curl

```bash
curl -X POST http://localhost:3000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What deals did Mark Cuban make?"}'
```

### Option 3: Test Script

```bash
node test-agent.js
```

---

## Example Conversations

### 1. Ask About Deals

**Request:**
```bash
curl -X POST http://localhost:3000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What deals did Mark Cuban make?"}'
```

**Response:**
```json
{
  "success": true,
  "response": "Based on the Shark Tank database, Mark Cuban has made several notable deals...",
  "sessionId": "session_1234567890_abc123",
  "timestamp": "2026-01-31T15:30:00.000Z"
}
```

---

### 2. Calculate Valuation

**Request:**
```bash
curl -X POST http://localhost:3000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "If I ask for $100k for 10%, what is my valuation?"}'
```

**Response:**
The agent will:
1. Use the calculator tool
2. Calculate: 100000 / 0.10 = 1000000
3. Explain the concept with examples

---

### 3. Current Company Status

**Request:**
```bash
curl -X POST http://localhost:3000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is Scrub Daddy doing now?"}'
```

**Response:**
The agent will:
1. Search Shark Tank database for original pitch
2. Search internet for current information
3. Combine both sources for comprehensive answer

---

### 4. Continue Conversation

**Request:**
```bash
# First message
curl -X POST http://localhost:3000/agent/chat \
  -H "Content-Type": "application/json" \
  -d '{"message": "Show me food companies"}'

# Save the sessionId from response, then:
curl -X POST http://localhost:3000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tell me more about the first one",
    "sessionId": "session_1234567890_abc123"
  }'
```

---

## API Endpoints

### Chat
```
POST /agent/chat
Body: { "message": "your question", "sessionId": "optional" }
```

### Stream Chat
```
GET /agent/chat/stream?message=your%20question&sessionId=optional
```

### Get Session
```
GET /agent/session/:sessionId
```

### Clear Session
```
DELETE /agent/session/:sessionId
```

### Get All Sessions
```
GET /agent/sessions
```

### Get Stats
```
GET /agent/stats
```

### Health Check
```
GET /agent/health
```

---

## How It Works

### 1. User Sends Message

```
User: "What deals did Mark Cuban make?"
```

### 2. Agent Analyzes Query

The agent determines:
- This needs Shark Tank database search
- No calculation needed
- No internet search needed

### 3. Agent Uses Tool

```
Tool: shark_tank_search("What deals did Mark Cuban make?")
```

### 4. Tool Returns Data

```json
{
  "success": true,
  "count": 3,
  "results": [
    {
      "company": "Ten Thirty One Productions",
      "entrepreneur": "Melissa Carbone",
      ...
    }
  ]
}
```

### 5. Agent Generates Response

The agent synthesizes the data into an educational response:

```
"Based on the Shark Tank database, Mark Cuban has made several notable deals.
Let me highlight a few interesting ones:

1. Ten Thirty One Productions (Season 4, Episode 3)
   - Entrepreneur: Melissa Carbone
   - Ask: $200,000 for 10% equity
   - Valuation: $2,000,000
   - Deal: Mark Cuban invested
   
   This was a horror entertainment company that caught Mark's attention
   because of its unique concept and strong revenue model..."
```

---

## Tools Available

### 1. Shark Tank Search
- **Purpose**: Search database for pitches and deals
- **Triggers**: "show me", "find", "tell me about", "what deals"
- **Example**: "Show me all tech companies"

### 2. Internet Search
- **Purpose**: Find current information
- **Triggers**: "now", "current", "today", "what happened to"
- **Example**: "What is Scrub Daddy doing now?"

### 3. Calculator
- **Purpose**: Financial calculations
- **Triggers**: "calculate", "what is", numbers in query
- **Example**: "Calculate 200000 / 0.20"

---

## Session Management

### Automatic Sessions

If you don't provide a sessionId, one is created automatically:

```bash
# First message - no sessionId
curl -X POST http://localhost:3000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# Response includes sessionId
{
  "sessionId": "session_1234567890_abc123",
  ...
}

# Use it for follow-up
curl -X POST http://localhost:3000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tell me more",
    "sessionId": "session_1234567890_abc123"
  }'
```

### Session Timeout

Sessions expire after 30 minutes of inactivity and are automatically cleaned up.

---

## Troubleshooting

### Agent Not Responding

**Check health:**
```bash
curl http://localhost:3000/agent/health
```

**Expected:**
```json
{
  "success": true,
  "status": "healthy",
  "service": "Shark Tank AI Agent"
}
```

### Tools Not Working

**Test Shark Tank search directly:**
```bash
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Mark Cuban"}'
```

**Check if data is ingested:**
- Make sure you've run `/ingest` with YouTube URLs
- Verify Qdrant indexes exist (restart server to create them)

### Session Not Found

Sessions expire after 30 minutes. Start a new conversation without sessionId.

---

## Example Use Cases

### 1. Learning About Investors

```
User: "What is Mark Cuban's investment strategy?"
Agent: Searches database → Analyzes patterns → Teaches strategy
```

### 2. Understanding Valuations

```
User: "Why do Sharks care about valuation?"
Agent: Explains concept → Uses calculator → Shows real examples
```

### 3. Tracking Company Success

```
User: "Which companies became most successful?"
Agent: Searches database → Searches internet → Compares outcomes
```

### 4. Analyzing Failed Pitches

```
User: "What went wrong in failed food pitches?"
Agent: Searches database → Identifies patterns → Teaches lessons
```

---

## Production Deployment

### Before Deploying

1. ✅ Test all endpoints
2. ✅ Verify tool functionality
3. ✅ Check error handling
4. ✅ Monitor session cleanup
5. ✅ Set up logging
6. ✅ Configure rate limiting (if needed)

### Environment Variables

```env
# Production
APP_URL=https://your-domain.com
AI_ENDPOINT=https://your-ai-endpoint.com
QDRANT_API_KEY=your_production_key
QDRANT_ENDPOINT_URL=https://your-qdrant.com
```

---

## Next Steps

1. **Test the agent**: Run `node test-agent.js`
2. **Try different queries**: Test all three tools
3. **Check sessions**: Use `/agent/sessions` endpoint
4. **Monitor stats**: Use `/agent/stats` endpoint
5. **Read full docs**: See `AGENT_DOCUMENTATION.md`

---

## Support

- **Health Check**: `GET /agent/health`
- **Stats**: `GET /agent/stats`
- **Logs**: Check console output
- **Documentation**: `AGENT_DOCUMENTATION.md`

---

## Summary

You now have a fully functional, production-ready AI agent that:

✅ Autonomously decides which tools to use  
✅ Searches Shark Tank database  
✅ Searches the internet for current info  
✅ Performs accurate calculations  
✅ Maintains conversation context  
✅ Educates users about business  

**Start chatting:**
```bash
curl -X POST http://localhost:3000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Teach me about Shark Tank deals!"}'
```
