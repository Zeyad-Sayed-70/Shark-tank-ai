// Test script for Shark Tank AI Agent
// Run with: node test-agent.js

const API_URL = 'http://localhost:3000';

async function testAgent() {
  console.log('🚀 Starting Shark Tank AI Agent Tests\n');
  console.log('='.repeat(80));

  try {
    // Test 1: Health Check
    console.log('\n📋 Test 1: Health Check');
    console.log('-'.repeat(80));
    const healthResponse = await fetch(`${API_URL}/agent/health`);
    const healthData = await healthResponse.json();
    console.log('Status:', healthData.status);
    console.log('Service:', healthData.service);

    // Test 2: Simple Query - Investor Deals
    console.log('\n📋 Test 2: Query About Investor Deals');
    console.log('-'.repeat(80));
    const response1 = await fetch(`${API_URL}/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What deals did Mark Cuban make?'
      })
    });
    const data1 = await response1.json();
    console.log('User: What deals did Mark Cuban make?');
    console.log('\nAgent:', data1.response.substring(0, 300) + '...');
    console.log('\nSession ID:', data1.sessionId);
    const sessionId = data1.sessionId;

    // Test 3: Follow-up Question (Context)
    console.log('\n📋 Test 3: Follow-up Question (Testing Context)');
    console.log('-'.repeat(80));
    const response2 = await fetch(`${API_URL}/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Tell me more about the first deal',
        sessionId: sessionId
      })
    });
    const data2 = await response2.json();
    console.log('User: Tell me more about the first deal');
    console.log('\nAgent:', data2.response.substring(0, 300) + '...');

    // Test 4: Calculation
    console.log('\n📋 Test 4: Financial Calculation');
    console.log('-'.repeat(80));
    const response3 = await fetch(`${API_URL}/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'If I ask for $200,000 for 20% equity, what is my company valuation?'
      })
    });
    const data3 = await response3.json();
    console.log('User: If I ask for $200,000 for 20% equity, what is my company valuation?');
    console.log('\nAgent:', data3.response.substring(0, 300) + '...');

    // Test 5: Current Company Status (Internet Search)
    console.log('\n📋 Test 5: Current Company Status (Internet Search)');
    console.log('-'.repeat(80));
    const response4 = await fetch(`${API_URL}/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What is Scrub Daddy doing now?'
      })
    });
    const data4 = await response4.json();
    console.log('User: What is Scrub Daddy doing now?');
    console.log('\nAgent:', data4.response.substring(0, 300) + '...');

    // Test 6: Industry Query
    console.log('\n📋 Test 6: Industry-Specific Query');
    console.log('-'.repeat(80));
    const response5 = await fetch(`${API_URL}/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Show me food companies that got deals'
      })
    });
    const data5 = await response5.json();
    console.log('User: Show me food companies that got deals');
    console.log('\nAgent:', data5.response.substring(0, 300) + '...');

    // Test 7: Get Session Info
    console.log('\n📋 Test 7: Get Session Information');
    console.log('-'.repeat(80));
    const sessionResponse = await fetch(`${API_URL}/agent/session/${sessionId}`);
    const sessionData = await sessionResponse.json();
    console.log('Session ID:', sessionData.session.sessionId);
    console.log('Message Count:', sessionData.session.messages.length);
    console.log('Created At:', sessionData.session.createdAt);

    // Test 8: Get Stats
    console.log('\n📋 Test 8: Agent Statistics');
    console.log('-'.repeat(80));
    const statsResponse = await fetch(`${API_URL}/agent/stats`);
    const statsData = await statsResponse.json();
    console.log('Total Sessions:', statsData.stats.totalSessions);
    console.log('Active Sessions:', statsData.stats.activeSessions);
    console.log('Total Messages:', statsData.stats.totalMessages);

    console.log('\n' + '='.repeat(80));
    console.log('✅ All tests completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Error during testing:', error.message);
    console.log('\n💡 Make sure the server is running on http://localhost:3000\n');
  }
}

// Run the tests
testAgent();
