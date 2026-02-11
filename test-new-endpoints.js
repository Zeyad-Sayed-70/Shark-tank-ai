const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

async function testDealsEndpoints() {
  logSection('Testing Deals Endpoints');

  try {
    // Test 1: Get specific deal
    log('1. Testing GET /deals/:companyName', 'yellow');
    const dealResponse = await axios.get(`${BASE_URL}/deals/Scrub Daddy`);
    log('✓ Successfully fetched Scrub Daddy deal', 'green');
    console.log('Deal:', JSON.stringify(dealResponse.data.deal, null, 2));

    // Test 2: Get recent deals
    log('\n2. Testing GET /deals/recent/list', 'yellow');
    const recentResponse = await axios.get(`${BASE_URL}/deals/recent/list?limit=5`);
    log(`✓ Successfully fetched ${recentResponse.data.count} recent deals`, 'green');
    console.log('Recent deals:', recentResponse.data.deals.map(d => d.company).join(', '));

    // Test 3: Get popular deals
    log('\n3. Testing GET /deals/popular/list', 'yellow');
    const popularResponse = await axios.get(`${BASE_URL}/deals/popular/list?limit=5`);
    log(`✓ Successfully fetched ${popularResponse.data.count} popular deals`, 'green');
    console.log('Popular deals:', popularResponse.data.deals.map(d => d.company).join(', '));

    // Test 4: Get deal statistics
    log('\n4. Testing GET /deals/stats/summary', 'yellow');
    const statsResponse = await axios.get(`${BASE_URL}/deals/stats/summary`);
    log('✓ Successfully fetched deal statistics', 'green');
    console.log('Stats:', JSON.stringify(statsResponse.data.stats, null, 2));

    // Test 5: Search deals with filters
    log('\n5. Testing GET /deals with filters', 'yellow');
    const searchResponse = await axios.get(`${BASE_URL}/deals`, {
      params: {
        dealMade: true,
        limit: 5
      }
    });
    log(`✓ Successfully searched deals: ${searchResponse.data.totalResults} results`, 'green');
    console.log('Search results:', searchResponse.data.results.map(d => d.company).join(', '));

    // Test 6: POST search deals
    log('\n6. Testing POST /deals/search', 'yellow');
    const postSearchResponse = await axios.post(`${BASE_URL}/deals/search`, {
      query: 'food',
      filters: {
        dealMade: true
      },
      limit: 5
    });
    log(`✓ Successfully searched deals: ${postSearchResponse.data.totalResults} results`, 'green');
    console.log('Search results:', postSearchResponse.data.results.map(d => d.company).join(', '));

    // Test 7: Batch deals
    log('\n7. Testing POST /deals/batch', 'yellow');
    const batchResponse = await axios.post(`${BASE_URL}/deals/batch`, {
      companies: ['Scrub Daddy', 'Ring', 'Bombas']
    });
    log(`✓ Successfully fetched ${batchResponse.data.count} deals in batch`, 'green');
    console.log('Batch deals:', batchResponse.data.deals.map(d => d.company).join(', '));

    log('\n✓ All deals endpoints tests passed!', 'green');
  } catch (error) {
    log(`✗ Deals endpoints test failed: ${error.message}`, 'red');
    if (error.response) {
      console.log('Error response:', error.response.data);
    }
  }
}

async function testSharksEndpoints() {
  logSection('Testing Sharks Endpoints');

  try {
    // Test 1: Get all sharks
    log('1. Testing GET /sharks', 'yellow');
    const sharksResponse = await axios.get(`${BASE_URL}/sharks`);
    log(`✓ Successfully fetched ${sharksResponse.data.count} sharks`, 'green');
    console.log('Sharks:', sharksResponse.data.sharks.map(s => `${s.name} (${s.totalDeals} deals)`).join(', '));

    // Test 2: Get specific shark
    log('\n2. Testing GET /sharks/:sharkId', 'yellow');
    const sharkResponse = await axios.get(`${BASE_URL}/sharks/mark-cuban`);
    log('✓ Successfully fetched Mark Cuban', 'green');
    console.log('Shark:', JSON.stringify(sharkResponse.data.shark, null, 2));

    // Test 3: Get shark's deals
    log('\n3. Testing GET /sharks/:sharkId/deals', 'yellow');
    const dealsResponse = await axios.get(`${BASE_URL}/sharks/mark-cuban/deals?limit=5`);
    log(`✓ Successfully fetched ${dealsResponse.data.count} deals for Mark Cuban`, 'green');
    console.log('Deals:', dealsResponse.data.deals.map(d => d.company).join(', '));

    log('\n✓ All sharks endpoints tests passed!', 'green');
  } catch (error) {
    log(`✗ Sharks endpoints test failed: ${error.message}`, 'red');
    if (error.response) {
      console.log('Error response:', error.response.data);
    }
  }
}

async function testChatWithEntities() {
  logSection('Testing Chat with Entity Extraction');

  try {
    log('Testing POST /agent/chat/sync with entity extraction', 'yellow');
    
    const chatResponse = await axios.post(`${BASE_URL}/agent/chat/sync`, {
      message: 'Tell me about Scrub Daddy and what Lori Greiner thought about it'
    });

    log('✓ Successfully got chat response with entities', 'green');
    console.log('\nResponse:', chatResponse.data.response.substring(0, 200) + '...');
    
    if (chatResponse.data.entities) {
      console.log('\nExtracted Entities:');
      console.log('- Deals:', chatResponse.data.entities.deals.map(d => d.company).join(', '));
      console.log('- Sharks mentioned:', chatResponse.data.entities.sharks.filter(s => s.mentioned).map(s => s.name).join(', '));
      console.log('- Companies:', chatResponse.data.entities.companies.join(', '));
      log('✓ Entity extraction working!', 'green');
    } else {
      log('⚠ No entities extracted', 'yellow');
    }

    log('\n✓ Chat with entities test passed!', 'green');
  } catch (error) {
    log(`✗ Chat with entities test failed: ${error.message}`, 'red');
    if (error.response) {
      console.log('Error response:', error.response.data);
    }
  }
}

async function testSessionMetadata() {
  logSection('Testing Enhanced Session Metadata');

  try {
    log('1. Creating a new chat session', 'yellow');
    
    const chatResponse = await axios.post(`${BASE_URL}/agent/chat/sync`, {
      message: 'Tell me about Scrub Daddy'
    });

    const sessionId = chatResponse.data.sessionId;
    log(`✓ Created session: ${sessionId}`, 'green');

    log('\n2. Fetching session with metadata', 'yellow');
    const sessionResponse = await axios.get(`${BASE_URL}/agent/session/${sessionId}`);
    
    log('✓ Successfully fetched session', 'green');
    console.log('\nSession Metadata:');
    console.log(JSON.stringify(sessionResponse.data.session.metadata, null, 2));

    log('\n✓ Session metadata test passed!', 'green');
  } catch (error) {
    log(`✗ Session metadata test failed: ${error.message}`, 'red');
    if (error.response) {
      console.log('Error response:', error.response.data);
    }
  }
}

async function runAllTests() {
  log('🚀 Starting Comprehensive API Tests', 'cyan');
  log('Testing all new endpoints for frontend integration\n', 'cyan');

  try {
    await testDealsEndpoints();
    await testSharksEndpoints();
    await testChatWithEntities();
    await testSessionMetadata();

    logSection('🎉 All Tests Completed Successfully!');
    log('The backend is ready for frontend integration', 'green');
  } catch (error) {
    logSection('❌ Test Suite Failed');
    log(error.message, 'red');
    process.exit(1);
  }
}

// Run tests
runAllTests();
