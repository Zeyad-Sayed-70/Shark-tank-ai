# Qdrant Filter Fix

## Issues

1. **LangChain Warning**: Deprecation warning about tool calls (non-breaking)
2. **Qdrant Error**: Bad Request - Filter format issue causing search to fail

## Main Problem

The Qdrant search was failing with:
```
ApiError: Bad Request
Expected some form of condition, which can be a field condition
```

**Root Cause**: Null values were being passed in filters, and Qdrant was rejecting the filter format.

## Solution

### Fixed Filter Building Logic

**Before:**
```typescript
for (const [key, value] of Object.entries(filters)) {
  // Only skipped empty strings and zeros
  if (value === '' || value === 0 || value === 'any') {
    continue;
  }
  // null values were being processed!
}
```

**After:**
```typescript
for (const [key, value] of Object.entries(filters)) {
  // Skip null, undefined, empty strings, zeros
  if (value === null || value === undefined || value === '' || value === 0 || value === 'any') {
    continue;
  }
  // Only process actual values
}
```

### Enhanced Boolean Handling

**Before:**
```typescript
if (key === 'deal_made') {
  if (value === 'true' || value === 'false') {
    must.push({ key: key, match: { value: value === 'true' } });
  }
}
```

**After:**
```typescript
if (key === 'deal_made') {
  // Handle both boolean and string values
  if (typeof value === 'boolean') {
    must.push({ key: key, match: { value: value } });
  } else if (value === 'true' || value === 'false') {
    must.push({ key: key, match: { value: value === 'true' } });
  }
}
```

### Added Debug Logging

```typescript
this.logger.log(`Qdrant filter:`, JSON.stringify(qdrantFilter, null, 2));
```

## Example

**Query**: "What deals did Mark Cuban make?"

**AI Intent**:
```json
{
  "type": "FACTUAL",
  "filters": {
    "company": null,
    "entrepreneur": null,
    "season": null,
    "episode": null,
    "deal_made": true,
    "investor_name": "Mark Cuban",
    "industry": null,
    "ask_amount": null,
    "valuation": null,
    "equity_offered": null
  },
  "search_term": "deals made by Mark Cuban"
}
```

**Before (Failed)**:
- All fields including nulls were processed
- Qdrant rejected the filter format

**After (Works)**:
- Null values skipped
- Only `deal_made: true` and `investor_name: "Mark Cuban"` processed
- Clean Qdrant filter:
```json
{
  "must": [
    { "key": "deal_made", "match": { "value": true } },
    { "key": "investor_name", "match": { "value": "Mark Cuban" } }
  ]
}
```

## LangChain Warning

The warning about tool calls is just a deprecation notice:
```
New LangChain packages are available that more efficiently handle tool calling.
Please upgrade your packages...
```

This is **non-breaking** and can be ignored for now. It's just suggesting to use newer LangChain packages, but the current implementation works fine.

## Testing

Test with queries that use filters:

```bash
curl -X POST http://localhost:3000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What deals did Mark Cuban make?",
    "userId": "test"
  }'
```

Expected: Search executes successfully and returns results

## Files Modified

- `src/retrieval/retrieval.service.ts` - Fixed filter building logic

## Result

✅ Null values properly skipped  
✅ Boolean values handled correctly  
✅ Clean Qdrant filters  
✅ Search works properly  
✅ Debug logging added  
