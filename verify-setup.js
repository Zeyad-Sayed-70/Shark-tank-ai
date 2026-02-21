// Verify Ollama and system setup
async function verifySetup() {
  console.log('🔍 Verifying Shark Tank AI Setup...\n');

  // 1. Check Ollama
  console.log('1. Checking Ollama...');
  try {
    const ollamaResponse = await fetch('http://localhost:11434/api/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mxbai-embed-large',
        input: 'test',
      }),
    });

    if (ollamaResponse.ok) {
      const data = await ollamaResponse.json();
      const embedding = data.embeddings?.[0] || data.embedding;
      console.log(`   ✅ Ollama working (${embedding.length} dimensions)\n`);
    } else {
      console.log(`   ❌ Ollama error: ${ollamaResponse.status}\n`);
    }
  } catch (error) {
    console.log(`   ❌ Ollama not running: ${error.message}\n`);
  }

  // 2. Check NestJS backend
  console.log('2. Checking NestJS backend...');
  try {
    const healthResponse = await fetch('http://localhost:3000/');
    if (healthResponse.ok) {
      console.log('   ✅ Backend is running\n');
    } else {
      console.log('   ❌ Backend returned error\n');
    }
  } catch (error) {
    console.log('   ❌ Backend not running - Start with: npm run start:dev\n');
  }

  // 3. Check MongoDB connection
  console.log('3. Checking MongoDB...');
  try {
    const { MongoClient } = require('mongodb');
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    const db = client.db('playlist_automation');
    const tasks = await db.collection('tasks').countDocuments({ status: 'completed' });
    console.log(`   ✅ MongoDB connected (${tasks} completed tasks)\n`);
    await client.close();
  } catch (error) {
    console.log(`   ❌ MongoDB error: ${error.message}\n`);
  }

  console.log('📋 Next Steps:');
  console.log('   1. Start backend: npm run start:dev');
  console.log('   2. Backend will auto-recreate Qdrant collection with 1024 dimensions');
  console.log('   3. Task-embedder will automatically embed completed tasks every 5 minutes');
  console.log('   4. Or manually trigger: POST http://localhost:3000/task-embedder/process');
}

verifySetup().catch(console.error);
