// Test Ollama embeddings
async function testOllamaEmbeddings() {
  try {
    console.log('Testing Ollama mxbai-embed-large embeddings...\n');

    const response = await fetch('http://localhost:11434/api/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mxbai-embed-large',
        input: 'This is a test of the Shark Tank AI embedding system',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const embedding = data.embeddings?.[0] || data.embedding;

    console.log('✅ Success!');
    console.log(`Embedding dimensions: ${embedding.length}`);
    console.log(`First 10 values: [${embedding.slice(0, 10).map(v => v.toFixed(4)).join(', ')}...]`);
    console.log(`\nOllama is working correctly with mxbai-embed-large!`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testOllamaEmbeddings();
