/**
 * Redis Connection Checker
 * 
 * This script checks if Redis is running and provides instructions if not.
 */

const net = require('net');

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;

function checkRedis() {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    
    client.setTimeout(3000);
    
    client.on('connect', () => {
      console.log('✅ Redis is running!');
      console.log(`   Host: ${REDIS_HOST}`);
      console.log(`   Port: ${REDIS_PORT}`);
      client.destroy();
      resolve(true);
    });
    
    client.on('timeout', () => {
      console.error('❌ Redis connection timeout');
      client.destroy();
      reject(new Error('Connection timeout'));
    });
    
    client.on('error', (err) => {
      console.error('❌ Redis is not running or not accessible');
      console.error(`   Error: ${err.message}`);
      client.destroy();
      reject(err);
    });
    
    client.connect(REDIS_PORT, REDIS_HOST);
  });
}

async function main() {
  console.log('Checking Redis connection...\n');
  
  try {
    await checkRedis();
    console.log('\n✅ Redis is ready for use!');
    console.log('\nYou can now start the application:');
    console.log('   npm run start:dev');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Redis is not available!');
    console.error('\nPlease start Redis using one of these methods:\n');
    console.error('1. Using Docker (Recommended):');
    console.error('   docker run -d -p 6379:6379 --name redis redis:alpine\n');
    console.error('2. Using local installation:');
    console.error('   Windows: redis-server');
    console.error('   macOS: brew services start redis');
    console.error('   Linux: sudo systemctl start redis-server\n');
    console.error('3. Using WSL (Windows):');
    console.error('   wsl -e sudo service redis-server start\n');
    console.error('After starting Redis, run this script again to verify.');
    process.exit(1);
  }
}

main();
