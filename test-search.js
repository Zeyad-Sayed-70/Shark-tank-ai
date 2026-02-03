// Quick test script for search endpoint
// Run with: node test-search.js

const API_URL = 'http://localhost:3000';

async function testSearch(query) {
  console.log('\n' + '='.repeat(80));
  console.log(`Testing Query: "${query}"`);
  console.log('='.repeat(80));

  try {
    const response = await fetch(`${API_URL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();

    console.log('\n📊 INTENT CLASSIFICATION:');
    console.log(`   Type: ${data.intent.type}`);
    console.log(`   Search Term: "${data.intent.search_term}"`);
    console.log('\n   Filters:');
    console.log(`   - Investor: ${data.intent.filters.investor_name || '(none)'}`);
    console.log(`   - Industry: ${data.intent.filters.industry || '(none)'}`);
    console.log(`   - Deal Made: ${data.intent.filters.deal_made}`);
    console.log(`   - Valuation GT: $${data.intent.filters.valuation_gt.toLocaleString()}`);
    console.log(`   - Valuation LT: $${data.intent.filters.valuation_lt.toLocaleString()}`);

    console.log(`\n🔍 RESULTS: ${data.count} pitch(es) found`);

    if (data.count > 0) {
      data.results.forEach((pitch, i) => {
        console.log(`\n   ${i + 1}. ${pitch.company}`);
        console.log(`      Entrepreneur: ${pitch.entrepreneur}`);
        console.log(`      Season ${pitch.season}, Episode ${pitch.episode}`);
        console.log(`      Ask: $${pitch.ask_amount.toLocaleString()} for ${pitch.equity_offered}% equity`);
        console.log(`      Valuation: $${pitch.valuation.toLocaleString()}`);
        console.log(`      Industry: ${pitch.industry}`);
        console.log(`      Deal: ${pitch.deal_made ? `✅ Yes with ${pitch.investor_name}` : '❌ No'}`);
        console.log(`      Summary: ${pitch.parent_summary?.substring(0, 150)}...`);
      });
    } else {
      console.log('   ⚠️  No results found. Make sure you have ingested data first!');
    }

    console.log('\n' + '='.repeat(80) + '\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure the server is running on http://localhost:3000\n');
  }
}

async function runTests() {
  console.log('\n🚀 Starting Shark Tank Search Tests...\n');

  // Test 1: FACTUAL - Specific Investor
  await testSearch('Show me all Mark Cuban deals');

  // Test 2: FACTUAL - Valuation Filter
  await testSearch('Find companies with valuation over $1 million');

  // Test 3: SEMANTIC - Concept-based
  await testSearch('Show me emotional food pitches that failed');

  // Test 4: HYBRID - Investor + Concept
  await testSearch("Kevin O'Leary's royalty deal arguments");

  // Test 5: Industry Filter
  await testSearch('Show me all tech companies');

  // Test 6: Deal Status
  await testSearch('Which pitches got deals?');

  console.log('✅ All tests completed!\n');
}

// Run the tests
runTests().catch(console.error);
