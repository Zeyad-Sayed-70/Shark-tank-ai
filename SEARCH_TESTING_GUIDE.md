# Search & Retrieval Testing Guide

## How the Search System Works

### Flow Overview
```
User Query → AI Intent Classification → Vector Search + Filters → Deduplicated Results
```

### Step-by-Step Process

1. **User sends a natural language query**
   - Example: "Show me all Mark Cuban deals over $1M"

2. **AI classifies the intent** (`classifyIntent`)
   - Determines query type: FACTUAL, SEMANTIC, or HYBRID
   - Extracts filters (investor, industry, valuation, etc.)
   - Generates search term for semantic matching

3. **Vector search with filters** (`search`)
   - Builds Qdrant filter from extracted filters
   - Performs vector similarity search using search_term
   - Applies filters to narrow results

4. **Deduplication**
   - Groups results by unique pitch summary
   - Returns one result per pitch

5. **Returns structured results**
   - Intent classification details
   - Matching pitches with metadata
   - Result count

---

## API Endpoints

### 1. GET /search (Query Parameter)
**Best for: Quick browser testing**

```bash
GET http://localhost:3000/search?q=Show me Mark Cuban deals
```

**Example with curl:**
```bash
curl "http://localhost:3000/search?q=Show%20me%20Mark%20Cuban%20deals"
```

### 2. POST /search (JSON Body)
**Best for: AI agent integration, programmatic access**

```bash
POST http://localhost:3000/search
Content-Type: application/json

{
  "query": "Show me Mark Cuban deals"
}
```

**Example with curl:**
```bash
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me Mark Cuban deals"}'
```

---

## Response Format

```json
{
  "query": "Show me Mark Cuban deals",
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
      "chunk_text": "Mark Cuban saw the potential in live horror experiences...",
      "video_url": "https://youtube.com/watch?v=..."
    }
  ],
  "count": 1
}
```

---

## Test Scenarios

### Scenario 1: FACTUAL Query (Specific Investor)
**Query:** `"Show me all Mark Cuban deals"`

**Expected Intent:**
```json
{
  "type": "FACTUAL",
  "filters": {
    "investor_name": "Mark Cuban",
    "industry": "",
    "deal_made": "any",
    "valuation_gt": 0,
    "valuation_lt": 0
  },
  "search_term": "Mark Cuban deals"
}
```

**Test with curl:**
```bash
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me all Mark Cuban deals"}'
```

---

### Scenario 2: FACTUAL Query (Valuation Filter)
**Query:** `"Find companies with valuation over $1 million"`

**Expected Intent:**
```json
{
  "type": "FACTUAL",
  "filters": {
    "investor_name": "",
    "industry": "",
    "deal_made": "any",
    "valuation_gt": 1000000,
    "valuation_lt": 0
  },
  "search_term": "high valuation companies"
}
```

**Test with curl:**
```bash
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Find companies with valuation over $1 million"}'
```

---

### Scenario 3: SEMANTIC Query (Concept-based)
**Query:** `"Show me emotional food pitches that failed"`

**Expected Intent:**
```json
{
  "type": "SEMANTIC",
  "filters": {
    "investor_name": "",
    "industry": "Food & Beverage",
    "deal_made": "false",
    "valuation_gt": 0,
    "valuation_lt": 0
  },
  "search_term": "emotional food pitches failed"
}
```

**Test with curl:**
```bash
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me emotional food pitches that failed"}'
```

---

### Scenario 4: HYBRID Query (Investor + Concept)
**Query:** `"Kevin O'Leary's royalty deal arguments"`

**Expected Intent:**
```json
{
  "type": "HYBRID",
  "filters": {
    "investor_name": "Kevin O'Leary",
    "industry": "",
    "deal_made": "any",
    "valuation_gt": 0,
    "valuation_lt": 0
  },
  "search_term": "royalty deal arguments negotiations"
}
```

**Test with curl:**
```bash
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Kevin O'\''Leary'\''s royalty deal arguments"}'
```

---

### Scenario 5: Industry Filter
**Query:** `"Show me all tech companies"`

**Expected Intent:**
```json
{
  "type": "FACTUAL",
  "filters": {
    "investor_name": "",
    "industry": "Technology",
    "deal_made": "any",
    "valuation_gt": 0,
    "valuation_lt": 0
  },
  "search_term": "tech companies"
}
```

**Test with curl:**
```bash
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me all tech companies"}'
```

---

### Scenario 6: Deal Status Filter
**Query:** `"Which pitches got deals?"`

**Expected Intent:**
```json
{
  "type": "FACTUAL",
  "filters": {
    "investor_name": "",
    "industry": "",
    "deal_made": "true",
    "valuation_gt": 0,
    "valuation_lt": 0
  },
  "search_term": "successful deals"
}
```

**Test with curl:**
```bash
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Which pitches got deals?"}'
```

---

## Testing with Postman

### Setup
1. Create a new request
2. Set method to `POST`
3. URL: `http://localhost:3000/search`
4. Headers: `Content-Type: application/json`
5. Body (raw JSON):
```json
{
  "query": "Show me Mark Cuban deals"
}
```

### Collection of Test Queries
Save these as a Postman collection:

```json
{
  "info": {
    "name": "Shark Tank Search Tests"
  },
  "item": [
    {
      "name": "Mark Cuban Deals",
      "request": {
        "method": "POST",
        "url": "http://localhost:3000/search",
        "body": {
          "mode": "raw",
          "raw": "{\"query\": \"Show me all Mark Cuban deals\"}"
        }
      }
    },
    {
      "name": "High Valuation",
      "request": {
        "method": "POST",
        "url": "http://localhost:3000/search",
        "body": {
          "mode": "raw",
          "raw": "{\"query\": \"Find companies with valuation over $1 million\"}"
        }
      }
    },
    {
      "name": "Failed Food Pitches",
      "request": {
        "method": "POST",
        "url": "http://localhost:3000/search",
        "body": {
          "mode": "raw",
          "raw": "{\"query\": \"Show me emotional food pitches that failed\"}"
        }
      }
    }
  ]
}
```

---

## For AI Agent Integration

### What the AI Agent Should Do

1. **Send natural language query to POST /search**
```javascript
const response = await fetch('http://localhost:3000/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: userQuestion })
});

const data = await response.json();
```

2. **Parse the response**
```javascript
const { intent, results, count } = data;

// Check intent classification
console.log(`Query type: ${intent.type}`);
console.log(`Active filters:`, intent.filters);
console.log(`Search term: ${intent.search_term}`);

// Process results
results.forEach(pitch => {
  console.log(`${pitch.company} by ${pitch.entrepreneur}`);
  console.log(`Deal: ${pitch.deal_made ? 'Yes' : 'No'}`);
  console.log(`Investor: ${pitch.investor_name}`);
});
```

3. **Format response for user**
```javascript
if (count === 0) {
  return "No pitches found matching your query.";
}

let response = `Found ${count} pitch(es):\n\n`;
results.forEach((pitch, i) => {
  response += `${i + 1}. ${pitch.company}\n`;
  response += `   Entrepreneur: ${pitch.entrepreneur}\n`;
  response += `   Ask: $${pitch.ask_amount.toLocaleString()}\n`;
  response += `   Valuation: $${pitch.valuation.toLocaleString()}\n`;
  response += `   Deal: ${pitch.deal_made ? `Yes with ${pitch.investor_name}` : 'No'}\n`;
  response += `   Summary: ${pitch.parent_summary.substring(0, 200)}...\n\n`;
});

return response;
```

---

## Troubleshooting

### No Results Returned
**Possible causes:**
1. No data ingested yet - run `/ingest` first with a YouTube URL
2. Filters too restrictive - check `intent.filters` in response
3. Vector search not matching - check `intent.search_term`

**Solution:**
```bash
# First ingest some data
curl -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -d '{"youtube_url": "https://youtube.com/watch?v=SHARK_TANK_VIDEO"}'

# Then try searching
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me all pitches"}'
```

### AI Classification Wrong
**Possible causes:**
1. Query too ambiguous
2. Schema needs adjustment

**Solution:**
- Make queries more specific
- Check the `intent` object to see how AI interpreted it
- Adjust the prompt in `retrieval.service.ts` if needed

### Empty Filters
**Check the response:**
```json
{
  "filters": {
    "investor_name": "",
    "industry": "",
    "deal_made": "any",
    "valuation_gt": 0,
    "valuation_lt": 0
  }
}
```
This means no filters were applied - it's a pure semantic search.

---

## Performance Notes

- **Vector search**: Uses mock embeddings (4-dimensional random vectors)
- **Real implementation**: Replace with actual embedding model (OpenAI, Cohere, etc.)
- **Deduplication**: Groups by `parent_summary` to avoid duplicate pitches
- **Limit**: Currently returns top 5 results per search

---

## Next Steps

1. **Ingest real data**: Use `/ingest` endpoint with Shark Tank YouTube URLs
2. **Test search**: Try various query types
3. **Integrate with AI agent**: Use POST /search endpoint
4. **Monitor intent classification**: Check if AI correctly identifies query types
5. **Refine prompts**: Adjust classification prompt if needed
