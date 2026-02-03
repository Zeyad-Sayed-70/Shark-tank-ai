# Install Queue Dependencies

## Required Dependencies

To use the queue-based AI agent, you need to install the following dependencies:

### 1. Install Bull and NestJS Bull Module

```bash
npm install @nestjs/bull bull
```

Or with yarn:

```bash
yarn add @nestjs/bull bull
```

### 2. Install Type Definitions

```bash
npm install --save-dev @types/bull
```

Or with yarn:

```bash
yarn add -D @types/bull
```

### 3. Install and Start Redis

The queue system requires Redis to be running.

#### On Windows (using Chocolatey):
```bash
choco install redis-64
redis-server
```

#### On Windows (using WSL):
```bash
wsl
sudo apt-get update
sudo apt-get install redis-server
sudo service redis-server start
```

#### On macOS (using Homebrew):
```bash
brew install redis
brew services start redis
```

#### On Linux (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis-server
```

#### Using Docker:
```bash
docker run -d -p 6379:6379 redis:alpine
```

### 4. Verify Redis is Running

```bash
redis-cli ping
```

Expected output: `PONG`

## Configuration

Add Redis configuration to your `.env` file:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

## Verify Installation

After installing dependencies and starting Redis:

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Start the server:**
   ```bash
   npm run start:dev
   ```

3. **Run the test script:**
   ```bash
   node test-agent-queue.js
   ```

## Troubleshooting

### Error: Cannot find module '@nestjs/bull'
**Solution:** Run `npm install @nestjs/bull bull`

### Error: Cannot find module 'bull'
**Solution:** Run `npm install bull`

### Error: Redis connection refused
**Solution:** 
- Check if Redis is running: `redis-cli ping`
- Start Redis: `redis-server` or `sudo service redis-server start`
- Check Redis host/port in `.env` file

### Error: ECONNREFUSED 127.0.0.1:6379
**Solution:**
- Redis is not running. Start it with `redis-server`
- Check firewall settings
- Verify Redis port in `.env` matches running instance

## Complete Installation Script

Run this script to install everything:

```bash
# Install dependencies
npm install @nestjs/bull bull
npm install --save-dev @types/bull

# Start Redis (choose one based on your system)
# Windows (WSL): wsl -e sudo service redis-server start
# macOS: brew services start redis
# Linux: sudo systemctl start redis-server
# Docker: docker run -d -p 6379:6379 redis:alpine

# Verify Redis
redis-cli ping

# Build and start
npm run build
npm run start:dev
```

## Package.json Updates

After installation, your `package.json` should include:

```json
{
  "dependencies": {
    "@nestjs/bull": "^10.0.1",
    "bull": "^4.12.0",
    // ... other dependencies
  },
  "devDependencies": {
    "@types/bull": "^4.10.0",
    // ... other dev dependencies
  }
}
```

## Next Steps

Once dependencies are installed:

1. ✅ Redis is running
2. ✅ Dependencies installed
3. ✅ Server starts without errors
4. ✅ Run test script: `node test-agent-queue.js`
5. ✅ Check queue stats: `curl http://localhost:3000/agent/queue/stats`

## Optional: Redis GUI Tools

For easier Redis monitoring:

- **RedisInsight** (Official): https://redis.com/redis-enterprise/redis-insight/
- **Redis Commander**: `npm install -g redis-commander && redis-commander`
- **Medis** (macOS): https://getmedis.com/

## Support

If you encounter issues:
1. Verify Redis is running: `redis-cli ping`
2. Check server logs for errors
3. Verify all dependencies are installed: `npm list @nestjs/bull bull`
4. Check Redis connection in `.env` file
