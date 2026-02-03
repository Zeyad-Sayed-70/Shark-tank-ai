## Shark Tank AI Agent - Complete Documentation

## Overview

The Shark Tank AI Agent is an autonomous, production-ready educational assistant built with LangGraph. It specializes in teaching entrepreneurship, business deals, and investment strategies using real Shark Tank data.

### Key Features

- **Autonomous Decision Making**: Uses LangGraph to intelligently decide when and which tools to use
- **Multi-Tool Integration**: Seamlessly combines Shark Tank database search, internet search, and calculator
- **Session Management**: Maintains conversation context across multiple interactions
- **Production-Ready**: Includes error handling, logging, session cleanup, and health monitoring
- **Educational Focus**: Designed to teach business concepts through real examples

---

## Architecture

```
User Query
    ↓
Agent Controller (REST API)
    ↓
Agent Service (Session Management)
    ↓
LangGraph Agent (Decision Making)
    ↓
    ├─→ Shark Tank Search Tool (Database)
    ├─→ Internet Search Tool (Current Info)
    └─→ Calculator Tool (Financial Math)
    ↓
AI Model (Response Generation)
    ↓
Formatted Response to User
```

---

## Installation

### 1. Install Dependencies

```bash
npm install
```

New dependencies added:
- `@langchain/core` - Core LangChain functionality
- `@langchain/langgraph` - Graph-based agent framework
- `langchain` - LangChain library
- `zod` - Schema validation for tools

### 2. Environment Variables

Add to your `.env` file:

```env
# Existing variables
QDRANT_API_KEY=your_qdrant_key
QDRANT_ENDPOINT_URL=your_qdrant_url
AI_ENDPOINT=your_ai_endpoint

# New variable for agent
APP_URL=http://localhost:3000
```

### 3. Start the Server

```bash
npm run start:dev
```

The agent will initialize automatically on startup.

---

## API Endpoints

### 1. Chat with Agent

**POST /agent/chat**

Send a message to the agent and get a response.

**Request:**
```json
{
  "message": "What deals did Mark Cuban make?",
  "sessionId": "optional_session_id"
}
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

**Example with curl:**
```bash
curl -X POST http://localhost:3000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What deals did Mark Cuban make?"
  }'
```

---

### 2. Stream Chat (Server-Sent Events)

**GET /agent/chat/stream**

Stream the agent's response in real-time.

**Query Parameters:**
- `message` (required): The user's message
- `sessionId` (optional): Session ID for conversation context

**Example:**
```bash
curl -N "http://localhost:3000/agent/chat/stream?message=Tell%20me%20about%20Scrub%20Daddy"
```

---

### 3. Get Session

**GET /agent/session/:sessionId**

Retrieve conversation history for a session.

**Response:**
```json
{
  "success": true,
  "session": {
    "sessionId": "session_1234567890_abc123",
    "messages": [
      {
        "role": "user",
        "content": "What deals did Mark Cuban make?",
        "timestamp": "2026-01-31T15:30:00.000Z"
      },
      {
        "role": "assistant",
        "content": "Based on the Shark Tank database...",
        "timestamp": "2026-01-31T15:30:05.000Z"
      }
    ],
    "createdAt": "2026-01-31T15:30:00.000Z",
    "lastActivity": "2026-01-31T15:30:05.000Z"
  }
}
```

---

### 4. Clear Session

**DELETE /agent/session/:sessionId**

Delete a conversation session.

**Response:**
```json
{
  "success": true,
  "message": "Session cleared successfully"
}
```

---

### 5. Get All Sessions

**GET /agent/sessions**

List all active sessions.

**Response:**
```json
{
  "success": true,
  "count": 3,
  "sessions": [
    {
      "sessionId": "session_1234567890_abc123",
      "messageCount": 6,
      "createdAt": "2026-01-31T15:30:00.000Z",
      "lastActivity": "2026-01-31T15:35:00.000Z"
    }
  ]
}
```

---

### 6. Get Stats

**GET /agent/stats**

Get agent statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalSessions": 10,
    "activeSessions": 3,
    "totalMessages": 45
  }
}
```

---

### 7. Health Check

**GET /agent/health**

Check if the agent is running.

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "service": "Shark Tank AI Agent",
  "timestamp": "2026-01-31T15:30:00.000Z"
}
```

---

## Tools

### 1. Shark Tank Search Tool

**Purpose**: Search the Shark Tank database for pitches, deals, and companies.

**When Used**:
- User asks about specific investors, companies, or deals
- Queries like "Show me...", "Find...", "Tell me about..."
- Analysis of pitch strategies or outcomes

**Example Queries**:
- "What deals did Mark Cuban make?"
- "Show me failed food pitches"
- "Tell me about Scrub Daddy"
- "Which companies got deals over $1M valuation?"

**Tool Schema**:
```typescript
{
  query: string // Natural language search query
}
```

---

### 2. Internet Search Tool

**Purpose**: Search the internet for current information about companies.

**When Used**:
- User asks about current status of companies
- Queries with "now", "current", "today", "recent", "latest"
- Questions about what happened after the show

**Example Queries**:
- "What is Scrub Daddy doing now?"
- "Is Ring still in business?"
- "What happened to Bombas after Shark Tank?"
- "Current revenue of companies that got deals"

**Tool Schema**:
```typescript
{
  query: string,      // Search query
  max_results: number // Max results (default: 5)
}
```

---

### 3. Calculator Tool

**Purpose**: Perform accurate financial calculations.

**When Used**:
- User asks for calculations
- Queries with numbers and math operations
- Valuation, equity, ROI calculations

**Example Queries**:
- "If I ask for $100k for 10%, what's my valuation?"
- "Calculate 200000 / 0.20"
- "What percentage is $50k of $500k?"
- "ROI if I invest $200k and get $500k back"

**Tool Schema**:
```typescript
{
  expression: string // Mathematical expression
}
```

**Supported Operations**:
- Basic: +, -, *, /, %, ^
- Functions: sqrt(), log(), sin(), cos(), tan()
- Parentheses for order of operations

---

## Agent Behavior

### System Prompt

The agent is configured with a comprehensive system prompt that defines its role as a Shark Tank educator. Key aspects:

1. **Educational Focus**: Teaches business concepts through real examples
2. **Tool Usage**: Knows when to use each tool
3. **Accuracy**: Uses calculator for all math, database for facts
4. **Context**: Provides season/episode citations
5. **Clarity**: Explains complex concepts simply

### Decision Making

The agent uses LangGraph to make autonomous decisions:

1. **Analyze User Query**: Understand intent and requirements
2. **Decide Tool Usage**: Determine if tools are needed
3. **Select Tool**: Choose the most appropriate tool
4. **Execute Tool**: Call the tool with proper arguments
5. **Generate Response**: Synthesize tool results into educational answer
6. **Continue or End**: Decide if more tools are needed

### Conversation Flow

```
User: "What deals did Mark Cuban make?"
  ↓
Agent: Detects need for Shark Tank search
  ↓
Tool: shark_tank_search("What deals did Mark Cuban make?")
  ↓
Tool Returns: [List of Mark Cuban deals]
  ↓
Agent: Synthesizes educational response with examples
  ↓
Response: "Mark Cuban has made several notable deals..."
```

---

## Session Management

### Features

- **Automatic Session Creation**: New session created if none provided
- **Conversation Context**: Maintains full conversation history
- **Session Timeout**: Auto-cleanup after 30 minutes of inactivity
- **Session Cleanup**: Background process removes expired sessions

### Session Lifecycle

1. **Creation**: User sends first message (with or without sessionId)
2. **Active**: Session updated with each message exchange
3. **Timeout**: 30 minutes of inactivity
4. **Cleanup**: Automatic removal by background process

---

## Example Conversations

### Example 1: Learning About Deals

**User**: "What deals did Mark Cuban make?"

**Agent Process**:
1. Detects need for Shark Tank search
2. Calls `shark_tank_search` tool
3. Receives list of Mark Cuban deals
4. Generates educational response

**Response**:
```
Based on the Shark Tank database, Mark Cuban has made several notable deals. Let me highlight a few interesting ones:

1. **Ten Thirty One Productions** (Season 4, Episode 3)
   - Entrepreneur: Melissa Carbone
   - Ask: $200,000 for 10% equity
   - Valuation: $2,000,000
   - Deal: Mark Cuban invested
   - Industry: Entertainment
   
   This was a horror entertainment company that caught Mark's attention because of its unique concept and strong revenue model...

[Educational insights about why Mark invested, negotiation tactics, etc.]
```

---

### Example 2: Current Company Status

**User**: "What is Scrub Daddy doing now?"

**Agent Process**:
1. First uses `shark_tank_search` to get original pitch data
2. Then uses `internet_search` to find current information
3. Combines both sources for comprehensive answer

**Response**:
```
Great question! Let me tell you about Scrub Daddy's journey:

**Original Pitch** (Season 4, Episode 7):
- Entrepreneur: Aaron Krause
- Ask: $100,000 for 10%
- Deal: Lori Greiner invested $200,000 for 20%

**Current Status** (from recent internet search):
Scrub Daddy has become one of the most successful Shark Tank products ever, with over $200 million in sales. The company has expanded its product line...

[Educational insights about what made it successful]
```

---

### Example 3: Financial Calculations

**User**: "If I ask for $100k for 10%, what's my valuation?"

**Agent Process**:
1. Detects need for calculation
2. Calls `calculator` tool with expression "100000 / 0.10"
3. Gets result: $1,000,000
4. Explains the concept

**Response**:
```
Let me calculate that for you:

$100,000 ÷ 10% = $1,000,000

So your company valuation would be $1 million.

Here's how this works: When you offer equity, you're saying "this percentage of my company is worth this much money." So if 10% = $100k, then 100% (the whole company) = $1 million.

This is exactly how the Sharks evaluate deals! For example, when Aaron Krause pitched Scrub Daddy asking for $100k for 10%, he was valuing his company at $1 million...

[More educational context]
```

---

## Production Considerations

### Error Handling

- All endpoints have try-catch blocks
- Graceful degradation if tools fail
- User-friendly error messages
- Detailed logging for debugging

### Performance

- Session cleanup prevents memory leaks
- Tool calls are async and non-blocking
- Efficient message history management
- Configurable timeouts

### Scalability

- Stateless design (sessions in memory, can move to Redis)
- Horizontal scaling ready
- Tool calls can be cached
- Rate limiting can be added

### Monitoring

- Health check endpoint
- Stats endpoint for metrics
- Detailed logging with timestamps
- Session activity tracking

---

## Testing

### Test Script

Create `test-agent.js`:

```javascript
const API_URL = 'http://localhost:3000';

async function testAgent() {
  // Test 1: Simple query
  console.log('Test 1: Simple query');
  const response1 = await fetch(`${API_URL}/agent/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'What deals did Mark Cuban make?'
    })
  });
  const data1 = await response1.json();
  console.log('Response:', data1.response);
  console.log('Session ID:', data1.sessionId);
  
  // Test 2: Follow-up in same session
  console.log('\nTest 2: Follow-up question');
  const response2 = await fetch(`${API_URL}/agent/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Tell me more about the first one',
      sessionId: data1.sessionId
    })
  });
  const data2 = await response2.json();
  console.log('Response:', data2.response);
  
  // Test 3: Calculation
  console.log('\nTest 3: Calculation');
  const response3 = await fetch(`${API_URL}/agent/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'If I ask for $200k for 20%, what is my valuation?'
    })
  });
  const data3 = await response3.json();
  console.log('Response:', data3.response);
}

testAgent();
```

Run with:
```bash
node test-agent.js
```

---

## Deployment

### Environment Setup

1. Set all environment variables
2. Ensure AI endpoint is accessible
3. Verify Qdrant connection
4. Test all tools individually

### Production Checklist

- [ ] Environment variables configured
- [ ] AI endpoint tested
- [ ] Qdrant indexes created
- [ ] Data ingested
- [ ] Health check passing
- [ ] Error handling tested
- [ ] Session cleanup verified
- [ ] Logging configured
- [ ] Rate limiting added (if needed)
- [ ] Monitoring setup

---

## Troubleshooting

### Agent Not Responding

**Check**:
1. Is the server running? `GET /agent/health`
2. Are environment variables set?
3. Is the AI endpoint accessible?
4. Check logs for errors

### Tools Not Working

**Shark Tank Search**:
- Verify `/search` endpoint works
- Check if data is ingested
- Verify Qdrant indexes exist

**Internet Search**:
- Check internet connectivity
- DuckDuckGo API may have rate limits

**Calculator**:
- Verify expression syntax
- Check for invalid characters

### Session Issues

**Session Not Found**:
- Session may have expired (30 min timeout)
- Use the returned sessionId from first message

**Memory Issues**:
- Check session count: `GET /agent/stats`
- Sessions auto-cleanup after 30 minutes
- Consider moving to Redis for production

---

## Future Enhancements

### Suggested Improvements

1. **Additional Tools**:
   - Company comparison tool
   - Investment ROI analyzer
   - Industry trend analyzer
   - Pitch success predictor

2. **Enhanced Features**:
   - Multi-language support
   - Voice input/output
   - Visual charts and graphs
   - Export conversation to PDF

3. **Scalability**:
   - Redis for session storage
   - Message queue for tool calls
   - Caching layer for common queries
   - Load balancing

4. **Analytics**:
   - User interaction tracking
   - Popular queries analysis
   - Tool usage statistics
   - Success rate monitoring

---

## Support

For issues or questions:
1. Check logs: Look for errors in console
2. Test endpoints: Use health check and stats
3. Verify tools: Test each tool individually
4. Review documentation: Ensure correct usage

---

## Summary

The Shark Tank AI Agent is a complete, production-ready solution for educating users about entrepreneurship through real Shark Tank data. It combines:

- **Autonomous decision-making** with LangGraph
- **Multiple specialized tools** for comprehensive answers
- **Session management** for contextual conversations
- **Production-ready features** like error handling and monitoring
- **Educational focus** to teach business concepts

Ready to deploy and scale!
