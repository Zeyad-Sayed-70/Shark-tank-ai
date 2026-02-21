# Mistral API 422 Error - Debug Guide

## The Error
```
422 Unprocessable Entity for url 'https://console.mistral.ai/api-ui/bora/v1/conversations'
```

This means the Mistral proxy is rejecting the request format.

## Debugging Steps

### Step 1: Test the API Format
Run the test script to see what format works:

```bash
node test-mistral-format.js
```

This will test 3 different payload formats:
1. Minimal request (no history)
2. With conversation history
3. Exact format from your example

### Step 2: Check the Logs
The updated code now logs the full request payload. Look for:

```
Mistral request payload: { ... }
```

This will show you exactly what's being sent to the API.

### Step 3: Common Issues

#### Issue 1: Missing Cookie
The API might require authentication via cookie.

**Solution**: Add your cookie to `.env`:
```env
MISTRAL_COOKIE=your_actual_cookie_value
```

#### Issue 2: Wrong Conversation History Format
The history format must match exactly:

```json
{
  "object": "entry",
  "type": "message.input" | "message.output",
  "role": "user" | "assistant",
  "content": "string",
  "model": "mistral-large-latest",  // Only for assistant messages
  "prefix": false
}
```

#### Issue 3: Missing Required Fields
Check if these fields are required:
- `conversation_name`: Unique name for the conversation
- `reset_conversation`: Boolean to reset or continue
- `cookie`: Authentication cookie

### Step 4: Test Without History First

Try a simple request without conversation history:

```bash
curl -X POST http://213.199.33.174:8000/v1/mistral/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Hello",
    "instructions": "You are helpful",
    "conversation_history": [],
    "model": "mistral-large-latest",
    "temperature": 0.5,
    "max_tokens": 1000,
    "top_p": 1.0,
    "stream": false,
    "reset_conversation": true
  }'
```

### Step 5: Check Response Format

The proxy might expect a different response format. Check what the successful response looks like:
- `response.data.content`
- `response.data.response`
- `response.data.message`

## Updated Code Changes

### What I Changed:

1. **Added `reset_conversation` field** to all requests
2. **Made cookie optional** - only added if present in env
3. **Added detailed logging** - logs full request payload
4. **Added error logging** - logs request data on error

### Current Request Format:

```typescript
{
  prompt: string,
  instructions: string,
  conversation_history: Array<{
    object: 'entry',
    type: 'message.input' | 'message.output',
    role: 'user' | 'assistant',
    content: string,
    model?: 'mistral-large-latest',
    prefix: false
  }>,
  model: 'mistral-large-latest',
  temperature: 0.5,
  max_tokens: 8096,
  top_p: 1.0,
  stream: false,
  reset_conversation: false,
  cookie?: string  // Optional, from env
}
```

## Next Steps

1. **Run the test script**: `node test-mistral-format.js`
2. **Check which format works** (if any)
3. **Look at the server logs** for the full request payload
4. **Compare with working format** from your example

## Possible Solutions

### Solution 1: Add Cookie
If the API requires authentication:
```env
MISTRAL_COOKIE=your_cookie_value
```

### Solution 2: Use Conversation Name
Add a unique conversation name:
```typescript
conversation_name: `conv_${sessionId}`
```

### Solution 3: Simplify History Format
Try removing optional fields from history:
```typescript
{
  role: 'user',
  content: 'message'
}
```

### Solution 4: Contact API Provider
If none of the above works, you may need to:
1. Check the API documentation
2. Contact the API provider
3. Verify the endpoint URL is correct
4. Check if there's a different endpoint for conversations with history

## Testing Checklist

- [ ] Run `node test-mistral-format.js`
- [ ] Check server logs for request payload
- [ ] Verify cookie is set in `.env`
- [ ] Test without conversation history
- [ ] Test with simple history (1-2 messages)
- [ ] Compare with working example format
- [ ] Check if endpoint URL is correct
- [ ] Verify all required fields are present

## Contact Information

If you need help:
1. Share the full request payload from logs
2. Share the exact error response
3. Share a working example if you have one
4. Check if there's API documentation available
