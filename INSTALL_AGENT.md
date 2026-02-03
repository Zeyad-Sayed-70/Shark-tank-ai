# Installation Guide - Shark Tank AI Agent

## Step-by-Step Installation

### Step 1: Install Dependencies

```bash
npm install
```

This will install the new packages:
- `@langchain/core` - Core LangChain functionality
- `@langchain/langgraph` - Graph-based agent framework  
- `langchain` - LangChain library
- `zod` - Schema validation

**Expected output:**
```
added 15 packages, and audited 500 packages in 30s
```

---

### Step 2: Verify Installation

Check that LangGraph is installed:

```bash
npm list @langchain/langgraph
```

**Expected output:**
```
shark-tank-ai@0.0.1
└── @langchain/langgraph@0.2.0
```

---

### Step 3: Environment Variables

Your `.env` file should have:

```env
# Existing (required)
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_ENDPOINT_URL=https://your-qdrant-url.com
AI_ENDPOINT=https://your-ai-endpoint.com

# New (optional, has default)
APP_URL=http://localhost:3000
```

---

### Step 4: Start the Server

```bash
npm run start:dev
```

**Expected output:**
```
[Nest] 12345  - 01/31/2026, 3:30:00 PM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 01/31/2026, 3:30:01 PM     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - 01/31/2026, 3:30:01 PM     LOG [InstanceLoader] AgentModule dependencies initialized
[Nest] 12345  - 01/31/2026, 3:30:01 PM     LOG [AgentService] Initializing Shark Tank AI Agent...
[Nest] 12345  - 01/31/2026, 3:30:02 PM     LOG [AgentService] Shark Tank AI Agent initialized successfully
[Nest] 12345  - 01/31/2026, 3:30:02 PM     LOG [NestApplication] Nest application successfully started
```

---

### Step 5: Verify Agent is Running

```bash
curl http://localhost:3000/agent/health
```

**Expected response:**
```json
{
  "success": true,
  "status": "healthy",
  "service": "Shark Tank AI Agent",
  "timestamp": "2026-01-31T15:30:00.000Z"
}
```

---

### Step 6: Test the Agent

```bash
curl -X POST http://localhost:3000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello! Can you help me learn about Shark Tank?"}'
```

**Expected response:**
```json
{
  "success": true,
  "response": "Hello! I'd be delighted to help you learn about Shark Tank...",
  "sessionId": "session_1234567890_abc123",
  "timestamp": "2026-01-31T15:30:00.000Z"
}
```

---

### Step 7: Run Full Test Suite

```bash
node test-agent.js
```

**Expected output:**
```
🚀 Starting Shark Tank AI Agent Tests

================================================================================

📋 Test 1: Health Check
--------------------------------------------------------------------------------
Status: healthy
Service: Shark Tank AI Agent

📋 Test 2: Query About Investor Deals
--------------------------------------------------------------------------------
User: What deals did Mark Cuban make?

Agent: Based on the Shark Tank database, Mark Cuban has made several notable deals...

Session ID: session_1234567890_abc123

[... more tests ...]

================================================================================
✅ All tests completed successfully!
```

---

## Troubleshooting

### Issue 1: Module Not Found

**Error:**
```
Error: Cannot find module '@langchain/langgraph'
```

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

### Issue 2: Agent Not Initializing

**Error:**
```
[AgentService] Failed to initialize agent
```

**Check:**
1. Is AI_ENDPOINT configured in .env?
2. Is the AI endpoint accessible?
3. Check the full error message in logs

**Solution:**
```bash
# Verify environment variables
cat .env

# Test AI endpoint
curl -X POST $AI_ENDPOINT \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test", "stream": false}'
```

---

### Issue 3: Tools Not Working

**Error:**
```
Failed to search Shark Tank database
```

**Check:**
1. Is data ingested? Run `/ingest` endpoint
2. Are Qdrant indexes created? Restart server
3. Is `/search` endpoint working?

**Solution:**
```bash
# Test search endpoint directly
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Mark Cuban"}'

# If no results, ingest data first
curl -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -d '{"youtube_url": "YOUR_SHARK_TANK_VIDEO_URL"}'
```

---

### Issue 4: Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (Windows)
taskkill /PID <PID> /F

# Or use a different port
# In src/main.ts, change: await app.listen(3001);
```

---

### Issue 5: TypeScript Errors

**Error:**
```
Property 'setupIndexes' does not exist on type 'VectorStoreService'
```

**Solution:**
```bash
# Restart the TypeScript server
# In VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server"

# Or restart the dev server
npm run start:dev
```

---

## Verification Checklist

After installation, verify:

- [ ] Dependencies installed (`npm list @langchain/langgraph`)
- [ ] Server starts without errors
- [ ] Health check passes (`/agent/health`)
- [ ] Can send chat message (`/agent/chat`)
- [ ] Tools are working (test with queries)
- [ ] Sessions are created
- [ ] Stats endpoint works (`/agent/stats`)
- [ ] Test suite passes (`node test-agent.js`)

---

## File Structure

After installation, you should have:

```
src/
├── agent/
│   ├── tools/
│   │   ├── shark-tank-search.tool.ts
│   │   ├── internet-search.tool.ts
│   │   └── calculator.tool.ts
│   ├── shark-tank-agent.ts
│   ├── agent.service.ts
│   ├── agent.controller.ts
│   └── agent.module.ts
├── app.module.ts (updated)
└── config/configuration.ts (updated)

Documentation:
├── AGENT_DOCUMENTATION.md
├── AGENT_QUICK_START.md
├── README_AGENT.md
└── INSTALL_AGENT.md (this file)

Tests:
└── test-agent.js
```

---

## Next Steps

1. ✅ Installation complete
2. ✅ Agent running
3. ✅ Tests passing

**Now you can:**

- Read `AGENT_QUICK_START.md` for usage examples
- Read `AGENT_DOCUMENTATION.md` for complete documentation
- Start chatting with the agent!

```bash
curl -X POST http://localhost:3000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Teach me about Shark Tank deals!"}'
```

---

## Support

If you encounter issues:

1. Check this troubleshooting guide
2. Review error messages in console
3. Test endpoints individually
4. Verify environment variables
5. Check documentation files

**Common Commands:**

```bash
# Health check
curl http://localhost:3000/agent/health

# Stats
curl http://localhost:3000/agent/stats

# Test search
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'

# Run tests
node test-agent.js
```

---

## Success!

If you see this response, you're all set:

```json
{
  "success": true,
  "status": "healthy",
  "service": "Shark Tank AI Agent"
}
```

**Happy learning! 🦈💼**
