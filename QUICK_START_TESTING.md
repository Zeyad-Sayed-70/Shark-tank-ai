# Quick Start - Testing Search Endpoint

## Prerequisites
1. Server running on `http://localhost:3000`
2. AI endpoint configured in `.env`
3. Qdrant running and configured

## Start the Server

```bash
npm run start:dev
```

---

## Option 1: Browser Testing (Easiest)

Just open your browser and paste:

```
http://localhost:3000/search?q=Show me Mark Cuban deals
```

---

## Option 2: Using curl (Command Line)

### Test 1: Mark Cuban Deals
```bash
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"Show me all Mark Cuban deals\"}"
```

### Test 2: High Valuation Companies
```bash
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"Find companies with valuation over 1 million dollars\"}"
```

### Test 3: Failed Food Pitches
```bash
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"Show me emotional food pitches that failed\"}"
```

---

## Option 3: Using Node.js Test Script

```bash
node test-search.js
```

This will run 6 different test queries and show you the results.

---

## Option 4: Using PowerShell (Windows)

```powershell
$body = @{
    query = "Show me all Mark Cuban deals"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/search" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

---

## What You'll See

### Example Response:
```json
{
  "query": "Show me all Mark Cuban deals",
  "intent": {
    "type": "FACTUAL",
    "filters": {
      "investor_name": "Mark Cuban",
      "industry": "",
      "deal_made": "any",
      "valuation_gt": 0,
      "valuation_lt": 0
    },
    "search_term": "Mark Cuban deals"
  },
  "results": [
    {
      "company": "Ten Thirty One Productions",
      "entrepreneur": "Melissa Carbone",
      "season": 4,
      "episode": 3,
      "ask_amount": 200000,
      "valuation": 2000000,
      "equity_offered": 10,
      "deal_made": true,
      "investor_name": "Mark Cuban",
      "industry": "Entertainment",
      "parent_summary": "Melissa pitched her horror entertainment company...",
      "chunk_text": "Mark Cuban saw the potential...",
      "video_url": "https://youtube.com/watch?v=..."
    }
  ],
  "count": 1
}
```

---

## Understanding the Response

### Intent Object
- **type**: FACTUAL (structured data), SEMANTIC (concepts), or HYBRID (both)
- **filters**: Extracted filters from the query
  - Empty string `""` = no filter
  - `0` = no numeric filter
  - `"any"` = no boolean filter
- **search_term**: Keywords for vector search

### Results Array
Each result contains:
- **Metadata**: company, entrepreneur, season, episode
- **Financial**: ask_amount, valuation, equity_offered
- **Deal Info**: deal_made, investor_name
- **Content**: parent_summary (full pitch), chunk_text (specific moment)
- **Source**: video_url

### Count
Total number of unique pitches found

---

## For AI Agent Integration

Your AI agent should call the POST endpoint:

```javascript
const response = await fetch('http://localhost:3000/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    query: "Show me Mark Cuban deals" 
  })
});

const data = await response.json();

// Use data.intent to understand the query
// Use data.results to get the pitches
// Use data.count to know how many results
```

---

## Testing Flow

1. **First, ingest some data** (if you haven't already):
```bash
curl -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -d "{\"youtube_url\": \"YOUR_SHARK_TANK_VIDEO_URL\"}"
```

2. **Then test search**:
```bash
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"Show me all pitches\"}"
```

3. **Check the intent classification**:
   - Is the `type` correct? (FACTUAL/SEMANTIC/HYBRID)
   - Are the `filters` extracted properly?
   - Is the `search_term` relevant?

4. **Check the results**:
   - Do they match the query?
   - Is the metadata complete?
   - Are duplicates removed?

---

## Common Issues

### No Results
- **Cause**: No data ingested yet
- **Fix**: Run `/ingest` endpoint first

### Wrong Intent Classification
- **Cause**: Query too ambiguous
- **Fix**: Make query more specific

### Server Not Running
- **Cause**: Server not started
- **Fix**: Run `npm run start:dev`

### AI Endpoint Error
- **Cause**: AI_ENDPOINT not configured
- **Fix**: Check `.env` file

---

## Next Steps

1. ✅ Test with simple queries
2. ✅ Test with complex filters
3. ✅ Test different query types (FACTUAL, SEMANTIC, HYBRID)
4. ✅ Integrate with your AI agent
5. ✅ Monitor and refine based on results

For detailed documentation, see `SEARCH_TESTING_GUIDE.md`
