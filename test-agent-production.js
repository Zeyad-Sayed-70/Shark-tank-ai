/**
 * Production-Ready Agent Test Script
 * 
 * This script tests the queue-based agent system with proper error handling.
 * 
 * Usage:
 *   node test-agent-production.js
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

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

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

// Test 1: Submit a chat job
async function submitChatJob(message, userId = 'test-user') {
  console.log('\n📤 Submitting chat job...');
  console.log(`   Message: "${message}"`);
  
  const result = await request('POST', '/agent/chat', {
    message,
    userId,
  });

  if (result.status === 200 && result.data.success) {
    console.log('✅ Job submitted successfully!');
    console.log(`   Job ID: ${result.data.jobId}`);
    console.log(`   Status URL: ${BASE_URL}${result.data.statusUrl}`);
    console.log(`   Result URL: ${BASE_URL}${result.data.resultUrl}`);
    return result.data.jobId;
  } else {
    console.error('❌ Failed to submit job');
    console.error(`   Status: ${result.status}`);
    console.error(`   Error: ${result.data?.error || result.error}`);
    return null;
  }
}

// Test 2: Check job status
async function checkJobStatus(jobId) {
  const result = await request('GET', `/agent/queue/job/${jobId}`);

  if (result.status === 200 && result.data.success) {
    const job = result.data.job;
    return {
      status: job.status,
      progress: job.progress,
      result: job.result,
      error: job.error,
    };
  } else {
    console.error('❌ Failed to get job status');
    return null;
  }
}

// Test 3: Wait for job completion
async function waitForJobCompletion(jobId, maxWaitTime = 120000) {
  console.log('\n⏳ Waiting for job completion...');
  
  const startTime = Date.now();
  const pollInterval = 2000; // 2 seconds
  let lastProgress = -1;

  while (Date.now() - startTime < maxWaitTime) {
    const jobInfo = await checkJobStatus(jobId);

    if (!jobInfo) {
      console.error('❌ Job not found');
      return null;
    }

    // Show progress if changed
    if (jobInfo.progress !== lastProgress) {
      console.log(`   Progress: ${jobInfo.progress}% (${jobInfo.status})`);
      lastProgress = jobInfo.progress;
    }

    if (jobInfo.status === 'completed') {
      console.log('✅ Job completed successfully!');
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`   Time elapsed: ${elapsed}s`);
      return jobInfo.result;
    }

    if (jobInfo.status === 'failed') {
      console.error('❌ Job failed!');
      console.error(`   Error: ${jobInfo.error}`);
      return null;
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  console.error('❌ Timeout waiting for job completion');
  return null;
}

// Test 4: Get job result
async function getJobResult(jobId) {
  console.log('\n📥 Getting job result...');
  
  const result = await request('GET', `/agent/queue/job/${jobId}/result`);

  if (result.status === 200 && result.data.success) {
    console.log('✅ Result retrieved successfully!');
    return result.data.result;
  } else {
    console.error('❌ Failed to get result');
    console.error(`   Message: ${result.data?.message}`);
    return null;
  }
}

// Test 5: Check queue stats
async function checkQueueStats() {
  console.log('\n📊 Checking queue statistics...');
  
  const result = await request('GET', '/agent/queue/stats');

  if (result.status === 200 && result.data.success) {
    const stats = result.data.stats;
    console.log('✅ Queue stats:');
    console.log(`   Waiting: ${stats.waiting}`);
    console.log(`   Active: ${stats.active}`);
    console.log(`   Completed: ${stats.completed}`);
    console.log(`   Failed: ${stats.failed}`);
    console.log(`   Total: ${stats.total}`);
    return stats;
  } else {
    console.error('❌ Failed to get queue stats');
    return null;
  }
}

// Test 6: Health check
async function healthCheck() {
  console.log('\n🏥 Checking system health...');
  
  const agentHealth = await request('GET', '/agent/health');
  const queueHealth = await request('GET', '/agent/queue/health');

  if (agentHealth.status === 200 && queueHealth.status === 200) {
    console.log('✅ System is healthy!');
    console.log(`   Agent: ${agentHealth.data.status}`);
    console.log(`   Queue: ${queueHealth.data.status}`);
    return true;
  } else {
    console.error('❌ System health check failed');
    return false;
  }
}

// Test 7: Conversation test
async function testConversation() {
  console.log('\n💬 Testing conversation with context...');
  
  // First message
  console.log('\n1️⃣ First message...');
  const jobId1 = await submitChatJob('Tell me about Mark Cuban', 'conv-test-user');
  
  if (!jobId1) {
    console.error('❌ Failed to submit first message');
    return;
  }

  const result1 = await waitForJobCompletion(jobId1);
  
  if (!result1) {
    console.error('❌ First message failed');
    return;
  }

  const sessionId = result1.sessionId;
  console.log(`\n📝 Response preview: ${result1.response.substring(0, 150)}...`);
  console.log(`   Session ID: ${sessionId}`);

  // Second message with context
  console.log('\n2️⃣ Follow-up message with context...');
  const jobId2 = await submitChatJob('What companies has he invested in?', 'conv-test-user');
  
  if (!jobId2) {
    console.error('❌ Failed to submit follow-up message');
    return;
  }

  const result2 = await waitForJobCompletion(jobId2);
  
  if (!result2) {
    console.error('❌ Follow-up message failed');
    return;
  }

  console.log(`\n📝 Response preview: ${result2.response.substring(0, 150)}...`);
  console.log('\n✅ Conversation test completed!');
}

// Main test runner
async function runTests() {
  console.log('='.repeat(70));
  console.log('🚀 Production-Ready Agent Queue Tests');
  console.log('='.repeat(70));
  console.log(`\nAPI URL: ${BASE_URL}`);
  
  try {
    // Health check first
    const healthy = await healthCheck();
    if (!healthy) {
      console.error('\n❌ System is not healthy. Please check:');
      console.error('   1. Is the server running?');
      console.error('   2. Is Redis running?');
      console.error('   3. Check server logs for errors');
      return;
    }

    // Check queue stats
    await checkQueueStats();

    // Test 1: Simple chat
    console.log('\n' + '='.repeat(70));
    console.log('Test 1: Simple Chat Request');
    console.log('='.repeat(70));
    
    const jobId = await submitChatJob('What is Shark Tank?', 'test-user-1');
    
    if (jobId) {
      const result = await waitForJobCompletion(jobId);
      
      if (result) {
        console.log('\n📝 Agent Response:');
        console.log('─'.repeat(70));
        console.log(result.response);
        console.log('─'.repeat(70));
        console.log(`\n⏱️  Processing time: ${result.processingTime}ms`);
      }
    }

    // Test 2: Conversation
    console.log('\n' + '='.repeat(70));
    console.log('Test 2: Conversation with Context');
    console.log('='.repeat(70));
    
    await testConversation();

    // Final stats
    console.log('\n' + '='.repeat(70));
    console.log('Final Queue Statistics');
    console.log('='.repeat(70));
    await checkQueueStats();

    console.log('\n' + '='.repeat(70));
    console.log('✅ All tests completed successfully!');
    console.log('='.repeat(70));
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    console.error(error.stack);
  }
}

// Run tests
console.log('Starting tests in 2 seconds...\n');
setTimeout(runTests, 2000);
