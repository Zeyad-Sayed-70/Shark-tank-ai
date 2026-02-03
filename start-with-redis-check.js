/**
 * Startup Script with Redis Check
 * 
 * This script checks if Redis is running before starting the application.
 */

const { spawn } = require('child_process');
const net = require('net');

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;

function checkRedis() {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    
    client.setTimeout(3000);
    
    client.on('connect', () => {
      console.log('✅ Redis is running');
      client.destroy();
      resolve(true);
    });
    
    client.on('timeout', () => {
      client.destroy();
      reject(new Error('Connection timeout'));
    });
    
    client.on('error', (err) => {
      client.destroy();
      reject(err);
    });
    
    client.connect(REDIS_PORT, REDIS_HOST);
  });
}

async function startApplication() {
  console.log('🚀 Starting Shark Tank AI Agent...\n');
  console.log('Checking Redis connection...');
  
  try {
    await checkRedis();
    console.log(`   Host: ${REDIS_HOST}`);
    console.log(`   Port: ${REDIS_PORT}\n`);
    
    console.log('Starting NestJS application...\n');
    
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const app = spawn(npm, ['run', 'start:dev'], {
      stdio: 'inherit',
      shell: true
    });
    
    app.on('error', (error) => {
      console.error('❌ Failed to start application:', error);
      process.exit(1);
    });
    
    app.on('exit', (code) => {
      if (code !== 0) {
        console.error(`❌ Application exited with code ${code}`);
        process.exit(code);
      }
    });
    
  } catch (error) {
    console.error('\n❌ Redis is not running!');
    console.error(`   Error: ${error.message}\n`);
    console.error('Please start Redis first:\n');
    console.error('1. Using Docker (Recommended):');
    console.error('   docker run -d -p 6379:6379 --name redis redis:alpine\n');
    console.error('2. Using local installation:');
    console.error('   Windows: redis-server');
    console.error('   macOS: brew services start redis');
    console.error('   Linux: sudo systemctl start redis-server\n');
    console.error('3. Using WSL (Windows):');
    console.error('   wsl -e sudo service redis-server start\n');
    process.exit(1);
  }
}

startApplication();
