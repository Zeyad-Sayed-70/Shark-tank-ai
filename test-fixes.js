const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testTermSheet() {
  console.log('\n=== Testing Term Sheet Endpoint ===');
  try {
    // Test with a known company
    const response = await axios.get(`${BASE_URL}/deals/Scrub%20Daddy/termsheet`);
    console.log('✅ Term Sheet Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.log('❌ Term Sheet Error:', error.response.status, error.response.data);
    } else {
      console.log('❌ Term Sheet Error:', error.message);
    }
  }
}

async function testSharkDeals() {
  console.log('\n=== Testing Shark Deals Endpoint ===');
  try {
    // Test with Mark Cuban
    const response = await axios.get(`${BASE_URL}/sharks/mark-cuban/deals?limit=5`);
    console.log('✅ Shark Deals Response:');
    console.log('  Success:', response.data.success);
    console.log('  Shark ID:', response.data.sharkId);
    console.log('  Count:', response.data.count);
    console.log('  Deals:', JSON.stringify(response.data.deals, null, 2));
  } catch (error) {
    if (error.response) {
      console.log('❌ Shark Deals Error:', error.response.status, error.response.data);
    } else {
      console.log('❌ Shark Deals Error:', error.message);
    }
  }
}

async function testAllSharks() {
  console.log('\n=== Testing All Sharks Deals ===');
  const sharks = ['mark-cuban', 'lori-greiner', 'kevin-oleary', 'barbara-corcoran', 'robert-herjavec', 'daymond-john'];
  
  for (const sharkId of sharks) {
    try {
      const response = await axios.get(`${BASE_URL}/sharks/${sharkId}/deals?limit=3`);
      console.log(`✅ ${sharkId}: ${response.data.count} deals found`);
      if (response.data.count > 0) {
        console.log(`   First deal: ${response.data.deals[0].company}`);
      }
    } catch (error) {
      console.log(`❌ ${sharkId}: ${error.message}`);
    }
  }
}

async function runTests() {
  console.log('Starting tests...');
  console.log('Make sure the server is running on', BASE_URL);
  
  await testTermSheet();
  await testSharkDeals();
  await testAllSharks();
  
  console.log('\n=== Tests Complete ===');
}

runTests().catch(console.error);
