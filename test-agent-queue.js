/**
 * Test script for AI Agent with Queue Integration
 * 
 * This script demonstrates how to use the AI agent with the job queue system.
 * 
 * Usage:
 *   node test-agent-queue.js
 */

const BASE_URL = 'http://localhost:3000';

// Helper function to make HTTP requests
async function request(method, path, body = null) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  return response.json();
}

// Test 1: Queue a chat message (async)
async function testQueueChat() {
  console.log('\n=== Test 1: Queue Chat (Async) ===');
  
  const result = await request('POST', '/agent/chat', {
    message: 'What is Shark Tank?',
    userId: 'test-user-1',
  });

  console.log('Response:', JSON.stringify(result, null, 2));
  
  if (result.success && result.jobId) {
    console.log(`\n✓ Job queued successfully: ${result.jobId}`);
    console.log(`  Status URL: ${result.statusUrl}`);
    console.log(`  Result URL: ${result.resultUrl}`);
    return result.jobId;
  } else {
    console.error('✗ Failed to queue job');
    return null;
  }
}

// Test 2: Check job status
async function testJobStatus(jobId) {
  console.log('\n=== Test 2: Check Job Status ===');
  
  const result = await request('GET', `/agent/queue/job/${jobId}`);
  console.log('Response:', JSON.stringify(result, null, 2));
  
  if (result.success) {
    console.log(`\n✓ Job status: ${result.job.status}`);
    console.log(`  Progress: ${result.job.progress}%`);
    return result.job.status;
  } else {
    console.error('✗ Failed to get job status');
    return null;
  }
}

// Test 3: Wait for job completion and get result
async function testWaitForResult(jobId) {
  console.log('\n=== Test 3: Wait for Job Result ===');
  
  const maxAttempts = 30;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const statusResult = await request('GET', `/agent/queue/job/${jobId}`);
    
    if (statusResult.success) {
      const status = statusResult.job.status;
      console.log(`Attempt ${attempts + 1}: Status = ${status}, Progress = ${statusResult.job.progress}%`);
      
      if (status === 'completed') {
        const result = await request('GET', `/agent/queue/job/${jobId}/result`);
        console.log('\n✓ Job completed!');
        console.log('Result:', JSON.stringify(result, null, 2));
        return result;
      }
      
      if (status === 'failed') {
        console.error('\n✗ Job failed:', statusResult.job.error);
        return null;
      }
    }
    
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.error('\n✗ Timeout waiting for job completion');
  return null;
}

// Test 4: Synchronous chat (queue + wait)
async function testSyncChat() {
  console.log('\n=== Test 4: Synchronous Chat (Queue + Wait) ===');
  
  const result = await request('POST', '/agent/chat/sync', {
    message: 'Who are the sharks on Shark Tank?',
    userId: 'test-user-2',
  });

  console.log('Response:', JSON.stringify(result, null, 2));
  
  if (result.success) {
    console.log('\n✓ Synchronous chat completed');
    console.log(`  Response: ${result.response.substring(0, 200)}...`);
    console.log(`  Processing time: ${result.processingTime}ms`);
  } else {
    console.error('✗ Synchronous chat failed');
  }
}

// Test 5: Chat with session (conversation)
async function testConversationWithQueue() {
  console.log('\n=== Test 5: Conversation with Queue ===');
  
  // First message
  console.log('\nMessage 1: Creating session...');
  const result1 = await request('POST', '/agent/chat/sync', {
    message: 'Tell me about Mark Cuban',
  });
  
  if (!result1.success) {
    console.error('✗ First message failed');
    return;
  }
  
  const sessionId = result1.sessionId;
  console.log(`✓ Session created: ${sessionId}`);
  console.log(`  Response: ${result1.response.substring(0, 150)}...`);
  
  // Second message (with context)
  console.log('\nMessage 2: Using session context...');
  const result2 = await request('POST', '/agent/chat/sync', {
    message: 'What companies has he invested in?',
    sessionId: sessionId,
  });
  
  if (result2.success) {
    console.log('✓ Second message completed');
    console.log(`  Response: ${result2.response.substring(0, 150)}...`);
  } else {
    console.error('✗ Second message failed');
  }
}

// Test 6: Queue statistics
async function testQueueStats() {
  console.log('\n=== Test 6: Queue Statistics ===');
  
  const result = await request('GET', '/agent/queue/stats');
  console.log('Response:', JSON.stringify(result, null, 2));
  
  if (result.success) {
    console.log('\n✓ Queue stats retrieved');
    console.log(`  Total jobs: ${result.stats.total}`);
    console.log(`  Active: ${result.stats.active}`);
    console.log(`  Waiting: ${result.stats.waiting}`);
    console.log(`  Completed: ${result.stats.completed}`);
    console.log(`  Failed: ${result.stats.failed}`);
  }
}

// Test 7: Direct processing (legacy mode)
async function testDirectProcessing() {
  console.log('\n=== Test 7: Direct Processing (Legacy Mode) ===');
  
  const result = await request('POST', '/agent/chat', {
    message: 'What is the success rate on Shark Tank?',
    useQueue: false,
  });

  console.log('Response:', JSON.stringify(result, null, 2));
  
  if (result.success && result.response) {
    console.log('\n✓ Direct processing completed');
    console.log(`  Response: ${result.response.substring(0, 150)}...`);
  } else {
    console.error('✗ Direct processing failed');
  }
}

// Main test runner
async function runTests() {
  console.log('='.repeat(60));
  console.log('AI Agent Queue Integration Tests');
  console.log('='.repeat(60));
  
  try {
    // Test async queue
    const jobId = await testQueueChat();
    
    if (jobId) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await testJobStatus(jobId);
      await testWaitForResult(jobId);
    }
    
    // Test sync queue
    await testSyncChat();
    
    // Test conversation
    await testConversationWithQueue();
    
    // Test queue stats
    await testQueueStats();
    
    // Test direct processing
    await testDirectProcessing();
    
    console.log('\n' + '='.repeat(60));
    console.log('All tests completed!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n✗ Test error:', error.message);
    console.error(error.stack);
  }
}

// Run tests
runTests();
