// Reset all embedded flags in MongoDB
const { MongoClient } = require('mongodb');

async function resetEmbeddings() {
  const uri = 'mongodb://localhost:27017';
  const dbName = 'playlist_automation';
  const collectionName = 'tasks';

  console.log('🔄 Resetting embedded flags in MongoDB...\n');

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Count tasks before reset
    const totalTasks = await collection.countDocuments({ status: 'completed' });
    const embeddedTasks = await collection.countDocuments({ 
      status: 'completed', 
      embedded: true 
    });

    console.log(`📊 Current Status:`);
    console.log(`   Total completed tasks: ${totalTasks}`);
    console.log(`   Already embedded: ${embeddedTasks}`);
    console.log(`   Not embedded: ${totalTasks - embeddedTasks}\n`);

    // Reset all embedded flags
    const result = await collection.updateMany(
      { status: 'completed', embedded: true },
      { 
        $set: { embedded: false },
        $unset: { embedded_at: '' }
      }
    );

    console.log(`✅ Reset complete!`);
    console.log(`   Modified ${result.modifiedCount} tasks`);
    console.log(`   All ${totalTasks} completed tasks are now ready for re-embedding\n`);

    console.log('📋 Next Steps:');
    console.log('   1. Start Ollama: ollama serve');
    console.log('   2. Start backend: npm run start:dev');
    console.log('   3. Task-embedder will automatically process all tasks');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n✅ MongoDB connection closed');
  }
}

resetEmbeddings().catch(console.error);
