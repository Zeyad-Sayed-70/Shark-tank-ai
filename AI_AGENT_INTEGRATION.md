# AI Agent Integration Guide

## Overview
This document explains how an AI agent should integrate with the Shark Tank search endpoint to provide users with pitch information.

---

## Endpoint for AI Agent

**URL:** `POST http://localhost:3000/search`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "query": "user's natural language question"
}
```

---

## Integration Flow

```
User Question → AI Agent → POST /search → Parse Response → Format Answer → User
```

### Step 1: Receive User Question
```
User: "Show me all the deals Mark Cuban made"
```

### Step 2: Send to Search Endpoint
```javascript
const response = await fetch('http://localhost:3000/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    query: "Show me all the deals Mark Cuban made" 
  })
});

const data = await response.json();
```

### Step 3: Parse Response
```javascript
const { query, intent, results, count } = data;

// Intent tells you how the query was interpreted
console.log(intent.type);           // "FACTUAL"
console.log(intent.filters);        // { investor_name: "Mark Cuban", ... }
console.log(intent.search_term);    // "Mark Cuban deals"

// Results contain the actual pitches
console.log(count);                 // 3
console.log(results);               // Array of pitch objects
```

### Step 4: Format Response for User
```javascript
if (count === 0) {
  return "I couldn't find any pitches matching your query.";
}

let answer = `I found ${count} pitch${count > 1 ? 'es' : ''} for you:\n\n`;

results.forEach((pitch, i) => {
  answer += `${i + 1}. **${pitch.company}** by ${pitch.entrepreneur}\n`;
  answer += `   - Season ${pitch.season}, Episode ${pitch.episode}\n`;
  answer += `   - Asked for $${pitch.ask_amount.toLocaleString()} for ${pitch.equity_offered}% equity\n`;
  answer += `   - Valuation: $${pitch.valuation.toLocaleString()}\n`;
  answer += `   - Industry: ${pitch.industry}\n`;
  
  if (pitch.deal_made) {
    answer += `   - ✅ Deal made with ${pitch.investor_name}\n`;
  } else {
    answer += `   - ❌ No deal\n`;
  }
  
  answer += `   - Summary: ${pitch.parent_summary.substring(0, 200)}...\n\n`;
});

return answer;
```

---

## Response Structure

### Full Response Object
```typescript
{
  query: string;           // Original user query
  intent: {
    type: "FACTUAL" | "SEMANTIC" | "HYBRID";
    filters: {
      investor_name: string;      // "" if not filtering
      industry: string;            // "" if not filtering
      deal_made: "true" | "false" | "any";
      valuation_gt: number;        // 0 if not filtering
      valuation_lt: number;        // 0 if not filtering
    };
    search_term: string;   // Keywords for semantic search
  };
  results: Array<{
    // Metadata
    company: string;
    entrepreneur: string;
    season: number;
    episode: number;
    
    // Financial
    ask_amount: number;
    valuation: number;
    equity_offered: number;
    
    // Deal Info
    deal_made: boolean;
    investor_name: string;
    industry: string;
    
    // Content
    parent_summary: string;  // Full pitch summary (300-500 words)
    chunk_text: string;      // Specific moment/quote
    video_url: string;       // Source video
  }>;
  count: number;           // Number of results
}
```

---

## Example Interactions

### Example 1: Specific Investor Query

**User:** "What deals did Mark Cuban make?"

**Request:**
```json
{
  "query": "What deals did Mark Cuban make?"
}
```

**Response:**
```json
{
  "query": "What deals did Mark Cuban make?",
  "intent": {
    "type": "FACTUAL",
    "filters": {
      "investor_name": "Mark Cuban",
      "industry": "",
      "deal_made": "true",
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
      "parent_summary": "Melissa Carbone pitched Ten Thirty One Productions...",
      "chunk_text": "Mark Cuban was impressed by the unique concept...",
      "video_url": "https://youtube.com/watch?v=..."
    }
  ],
  "count": 1
}
```

**AI Agent Response to User:**
```
I found 1 pitch for you:

1. **Ten Thirty One Productions** by Melissa Carbone
   - Season 4, Episode 3
   - Asked for $200,000 for 10% equity
   - Valuation: $2,000,000
   - Industry: Entertainment
   - ✅ Deal made with Mark Cuban
   - Summary: Melissa Carbone pitched Ten Thirty One Productions...
```

---

### Example 2: Concept-Based Query

**User:** "Tell me about food pitches that failed"

**Request:**
```json
{
  "query": "Tell me about food pitches that failed"
}
```

**Response:**
```json
{
  "query": "Tell me about food pitches that failed",
  "intent": {
    "type": "SEMANTIC",
    "filters": {
      "investor_name": "",
      "industry": "Food & Beverage",
      "deal_made": "false",
      "valuation_gt": 0,
      "valuation_lt": 0
    },
    "search_term": "food pitches failed unsuccessful"
  },
  "results": [
    {
      "company": "Sweet Ballz",
      "entrepreneur": "James McDonald",
      "season": 4,
      "episode": 12,
      "ask_amount": 250000,
      "valuation": 1000000,
      "equity_offered": 25,
      "deal_made": false,
      "investor_name": "None",
      "industry": "Food & Beverage",
      "parent_summary": "James pitched Sweet Ballz, cake balls...",
      "chunk_text": "The sharks were concerned about the name...",
      "video_url": "https://youtube.com/watch?v=..."
    }
  ],
  "count": 1
}
```

**AI Agent Response to User:**
```
I found 1 pitch for you:

1. **Sweet Ballz** by James McDonald
   - Season 4, Episode 12
   - Asked for $250,000 for 25% equity
   - Valuation: $1,000,000
   - Industry: Food & Beverage
   - ❌ No deal
   - Summary: James pitched Sweet Ballz, cake balls...
```

---

### Example 3: Complex Filter Query

**User:** "Show me tech companies with valuation over $5 million"

**Request:**
```json
{
  "query": "Show me tech companies with valuation over $5 million"
}
```

**Response:**
```json
{
  "query": "Show me tech companies with valuation over $5 million",
  "intent": {
    "type": "FACTUAL",
    "filters": {
      "investor_name": "",
      "industry": "Technology",
      "deal_made": "any",
      "valuation_gt": 5000000,
      "valuation_lt": 0
    },
    "search_term": "high valuation tech companies"
  },
  "results": [...],
  "count": 2
}
```

---

## Handling Edge Cases

### No Results Found
```javascript
if (count === 0) {
  return `I couldn't find any pitches matching "${query}". Try:
  - Being more specific
  - Using different keywords
  - Checking if data has been ingested`;
}
```

### Error Handling
```javascript
try {
  const response = await fetch('http://localhost:3000/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: userQuery })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    return `Error: ${data.error}`;
  }

  // Process results...
  
} catch (error) {
  return `I encountered an error searching for pitches: ${error.message}`;
}
```

### Timeout Handling
```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

try {
  const response = await fetch('http://localhost:3000/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: userQuery }),
    signal: controller.signal
  });
  
  clearTimeout(timeoutId);
  // Process response...
  
} catch (error) {
  if (error.name === 'AbortError') {
    return 'The search took too long. Please try again.';
  }
  throw error;
}
```

---

## Best Practices

### 1. Always Check Count First
```javascript
const { count, results } = data;

if (count === 0) {
  return "No results found.";
}

// Process results...
```

### 2. Use Intent for Context
```javascript
const { intent } = data;

// Acknowledge the filters in your response
let response = `Searching for ${intent.type.toLowerCase()} matches`;

if (intent.filters.investor_name) {
  response += ` from ${intent.filters.investor_name}`;
}

if (intent.filters.industry) {
  response += ` in ${intent.filters.industry}`;
}

response += `...\n\n`;
```

### 3. Format Numbers Properly
```javascript
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(amount);
};

// Usage
console.log(formatCurrency(pitch.valuation)); // "$2,000,000"
```

### 4. Truncate Long Summaries
```javascript
const truncate = (text, maxLength = 200) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

// Usage
console.log(truncate(pitch.parent_summary, 150));
```

### 5. Provide Video Links
```javascript
if (pitch.video_url) {
  response += `   - 🎥 [Watch on YouTube](${pitch.video_url})\n`;
}
```

---

## Testing Your Integration

### Test Script
```javascript
async function testAIAgentIntegration() {
  const testQueries = [
    "Show me Mark Cuban deals",
    "Find food companies that failed",
    "What tech companies got deals?",
    "Show me high valuation pitches"
  ];

  for (const query of testQueries) {
    console.log(`\nTesting: "${query}"`);
    
    const response = await fetch('http://localhost:3000/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    
    console.log(`Intent Type: ${data.intent.type}`);
    console.log(`Results: ${data.count}`);
    console.log('---');
  }
}

testAIAgentIntegration();
```

---

## Performance Considerations

- **Response Time**: Typically 1-3 seconds (depends on AI endpoint)
- **Caching**: Consider caching common queries
- **Rate Limiting**: Implement if needed for production
- **Pagination**: Currently returns top 5 results (can be adjusted)

---

## Summary

Your AI agent should:
1. ✅ Send user query to `POST /search`
2. ✅ Parse the `intent`, `results`, and `count`
3. ✅ Format results in a user-friendly way
4. ✅ Handle errors gracefully
5. ✅ Provide context from the intent classification

The endpoint handles all the complexity of:
- Intent classification (FACTUAL/SEMANTIC/HYBRID)
- Filter extraction
- Vector search
- Result deduplication

Your agent just needs to format and present the results!
