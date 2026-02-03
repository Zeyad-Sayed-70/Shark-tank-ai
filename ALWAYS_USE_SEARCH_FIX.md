# Always Use Search Tool - Fix

## Issue

The agent was making decisions about when to use the search tool based on keywords, which meant many Shark Tank questions weren't being answered with database data.

**Problem**: The agent's PRIMARY purpose is to answer questions using the Shark Tank database, but it was only searching when specific keywords were detected.

## Solution

### 1. Updated System Prompt

Made it CRYSTAL CLEAR that the agent MUST use the database:

```typescript
this.systemPrompt = `You are a Shark Tank expert and business analyst. 
Your PRIMARY role is to answer questions using the Shark Tank database.

CRITICAL: For ANY question about Shark Tank, you MUST use the 
shark_tank_search tool first to get accurate data from the database.

...

Be conversational and educational, but ALWAYS base your answers 
on database search results!`;
```

### 2. Always Use Tools

Changed `shouldUseTool()` to ALWAYS return true:

**Before:**
```typescript
private shouldUseTool(userMessage: string): boolean {
  const searchKeywords = ['show me', 'find', 'search', ...];
  return searchKeywords.some((kw) => lowerMessage.includes(kw));
}
```

**After:**
```typescript
private shouldUseTool(userMessage: string): boolean {
  // ALWAYS use tools for Shark Tank questions
  // The agent's primary purpose is to answer using database
  return true;
}
```

### 3. Default to Search Tool

Made `shark_tank_search` the DEFAULT tool for all questions:

**Before:**
```typescript
// Only used search if specific keywords found
if (lowerMessage.includes('show me') || ...) {
  return { useTool: true, toolName: 'shark_tank_search' };
}
return { useTool: false }; // ❌ No tool used!
```

**After:**
```typescript
// Check for calculator (explicit math only)
if (explicit math operation) {
  return { toolName: 'calculator' };
}

// Check for internet search (current news only)
if (current/recent/update keywords) {
  return { toolName: 'internet_search' };
}

// DEFAULT: Use Shark Tank search for ALL other questions
return {
  useTool: true,
  toolName: 'shark_tank_search',
  arguments: { query: userMessage },
};
```

## Decision Flow

### Before (Unreliable)
```
User: "Tell me about Scrub Daddy"
    ↓
Check keywords: "tell me about" ✓
    ↓
Use search tool ✓

User: "What happened with Scrub Daddy?"
    ↓
Check keywords: No match ✗
    ↓
No tool used ✗
    ↓
Generic answer without data ✗
```

### After (Always Uses Database)
```
User: ANY Shark Tank question
    ↓
shouldUseTool() → true (always)
    ↓
decideToolUsage() → Check priority:
    1. Calculator? (explicit math)
    2. Internet? (current news)
    3. DEFAULT: shark_tank_search ✓
    ↓
Search database ✓
    ↓
Answer with real data ✓
```

## Tool Priority

1. **Calculator** - Only for explicit math operations
   - "calculate 100 * 0.2"
   - "compute 500000 / 0.15"

2. **Internet Search** - Only for current news/updates
   - "what happened to Scrub Daddy recently"
   - "is Bombas still in business today"
   - "latest update on Ring"

3. **Shark Tank Search** - DEFAULT for everything else
   - "What is Shark Tank?"
   - "Tell me about Mark Cuban"
   - "Show me food companies"
   - "What deals did Lori make?"
   - "Who invested in Scrub Daddy?"
   - ANY other Shark Tank question

## Examples

### Example 1: General Question
**User**: "What is Shark Tank?"
- ✅ Uses `shark_tank_search`
- ✅ Gets database results
- ✅ Answers with real data

### Example 2: Investor Question
**User**: "Tell me about Mark Cuban"
- ✅ Uses `shark_tank_search`
- ✅ Searches for Mark Cuban deals
- ✅ Answers with his actual deals

### Example 3: Company Question
**User**: "Scrub Daddy"
- ✅ Uses `shark_tank_search`
- ✅ Finds Scrub Daddy pitch
- ✅ Answers with pitch details

### Example 4: Math Question
**User**: "Calculate 100000 * 0.2"
- ✅ Uses `calculator`
- ✅ Returns: 20000

### Example 5: Current News
**User**: "What happened to Scrub Daddy recently?"
- ✅ Uses `internet_search`
- ✅ Gets current news
- ✅ Answers with updates

## Benefits

✅ **Always uses database** - Primary purpose fulfilled  
✅ **No missed questions** - Every question gets data  
✅ **Accurate answers** - Based on real database  
✅ **Consistent behavior** - Predictable tool usage  
✅ **Better user experience** - Always data-driven  

## Files Modified

- `src/agent/shark-tank-agent.ts` - Tool decision logic

## Result

The agent now ALWAYS uses the Shark Tank database for questions, which is its primary purpose. Users get data-driven answers every time!
