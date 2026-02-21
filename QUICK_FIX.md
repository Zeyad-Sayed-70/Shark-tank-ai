# Quick Fix for 422 Error

## The Problem
The Mistral API is returning 422 Unprocessable Entity, which means the request format is incorrect.

## Quick Solutions to Try

### Option 1: Add Your Cookie (Most Likely Fix)
The API probably requires authentication. Update `.env`:

```env
MISTRAL_COOKIE=your_actual_cookie_from_browser
```

To get your cookie:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Make a request to Mistral console
4. Find the request and copy the Cookie header value

### Option 2: Test Without History First
The issue might be with the conversation history format. Let's test without it first.

Run this test:
```bash
node test-mistral-format.js
```

### Option 3: Check the Endpoint
Verify the endpoint in `.env` is correct:
```env
MISTRAL_ENDPOINT=http://213.199.33.174:8000/v1/mistral/chat
```

### Option 4: Simplify the Request
The proxy might not support all fields. Try removing optional fields.

## What to Check in Logs

Look for this line in your logs:
```
Mistral request payload: { ... }
```

This shows exactly what's being sent. Compare it with the example format you provided.

## Expected vs Actual

### Your Example (Working):
```json
{
  "prompt": "Could make it more simple",
  "instructions": "Provide detailed, well-researched answers with citations.",
  "tools": [...],
  "conversation_history": [...],
  "model": "mistral-large-latest",
  "temperature": 0.5,
  "max_tokens": 8096,
  "top_p": 1.0,
  "stream": false,
  "conversation_name": "ml_guide_creation",
  "reset_conversation": false,
  "cookie": "..."
}
```

### What We're Sending:
```json
{
  "prompt": "...",
  "instructions": "...",
  "conversation_history": [...],
  "model": "mistral-large-latest",
  "temperature": 0.5,
  "max_tokens": 8096,
  "top_p": 1.0,
  "stream": false,
  "reset_conversation": false,
  "cookie": "..." // if set in env
}
```

## Most Likely Issue: Missing Cookie

The 422 error often means authentication failed. Make sure you have a valid cookie in your `.env` file.

## Next Steps

1. Add cookie to `.env`
2. Restart your server
3. Try the request again
4. Check the logs for the full request payload
5. If still failing, run `node test-mistral-format.js` to test different formats
