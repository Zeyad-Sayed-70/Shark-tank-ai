# Infinite Loop Fix

## Issue

The agent was stuck in an infinite loop, repeatedly calling the same tool:
```
Using tool: shark_tank_search
Executing tool: shark_tank_search
Using tool: shark_tank_search
Executing tool: shark_tank_search
...
```

## Root Cause

After the tool executed and returned results, the agent would:
1. Go back to `callModel`
2. Detect the user message still needs a tool
3. Call the tool again
4. Repeat infinitely

## Solution

### 1. Tool Execution Flag

Added `tool_executed` flag to mark when a tool has been run:

```typescript
return {
  messages: [
    new AIMessage({
      content: '',
      additional_kwargs: {
        tool_result: result,
        tool_executed: true, // Prevents re-execution
      },
    }),
  ],
};
```

### 2. Enhanced shouldContinue

Updated to check for tool_result to prevent looping:

```typescript
private shouldContinue(state): string {
  const lastMessage = messages[messages.length - 1];

  // Only go to tools if we have tool_calls but NO tool_result
  if (
    lastMessage instanceof AIMessage &&
    lastMessage.additional_kwargs?.tool_calls &&
    !lastMessage.additional_kwargs?.tool_result
  ) {
    return 'tools';
  }

  return END;
}
```

### 3. Separate Tool Result Handling

Split `callModel` into two paths:

**Path 1: Tool result received → Generate final response**
```typescript
if (hasToolResult && toolExecuted) {
  // Build prompt with tool results
  // Call Gemini to generate answer
  // Return END (no more loops)
}
```

**Path 2: Initial message → Decide if tool needed**
```typescript
if (!hasToolResult && lastMessage instanceof HumanMessage) {
  // Check if tool needed
  // If yes, call tool
  // If no, generate response directly
}
```

### 4. Better Logging

Added logging to track flow:

```typescript
console.log('Tool result received, length: ...');
console.log('Final response generated, ending conversation');
```

## Flow Diagram

### Before (Infinite Loop)
```
User Message
    ↓
Agent: Detect tool needed
    ↓
Execute tool
    ↓
Back to Agent
    ↓
Agent: Detect tool needed again ← LOOP!
    ↓
Execute tool again
    ↓
...infinite loop...
```

### After (Fixed)
```
User Message
    ↓
Agent: Detect tool needed
    ↓
Execute tool (set tool_executed=true)
    ↓
Back to Agent
    ↓
Agent: See tool_executed=true
    ↓
Generate final response
    ↓
END (no loop)
```

## Testing

The agent should now:
1. Receive user message
2. Detect tool needed (once)
3. Execute tool (once)
4. Generate response using results
5. Return to user
6. END

No more infinite loops!

## Files Modified

- `src/agent/shark-tank-agent.ts` - Loop prevention logic

## Result

✅ No more infinite loops  
✅ Tools execute exactly once  
✅ Clean conversation flow  
✅ Proper termination  
