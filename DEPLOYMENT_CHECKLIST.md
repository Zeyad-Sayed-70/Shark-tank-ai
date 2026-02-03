# Deployment Checklist - Shark Tank AI Agent

## ✅ Pre-Deployment

### 1. Installation
- [ ] Run `npm install`
- [ ] Verify all dependencies installed
- [ ] No TypeScript errors
- [ ] No compilation errors

### 2. Environment Configuration
- [ ] `.env` file exists
- [ ] `QDRANT_API_KEY` set
- [ ] `QDRANT_ENDPOINT_URL` set
- [ ] `AI_ENDPOINT` set
- [ ] `APP_URL` set (optional, defaults to localhost:3000)

### 3. Database Setup
- [ ] Qdrant is accessible
- [ ] Collection created (auto-created on startup)
- [ ] Indexes created (auto-created on startup)
- [ ] Data ingested (at least one video)

### 4. Verify Existing Endpoints
- [ ] `GET /` - Hello endpoint works
- [ ] `POST /ingest` - Can ingest videos
- [ ] `POST /search` - Can search database
- [ ] `POST /setup-indexes` - Indexes can be created

---

## ✅ Agent Deployment

### 1. Start Server
```bash
npm run start:dev
```

**Expected Output:**
```
[AgentService] Initializing Shark Tank AI Agent...
[AgentService] Shark Tank AI Agent initialized successfully
```

### 2. Health Check
```bash
curl http://localhost:3000/agent/health
```

**Expected Response:**
```json
{
  "success": true,
  "status": "healthy",
  "service": "Shark Tank AI Agent",
  "timestamp": "2026-01-31T..."
}
```

- [ ] Health check returns 200 OK
- [ ] Status is "healthy"

### 3. Test Basic Chat
```bash
curl -X POST http://localhost:3000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

**Expected Response:**
```json
{
  "success": true,
  "response": "Hello! I'd be delighted to help...",
  "sessionId": "session_...",
  "timestamp": "2026-01-31T..."
}
```

- [ ] Chat endpoint returns 200 OK
- [ ] Response includes message
- [ ] SessionId is generated

### 4. Test Shark Tank Search Tool
```bash
curl -X POST http://localhost:3000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me all pitches"}'
```

- [ ] Agent uses shark_tank_search tool
- [ ] Returns pitch data
- [ ] No errors in response

### 5. Test Calculator Tool
```bash
curl -X POST http://localhost:3000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Calculate 100000 / 0.10"}'
```

- [ ] Agent uses calculator tool
- [ ] Returns correct result (1000000)
- [ ] Explains the calculation

### 6. Test Internet Search Tool
```bash
curl -X POST http://localhost:3000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is Scrub Daddy doing now?"}'
```

- [ ] Agent uses internet_search tool
- [ ] Returns current information
- [ ] No errors in response

### 7. Test Session Management
```bash
# First message
curl -X POST http://localhost:3000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}' > response.json

# Extract sessionId and use it
SESSION_ID=$(cat response.json | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)

# Follow-up message
curl -X POST http://localhost:3000/agent/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"Tell me more\", \"sessionId\": \"$SESSION_ID\"}"
```

- [ ] Session is created
- [ ] Follow-up uses same session
- [ ] Context is maintained

### 8. Test Session Endpoints
```bash
# Get session
curl http://localhost:3000/agent/session/$SESSION_ID

# Get all sessions
curl http://localhost:3000/agent/sessions

# Get stats
curl http://localhost:3000/agent/stats
```

- [ ] Can retrieve session
- [ ] Can list all sessions
- [ ] Stats show correct counts

### 9. Run Full Test Suite
```bash
node test-agent.js
```

- [ ] All 8 tests pass
- [ ] No errors in output
- [ ] Agent responds correctly

---

## ✅ Production Deployment

### 1. Environment Setup
- [ ] Production environment variables set
- [ ] APP_URL points to production domain
- [ ] AI_ENDPOINT is production endpoint
- [ ] QDRANT_ENDPOINT_URL is production URL

### 2. Security
- [ ] API keys are secure
- [ ] Environment variables not in code
- [ ] HTTPS enabled
- [ ] CORS configured (if needed)
- [ ] Rate limiting added (if needed)

### 3. Monitoring
- [ ] Logging configured
- [ ] Error tracking setup
- [ ] Health check monitored
- [ ] Stats endpoint monitored
- [ ] Session cleanup verified

### 4. Performance
- [ ] Response times acceptable
- [ ] Tool calls complete successfully
- [ ] Session cleanup working
- [ ] Memory usage stable

### 5. Scalability
- [ ] Consider Redis for sessions
- [ ] Load balancing configured (if needed)
- [ ] Database connection pooling
- [ ] Caching strategy defined

---

## ✅ Post-Deployment

### 1. Smoke Tests
- [ ] Health check passes
- [ ] Can create new chat
- [ ] All tools work
- [ ] Sessions are created
- [ ] Stats are accurate

### 2. Integration Tests
- [ ] Test with real user queries
- [ ] Verify educational responses
- [ ] Check tool selection accuracy
- [ ] Validate session management

### 3. Monitoring
- [ ] Check logs for errors
- [ ] Monitor response times
- [ ] Track session counts
- [ ] Watch memory usage

### 4. Documentation
- [ ] Team trained on endpoints
- [ ] Documentation accessible
- [ ] Troubleshooting guide available
- [ ] Support process defined

---

## 🚨 Troubleshooting

### Agent Not Starting
**Check:**
- [ ] All dependencies installed
- [ ] No TypeScript errors
- [ ] Environment variables set
- [ ] AI endpoint accessible

**Fix:**
```bash
npm install
npm run start:dev
```

### Tools Not Working
**Check:**
- [ ] Database has data
- [ ] Indexes created
- [ ] Search endpoint works
- [ ] Internet connectivity

**Fix:**
```bash
# Restart server to create indexes
npm run start:dev

# Ingest data if needed
curl -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -d '{"youtube_url": "YOUR_URL"}'
```

### Session Issues
**Check:**
- [ ] Sessions are being created
- [ ] Cleanup is running
- [ ] Memory not exhausted

**Fix:**
```bash
# Check stats
curl http://localhost:3000/agent/stats

# Clear old sessions if needed
# They auto-cleanup after 30 minutes
```

---

## 📊 Success Metrics

### Immediate (Day 1)
- [ ] Agent responds to queries
- [ ] All tools functional
- [ ] No critical errors
- [ ] Health check green

### Short-term (Week 1)
- [ ] Response quality good
- [ ] Tool selection accurate
- [ ] Session management stable
- [ ] Performance acceptable

### Long-term (Month 1)
- [ ] User satisfaction high
- [ ] Educational value delivered
- [ ] System stability proven
- [ ] Scalability validated

---

## 📝 Sign-Off

### Development
- [ ] Code reviewed
- [ ] Tests passing
- [ ] Documentation complete
- [ ] Ready for staging

**Signed:** _________________ **Date:** _________

### Staging
- [ ] Deployed to staging
- [ ] All tests pass
- [ ] Performance acceptable
- [ ] Ready for production

**Signed:** _________________ **Date:** _________

### Production
- [ ] Deployed to production
- [ ] Smoke tests pass
- [ ] Monitoring active
- [ ] Team notified

**Signed:** _________________ **Date:** _________

---

## 🎉 Deployment Complete!

Your Shark Tank AI Agent is now live and ready to educate users!

**Quick Links:**
- Health: `GET /agent/health`
- Stats: `GET /agent/stats`
- Chat: `POST /agent/chat`
- Docs: `AGENT_DOCUMENTATION.md`

**Support:**
- Check logs for errors
- Monitor health endpoint
- Review stats regularly
- Update documentation as needed

**Next Steps:**
1. Monitor initial usage
2. Gather user feedback
3. Optimize based on metrics
4. Plan enhancements

🦈💼 Happy Teaching!
