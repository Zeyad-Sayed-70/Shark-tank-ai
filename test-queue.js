// Test script for Agent Job Queue
// Run with: node test-queue.js

const API_URL = 'http://localhost:3000';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function pollJobResult(jobId, maxAttempts = 30) {
  console.log(`\n⏳ Polling for job ${jobId} result...`);
  
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${API_URL}/agent/queue/job/${jobId}/result`);
    const data = await response.json();
    
    if (data.success && data.result) {
      return data.result;
    }
    
    if (data.message === 'Job failed') {
      throw new Error(`Job failed: ${data.error}`);
    }
    
    process.stdout.write('.');
    await sleep(2000);
  }
  
  throw new Error('Timeout waiting for job result');
}

async function testQueue() {
  console.log('🚀 Starting Agent Queue Tests\n');
  console.log('='.repeat(80));

  try {
    // Test 1: Queue Health Check
    console.log('\n📋 Test 1: Queue Health Check');
    console.log('-'.repeat(80));
    const healthResponse = await fetch(`${API_URL}/agent/queue/health`);
    const healthData = await healthResponse.json();
    console.log('Status:', healthData.status);
    console.log('Stats:', JSON.stringify(healthData.stats, null, 2));

    // Test 2: Queue a Simple Chat
    console.log('\n📋 Test 2: Queue Simple Chat');
    console.log('-'.repeat(80));
    const chatResponse = await fetch(`${API_URL}/agent/queue/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What deals did Mark Cuban make?',
        userId: 'test_user'
      })
    });
    const chatData = await chatResponse.json();
    console.log('Job queued:', chatData.jobId);
    console.log('Status URL:', chatData.statusUrl);
    
    const jobId1 = chatData.jobId;

    // Test 3: Check Job Status
    console.log('\n📋 Test 3: Check Job Status');
    console.log('-'.repeat(80));
    await sleep(1000);
    const statusResponse = await fetch(`${API_URL}/agent/queue/job/${jobId1}`);
    const statusData = await statusResponse.json();
    console.log('Job ID:', statusData.job.id);
    console.log('Status:', statusData.job.status);
    console.log('Progress:', statusData.job.progress + '%');

    // Test 4: Wait for Result
    console.log('\n📋 Test 4: Wait for Job Result');
    console.log('-'.repeat(80));
    const result1 = await pollJobResult(jobId1);
    console.log('\n✅ Job completed!');
    console.log('Response:', result1.response.substring(0, 200) + '...');
    console.log('Processing Time:', result1.processingTime + 'ms');

    // Test 5: Queue with Conversation History
    console.log('\n📋 Test 5: Queue with Conversation History');
    console.log('-'.repeat(80));
    const historyResponse = await fetch(`${API_URL}/agent/queue/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Tell me more about the first deal',
        sessionId: 'test_session',
        conversationHistory: [
          {
            role: 'user',
            content: 'What deals did Mark Cuban make?'
          },
          {
            role: 'assistant',
            content: 'Mark Cuban has made several deals...'
          }
        ],
        userId: 'test_user'
      })
    });
    const historyData = await historyResponse.json();
    console.log('Job queued:', historyData.jobId);
    
    const jobId2 = historyData.jobId;
    const result2 = await pollJobResult(jobId2);
    console.log('\n✅ Job completed!');
    console.log('Response:', result2.response.substring(0, 200) + '...');

    // Test 6: Batch Processing
    console.log('\n📋 Test 6: Batch Processing');
    console.log('-'.repeat(80));
    const batchResponse = await fetch(`${API_URL}/agent/queue/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { message: 'Show me food companies' },
          { message: 'Calculate 100000 / 0.10' }
        ],
        userId: 'test_user'
      })
    });
    const batchData = await batchResponse.json();
    console.log('Batch job queued:', batchData.jobId);
    console.log('Message count:', batchData.messageCount);
    
    const jobId3 = batchData.jobId;
    const result3 = await pollJobResult(jobId3);
    console.log('\n✅ Batch job completed!');
    console.log('Results count:', result3.length);

    // Test 7: Get Queue Stats
    console.log('\n📋 Test 7: Queue Statistics');
    console.log('-'.repeat(80));
    const statsResponse = await fetch(`${API_URL}/agent/queue/stats`);
    const statsData = await statsResponse.json();
    console.log('Waiting:', statsData.stats.waiting);
    console.log('Active:', statsData.stats.active);
    console.log('Completed:', statsData.stats.completed);
    console.log('Failed:', statsData.stats.failed);
    console.log('Total:', statsData.stats.total);

    // Test 8: Get Recent Jobs
    console.log('\n📋 Test 8: Recent Jobs');
    console.log('-'.repeat(80));
    const jobsResponse = await fetch(`${API_URL}/agent/queue/jobs?limit=5`);
    const jobsData = await jobsResponse.json();
    console.log('Recent jobs count:', jobsData.count);
    jobsData.jobs.forEach((job, i) => {
      console.log(`\n  ${i + 1}. Job ${job.id}`);
      console.log(`     Status: ${job.status}`);
      console.log(`     Message: ${job.data.message?.substring(0, 50)}...`);
    });

    // Test 9: Cancel a Job (queue a new one first)
    console.log('\n📋 Test 9: Cancel Job');
    console.log('-'.repeat(80));
    const cancelTestResponse = await fetch(`${API_URL}/agent/queue/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'This job will be cancelled',
        userId: 'test_user'
      })
    });
    const cancelTestData = await cancelTestResponse.json();
    const jobIdToCancel = cancelTestData.jobId;
    console.log('Job queued for cancellation:', jobIdToCancel);
    
    // Try to cancel immediately
    const cancelResponse = await fetch(`${API_URL}/agent/queue/job/${jobIdToCancel}`, {
      method: 'DELETE'
    });
    const cancelData = await cancelResponse.json();
    console.log('Cancel result:', cancelData.message);

    console.log('\n' + '='.repeat(80));
    console.log('✅ All queue tests completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Error during testing:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. Server is running on http://localhost:3000');
    console.log('   2. Redis is running (redis-server)');
    console.log('   3. Agent is properly configured\n');
  }
}

// Run the tests
testQueue();
