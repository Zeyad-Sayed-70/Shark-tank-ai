# JSON Schema Documentation - Gemini API Compatible

## Overview
This document outlines the JSON schemas used in the Shark Tank AI server, ensuring full compatibility with Google's Gemini API Structured Outputs specification.

## Mission Alignment
The schemas support the core mission of the Shark Tank search engine:
1. **Data Ingestion**: Extract structured pitch data from YouTube videos
2. **Intent Classification**: Understand user search queries (FACTUAL, SEMANTIC, or HYBRID)
3. **Retrieval**: Return relevant pitch information based on filters and semantic search

---

## Schema 1: Data Ingestion Schema

### Purpose
Extracts structured information about Shark Tank pitches from video transcripts.

### Schema Definition
```json
{
  "type": "object",
  "properties": {
    "pitches": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "metadata": {
            "type": "object",
            "properties": {
              "company": { 
                "type": "string",
                "description": "Name of the company or product"
              },
              "entrepreneur": { 
                "type": "string",
                "description": "Name of the entrepreneur(s)"
              },
              "season": { 
                "type": "integer",
                "description": "Season number"
              },
              "episode": { 
                "type": "integer",
                "description": "Episode number"
              },
              "ask_amount": { 
                "type": "number",
                "description": "Amount of money requested in dollars"
              },
              "valuation": { 
                "type": "number",
                "description": "Company valuation in dollars"
              },
              "equity_offered": { 
                "type": "number",
                "description": "Percentage of equity offered"
              },
              "deal_made": { 
                "type": "boolean",
                "description": "Whether a deal was made"
              },
              "investor_name": { 
                "type": "string",
                "description": "Name of the investor who made the deal, or 'None' if no deal"
              },
              "industry": { 
                "type": "string",
                "description": "Industry category of the business"
              }
            },
            "required": [
              "company", "entrepreneur", "season", "episode",
              "ask_amount", "valuation", "equity_offered",
              "deal_made", "investor_name", "industry"
            ]
          },
          "summary": { 
            "type": "string",
            "description": "A 300-500 word detailed summary of the pitch and negotiation"
          },
          "chunks": {
            "type": "array",
            "description": "List of 3-5 sentence chunks representing key moments, arguments, or quotes",
            "items": { "type": "string" }
          }
        },
        "required": ["metadata", "summary", "chunks"]
      }
    }
  },
  "required": ["pitches"]
}
```

### Key Features for Gemini Compatibility
1. **Root must be object**: Wrapped array in `pitches` property (Gemini requires root to be object, not array)
2. **No additionalProperties**: Gemini does NOT support this keyword
3. **All fields required**: Every property is marked as required (Gemini requirement)
4. **Descriptions added**: Help guide the model's understanding

### Example Output
```json
{
  "pitches": [
    {
      "metadata": {
        "company": "Scrub Daddy",
        "entrepreneur": "Aaron Krause",
        "season": 4,
        "episode": 7,
        "ask_amount": 100000,
        "valuation": 200000,
        "equity_offered": 50,
        "deal_made": true,
        "investor_name": "Lori Greiner",
        "industry": "Home & Kitchen"
      },
      "summary": "Aaron Krause pitched Scrub Daddy...",
      "chunks": [
        "Aaron demonstrated the temperature-responsive sponge...",
        "Lori saw the QVC potential immediately...",
        "Deal closed at $200k for 20% equity..."
      ]
    }
  ]
}
```

---

## Schema 2: Intent Classification Schema

### Purpose
Classifies user search queries and extracts relevant filters for the Shark Tank database.

### Schema Definition
```json
{
  "type": "object",
  "properties": {
    "type": {
      "type": "string",
      "enum": ["FACTUAL", "SEMANTIC", "HYBRID"],
      "description": "The type of search query"
    },
    "filters": {
      "type": "object",
      "properties": {
        "investor_name": {
          "type": "string",
          "description": "Name of the investor (e.g., Mark Cuban, Kevin O'Leary), or empty string if not applicable"
        },
        "industry": {
          "type": "string",
          "description": "Industry category of the business, or empty string if not applicable"
        },
        "deal_made": {
          "type": "string",
          "enum": ["true", "false", "any"],
          "description": "Whether a deal was made: 'true', 'false', or 'any' if not filtering by this"
        },
        "valuation_gt": {
          "type": "number",
          "description": "Minimum valuation amount in dollars, or 0 if not filtering"
        },
        "valuation_lt": {
          "type": "number",
          "description": "Maximum valuation amount in dollars, or 0 if not filtering"
        }
      },
      "required": [
        "investor_name",
        "industry",
        "deal_made",
        "valuation_gt",
        "valuation_lt"
      ]
    },
    "search_term": {
      "type": "string",
      "description": "Core concept or keywords for semantic search"
    }
  },
  "required": ["type", "filters", "search_term"]
}
```

### Key Features for Gemini Compatibility
1. **No union types**: Gemini doesn't support `["string", "null"]`, so we use sentinel values instead
2. **Sentinel values for optional fields**: 
   - Empty string `""` for unused string filters
   - `0` for unused numeric filters
   - `"any"` for deal_made when not filtering
3. **No additionalProperties**: Removed (not supported by Gemini)
4. **Descriptions added**: Clarify expected values and sentinel meanings
5. **All fields required**: Filters must return all keys

### Example Outputs

#### FACTUAL Query
```json
{
  "type": "FACTUAL",
  "filters": {
    "investor_name": "Mark Cuban",
    "industry": "",
    "deal_made": "true",
    "valuation_gt": 1000000,
    "valuation_lt": 0
  },
  "search_term": "Mark Cuban deals"
}
```

#### SEMANTIC Query
```json
{
  "type": "SEMANTIC",
  "filters": {
    "investor_name": "",
    "industry": "Food & Beverage",
    "deal_made": "any",
    "valuation_gt": 0,
    "valuation_lt": 0
  },
  "search_term": "failed food pitches with emotional stories"
}
```

#### HYBRID Query
```json
{
  "type": "HYBRID",
  "filters": {
    "investor_name": "Kevin O'Leary",
    "industry": "",
    "deal_made": "false",
    "valuation_gt": 0,
    "valuation_lt": 0
  },
  "search_term": "royalty deal negotiations"
}
```

---

## Gemini API Compatibility Checklist

### ✅ Implemented Requirements
- [x] Root object must be type "object" (not array)
- [x] All fields marked as required
- [x] **NO** `additionalProperties` keyword (not supported by Gemini)
- [x] Sentinel values (`""`, `0`, `"any"`) instead of null/union types
- [x] Valid enum values
- [x] Proper nesting (< 10 levels)
- [x] Integer type for season/episode
- [x] Number type for monetary values
- [x] Boolean type for deal_made in ingestion
- [x] String descriptions for clarity

### ✅ Validation Rules Met
- Total object properties: < 5000 ✓
- Nesting depth: 3 levels ✓
- Enum values: 3-4 per field ✓
- No unsupported keywords ✓

---

## Gemini vs OpenAI Differences

| Feature | OpenAI | Gemini | Our Implementation |
|---------|--------|--------|-------------------|
| `additionalProperties` | Required (`false`) | **Not supported** | Removed |
| Optional fields | Union types `["string", "null"]` | **Not supported** | Use sentinel values |
| Root type | Must be object | Must be object | ✓ Object |
| Descriptions | Optional | Recommended | ✓ Added |
| Enum support | Yes | Yes | ✓ Used |

---

## Usage in Code

### Data Ingestion Service
```typescript
const response = await this.aiService.generateResponse(prompt, schema, url);
const pitches = response.pitches; // Access wrapped array
```

### Retrieval Service
```typescript
const intent = await this.aiService.generateResponse(prompt, schema);

// Filter handling with sentinel values
if (intent.filters.investor_name !== '') {
  // Apply investor filter
}
if (intent.filters.valuation_gt > 0) {
  // Apply minimum valuation filter
}
if (intent.filters.deal_made !== 'any') {
  // Apply deal_made filter (convert "true"/"false" to boolean)
}
```

---

## Testing Recommendations

1. **Test with sentinel values**: Ensure empty strings and zeros are handled correctly
2. **Test edge cases**: Empty arrays, zero values, extreme numbers
3. **Test all query types**: FACTUAL, SEMANTIC, HYBRID
4. **Test filter combinations**: Multiple filters active, single filter, no filters
5. **Test deal_made enum**: "true", "false", "any"

---

## Future Enhancements

### Potential Schema Extensions
1. **Add more filter fields**: 
   - `ask_amount_gt`, `ask_amount_lt`
   - `equity_offered_gt`, `equity_offered_lt`
   - `season`, `episode` (exact match)

2. **Add confidence scores**:
   ```json
   "confidence": {
     "type": "number",
     "description": "Confidence score between 0 and 1"
   }
   ```

3. **Add timestamps**:
   ```json
   "video_timestamp": {
     "type": "string",
     "description": "Timestamp in video where this moment occurs (MM:SS format)"
   }
   ```

---

## References
- [Gemini Structured Outputs Documentation](https://ai.google.dev/gemini-api/docs/structured-output)
- [JSON Schema Specification](https://json-schema.org/)
- [Gemini API Cookbook](https://github.com/google-gemini/cookbook)

## Mission Alignment
The schemas support the core mission of the Shark Tank search engine:
1. **Data Ingestion**: Extract structured pitch data from YouTube videos
2. **Intent Classification**: Understand user search queries (FACTUAL, SEMANTIC, or HYBRID)
3. **Retrieval**: Return relevant pitch information based on filters and semantic search

---

## Schema 1: Data Ingestion Schema

### Purpose
Extracts structured information about Shark Tank pitches from video transcripts.

### Schema Definition
```json
{
  "type": "object",
  "properties": {
    "pitches": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "metadata": {
            "type": "object",
            "properties": {
              "company": { "type": "string" },
              "entrepreneur": { "type": "string" },
              "season": { "type": "integer" },
              "episode": { "type": "integer" },
              "ask_amount": { "type": "number" },
              "valuation": { "type": "number" },
              "equity_offered": { "type": "number" },
              "deal_made": { "type": "boolean" },
              "investor_name": { "type": "string" },
              "industry": { "type": "string" }
            },
            "required": [
              "company", "entrepreneur", "season", "episode",
              "ask_amount", "valuation", "equity_offered",
              "deal_made", "investor_name", "industry"
            ],
            "additionalProperties": false
          },
          "summary": { "type": "string" },
          "chunks": {
            "type": "array",
            "items": { "type": "string" }
          }
        },
        "required": ["metadata", "summary", "chunks"],
        "additionalProperties": false
      }
    }
  },
  "required": ["pitches"],
  "additionalProperties": false
}
```

### Key Changes for OpenAI Compatibility
1. **Root must be object**: Wrapped array in `pitches` property (OpenAI requires root to be object, not array)
2. **additionalProperties: false**: Added to all objects to comply with OpenAI strict mode
3. **All fields required**: Every property is marked as required (OpenAI requirement)

### Example Output
```json
{
  "pitches": [
    {
      "metadata": {
        "company": "Scrub Daddy",
        "entrepreneur": "Aaron Krause",
        "season": 4,
        "episode": 7,
        "ask_amount": 100000,
        "valuation": 200000,
        "equity_offered": 50,
        "deal_made": true,
        "investor_name": "Lori Greiner",
        "industry": "Home & Kitchen"
      },
      "summary": "Aaron Krause pitched Scrub Daddy...",
      "chunks": [
        "Aaron demonstrated the temperature-responsive sponge...",
        "Lori saw the QVC potential immediately...",
        "Deal closed at $200k for 20% equity..."
      ]
    }
  ]
}
```

---

## Schema 2: Intent Classification Schema

### Purpose
Classifies user search queries and extracts relevant filters for the Shark Tank database.

### Schema Definition
```json
{
  "type": "object",
  "properties": {
    "type": {
      "type": "string",
      "enum": ["FACTUAL", "SEMANTIC", "HYBRID"],
      "description": "The type of search query"
    },
    "filters": {
      "type": "object",
      "properties": {
        "investor_name": {
          "type": ["string", "null"],
          "description": "Name of the investor (e.g., Mark Cuban, Kevin O'Leary)"
        },
        "industry": {
          "type": ["string", "null"],
          "description": "Industry category of the business"
        },
        "deal_made": {
          "type": ["boolean", "null"],
          "description": "Whether a deal was made"
        },
        "valuation_gt": {
          "type": ["number", "null"],
          "description": "Minimum valuation amount"
        },
        "valuation_lt": {
          "type": ["number", "null"],
          "description": "Maximum valuation amount"
        }
      },
      "required": [
        "investor_name",
        "industry",
        "deal_made",
        "valuation_gt",
        "valuation_lt"
      ],
      "additionalProperties": false
    },
    "search_term": {
      "type": "string",
      "description": "Core concept or keywords for semantic search"
    }
  },
  "required": ["type", "filters", "search_term"],
  "additionalProperties": false
}
```

### Key Changes for OpenAI Compatibility
1. **Union types for optional fields**: Used `["string", "null"]` instead of optional fields
2. **additionalProperties: false**: Added to comply with strict mode
3. **Descriptions added**: Improved clarity for the AI model
4. **All fields required**: Filters must return all keys (with null if not applicable)

### Example Outputs

#### FACTUAL Query
```json
{
  "type": "FACTUAL",
  "filters": {
    "investor_name": "Mark Cuban",
    "industry": null,
    "deal_made": true,
    "valuation_gt": 1000000,
    "valuation_lt": null
  },
  "search_term": "Mark Cuban deals"
}
```

#### SEMANTIC Query
```json
{
  "type": "SEMANTIC",
  "filters": {
    "investor_name": null,
    "industry": "Food & Beverage",
    "deal_made": null,
    "valuation_gt": null,
    "valuation_lt": null
  },
  "search_term": "failed food pitches with emotional stories"
}
```

#### HYBRID Query
```json
{
  "type": "HYBRID",
  "filters": {
    "investor_name": "Kevin O'Leary",
    "industry": null,
    "deal_made": false,
    "valuation_gt": null,
    "valuation_lt": null
  },
  "search_term": "royalty deal negotiations"
}
```

---

## OpenAI Compatibility Checklist

### ✅ Implemented Requirements
- [x] Root object must be type "object" (not array)
- [x] All fields marked as required
- [x] `additionalProperties: false` on all objects
- [x] Union types `["type", "null"]` for optional values
- [x] Valid enum values
- [x] Proper nesting (< 10 levels)
- [x] Integer type for season/episode
- [x] Number type for monetary values
- [x] Boolean type for deal_made
- [x] String descriptions for clarity

### ✅ Validation Rules Met
- Total object properties: < 5000 ✓
- Nesting depth: 3 levels (< 10) ✓
- Enum values: 3 (< 1000) ✓
- No unsupported keywords (patternProperties, etc.) ✓

---

## Usage in Code

### Data Ingestion Service
```typescript
const response = await this.aiService.generateResponse(prompt, schema, url);
const pitches = response.pitches; // Access wrapped array
```

### Retrieval Service
```typescript
const intent = await this.aiService.generateResponse(prompt, schema);
// intent.type, intent.filters, intent.search_term are guaranteed to exist
```

---

## Testing Recommendations

1. **Test with null values**: Ensure filters handle null properly
2. **Test edge cases**: Empty arrays, zero values, extreme numbers
3. **Test refusals**: Handle cases where AI refuses to process (safety)
4. **Test incomplete responses**: Handle max_tokens truncation

---

## Future Enhancements

### Potential Schema Extensions
1. **Add more filter fields**: 
   - `ask_amount_gt`, `ask_amount_lt`
   - `equity_offered_gt`, `equity_offered_lt`
   - `season_range`, `episode_range`

2. **Add confidence scores**:
   ```json
   "confidence": {
     "type": "number",
     "minimum": 0,
     "maximum": 1
   }
   ```

3. **Add source timestamps**:
   ```json
   "timestamp": {
     "type": "string",
     "format": "date-time"
   }
   ```

---

## References
- [OpenAI Structured Outputs Documentation](https://platform.openai.com/docs/guides/structured-outputs)
- [JSON Schema Specification](https://json-schema.org/)
