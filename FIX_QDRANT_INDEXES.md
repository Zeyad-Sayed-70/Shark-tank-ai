# Fix: Qdrant Index Error

## Problem
You got this error:
```
Index required but not found for "investor_name" of one of the following types: [keyword]
```

## Solution
The vector store service has been updated to automatically create indexes for all filterable fields.

---

## Option 1: Restart the Server (Recommended)

Simply restart your NestJS server:

```bash
# Stop the server (Ctrl+C)
# Then start again
npm run start:dev
```

The indexes will be created automatically on startup. You'll see logs like:
```
[VectorStoreService] Ensuring indexes for filterable fields...
[VectorStoreService] Created index for investor_name
[VectorStoreService] Created index for industry
[VectorStoreService] Created index for company
...
```

---

## Option 2: Manual Index Creation (Without Restart)

If you don't want to restart, call this endpoint:

```bash
curl -X POST http://localhost:3000/setup-indexes
```

Response:
```json
{
  "status": "success",
  "message": "Indexes created successfully"
}
```

---

## What Indexes Are Created

The service creates indexes for all filterable fields:

### String Fields (keyword index)
- `investor_name` - For filtering by investor
- `industry` - For filtering by industry
- `company` - For filtering by company name
- `entrepreneur` - For filtering by entrepreneur name

### Boolean Field
- `deal_made` - For filtering by deal status

### Integer Fields
- `season` - For filtering by season number
- `episode` - For filtering by episode number

### Float Fields
- `valuation` - For filtering by valuation amount
- `ask_amount` - For filtering by ask amount
- `equity_offered` - For filtering by equity percentage

---

## After Indexes Are Created

Try your search again:

```bash
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me all Mark Cuban deals"}'
```

It should work now!

---

## Why This Happened

Qdrant requires indexes to be created for any field you want to filter on. The initial setup didn't create these indexes, so when the search tried to filter by `investor_name`, Qdrant rejected it.

Now the service automatically creates all necessary indexes on startup, so this won't happen again.
