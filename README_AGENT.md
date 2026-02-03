# Shark Tank AI - Autonomous Educational Agent

A production-ready, autonomous AI agent built with LangGraph that educates users about entrepreneurship, business deals, and investment strategies using real Shark Tank data.

## 🎯 Features

### Autonomous Agent
- **LangGraph-Powered**: Intelligent decision-making and tool orchestration
- **Multi-Tool Integration**: Seamlessly combines database search, internet search, and calculations
- **Context-Aware**: Maintains conversation history across sessions
- **Educational Focus**: Designed to teach business concepts through real examples

### Three Specialized Tools

1. **Shark Tank Search** 🔍
   - Search database for pitches, deals, and companies
   - Filter by investor, industry, valuation, deal status
   - Get detailed pitch summaries and key moments

2. **Internet Search** 🌐
   - Find current information about companies
   - Track post-show success stories
   - Verify facts and get recent updates

3. **Calculator** 🧮
   - Accurate financial calculations
   - Valuation and equity math
   - ROI analysis and comparisons

### Production-Ready
- Session management with auto-cleanup
- Error handling and logging
- Health monitoring and stats
- Scalable architecture
- RESTful API

---

## 🚀 Quick Start

### 1. Install

```bash
npm install
```

### 2. Configure

Create `.env`:
```env
QDRANT_API_KEY=your_key
QDRANT_ENDPOINT_URL=your_url
AI_ENDPOINT=your_ai_endpoint
APP_URL=http://localhost:3000
```

### 3. Start

```bash
npm run start:dev
```

### 4. Test

```bash
# Quick test
curl -X POST http://localhost:3000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What deals did Mark Cuban make?"}'

# Or run full test suite
node test-agent.js
```

---

## 📚 API Endpoints

### Chat with Agent
```bash
POST /agent/chat
{
  "message": "What deals did Mark Cuban make?",
  "sessionId": "optional"
}
```

### Stream Response
```bash
GET /agent/chat/stream?message=your%20question
```

### Session Management
```bash
GET    /agent/session/:sessionId      # Get session
DELETE /agent/session/:sessionId      # Clear session
GET    /agent/sessions                # List all sessions
```

### Monitoring
```bash
GET /agent/stats    # Agent statistics
GET /agent/health   # Health check
```

---

## 💬 Example Conversations

### Learning About Deals

**User**: "What deals did Mark Cuban make?"

**Agent**: 
```
Based on the Shark Tank database, Mark Cuban has made several notable deals.
Let me highlight a few interesting ones:

1. Ten Thirty One Productions (Season 4, Episode 3)
   - Entrepreneur: Melissa Carbone
   - Ask: $200,000 for 10% equity
   - Valuation: $2,000,000
   - Deal: Mark Cuban invested
   - Industry: Entertainment
   
   This was a horror entertainment company that caught Mark's attention
   because of its unique concept and strong revenue model...

[Continues with educational insights]
```

---

### Financial Calculations

**User**: "If I ask for $100k for 10%, what's my valuation?"

**Agent**:
```
Let me calculate that for you:

$100,000 ÷ 10% = $1,000,000

So your company valuation would be $1 million.

Here's how this works: When you offer equity, you're saying "this percentage
of my company is worth this much money." So if 10% = $100k, then 100%
(the whole company) = $1 million.

This is exactly how the Sharks evaluate deals! For example...

[Continues with real examples]
```

---

### Current Company Status

**User**: "What is Scrub Daddy doing now?"

**Agent**:
```
Great question! Let me tell you about Scrub Daddy's journey:

**Original Pitch** (Season 4, Episode 7):
- Entrepreneur: Aaron Krause
- Ask: $100,000 for 10%
- Deal: Lori Greiner invested $200,000 for 20%

**Current Status** (from recent internet search):
Scrub Daddy has become one of the most successful Shark Tank products ever,
with over $200 million in sales. The company has expanded its product line...

[Continues with success analysis]
```

---

## 🛠️ How It Works

### Architecture

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
Educational Response
```

### Decision Flow

1. **Analyze Query**: Understand user intent
2. **Decide Tools**: Determine which tools are needed
3. **Execute Tools**: Call tools with proper arguments
4. **Synthesize**: Generate educational response
5. **Continue**: Decide if more tools needed

---

## 🎓 Use Cases

### For Entrepreneurs
- Learn from successful pitches
- Understand valuation strategies
- Study negotiation tactics
- Analyze what makes deals work

### For Investors
- Study investor behavior patterns
- Analyze deal structures
- Compare investment strategies
- Track ROI and outcomes

### For Students
- Learn business concepts
- Understand equity and valuation
- Study real-world examples
- Practice financial calculations

### For Fans
- Explore pitch database
- Track favorite companies
- Learn about industries
- Discover success stories

---

## 📊 Agent Capabilities

### What the Agent Can Do

✅ Search 1000s of Shark Tank pitches  
✅ Analyze deal patterns and strategies  
✅ Calculate valuations and equity  
✅ Find current company information  
✅ Explain complex business concepts  
✅ Compare different approaches  
✅ Provide specific examples  
✅ Maintain conversation context  
✅ Teach through real stories  

### What Makes It Special

🧠 **Autonomous**: Decides which tools to use  
🎯 **Accurate**: Uses calculator for all math  
📚 **Educational**: Teaches, doesn't just answer  
🔄 **Contextual**: Remembers conversation  
🌐 **Current**: Searches internet for updates  
💡 **Insightful**: Provides lessons learned  

---

## 🔧 Configuration

### Environment Variables

```env
# Required
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_ENDPOINT_URL=https://your-qdrant-url.com
AI_ENDPOINT=https://your-ai-endpoint.com

# Optional
APP_URL=http://localhost:3000  # Default
```

### Session Settings

- **Timeout**: 30 minutes of inactivity
- **Cleanup**: Every 5 minutes
- **Storage**: In-memory (can move to Redis)

---

## 📈 Monitoring

### Health Check

```bash
curl http://localhost:3000/agent/health
```

Response:
```json
{
  "success": true,
  "status": "healthy",
  "service": "Shark Tank AI Agent",
  "timestamp": "2026-01-31T15:30:00.000Z"
}
```

### Statistics

```bash
curl http://localhost:3000/agent/stats
```

Response:
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

## 🧪 Testing

### Run Test Suite

```bash
node test-agent.js
```

Tests include:
- Health check
- Simple queries
- Follow-up questions (context)
- Financial calculations
- Internet search
- Industry queries
- Session management
- Statistics

### Manual Testing

```bash
# Test 1: Investor query
curl -X POST http://localhost:3000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What deals did Mark Cuban make?"}'

# Test 2: Calculation
curl -X POST http://localhost:3000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Calculate 200000 / 0.20"}'

# Test 3: Current info
curl -X POST http://localhost:3000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is Scrub Daddy doing now?"}'
```

---

## 📖 Documentation

- **Quick Start**: `AGENT_QUICK_START.md` - Get started in 5 minutes
- **Full Documentation**: `AGENT_DOCUMENTATION.md` - Complete guide
- **API Reference**: See endpoints section above
- **Tool Documentation**: See tools section in full docs

---

## 🚢 Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] AI endpoint tested
- [ ] Qdrant connection verified
- [ ] Data ingested
- [ ] Indexes created
- [ ] Health check passing
- [ ] Error handling tested
- [ ] Session cleanup verified
- [ ] Logging configured
- [ ] Monitoring setup

### Scaling Considerations

- Move sessions to Redis for horizontal scaling
- Add caching layer for common queries
- Implement rate limiting
- Set up load balancing
- Monitor tool usage and performance

---

## 🛡️ Error Handling

The agent includes comprehensive error handling:

- **Tool Failures**: Graceful degradation
- **API Errors**: User-friendly messages
- **Session Issues**: Auto-recovery
- **Timeout Handling**: Configurable limits
- **Logging**: Detailed error tracking

---

## 🔮 Future Enhancements

### Planned Features

- [ ] Company comparison tool
- [ ] Investment ROI analyzer
- [ ] Industry trend analyzer
- [ ] Pitch success predictor
- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Visual charts and graphs
- [ ] Export to PDF

### Scalability Improvements

- [ ] Redis session storage
- [ ] Message queue for tools
- [ ] Caching layer
- [ ] Analytics dashboard
- [ ] A/B testing framework

---

## 🤝 Contributing

This is a production-ready system. To extend:

1. **Add New Tools**: Create in `src/agent/tools/`
2. **Modify Agent**: Update `src/agent/shark-tank-agent.ts`
3. **Add Endpoints**: Extend `src/agent/agent.controller.ts`
4. **Test**: Add tests to `test-agent.js`

---

## 📝 License

UNLICENSED

---

## 🎉 Summary

You now have a complete, production-ready AI agent that:

✅ **Autonomously decides** which tools to use  
✅ **Searches** Shark Tank database for real data  
✅ **Calculates** financial metrics accurately  
✅ **Searches internet** for current information  
✅ **Maintains context** across conversations  
✅ **Educates users** about business concepts  
✅ **Scales** for production use  
✅ **Monitors** health and performance  

**Start using it now:**

```bash
curl -X POST http://localhost:3000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Teach me about Shark Tank!"}'
```

---

## 📞 Support

- Check logs for errors
- Use health endpoint for status
- Review documentation for usage
- Test tools individually if issues

**Happy Learning! 🦈💼**
