# Queue System Deployment Checklist

Use this checklist to ensure the queue system is properly deployed and configured.

## Pre-Deployment

### 1. Dependencies Installation

- [ ] Install Bull packages
  ```bash
  npm install @nestjs/bull bull
  npm install --save-dev @types/bull
  ```

- [ ] Verify installation
  ```bash
  npm list @nestjs/bull bull
  ```

### 2. Redis Setup

- [ ] Install Redis
  - [ ] Windows: `choco install redis-64`
  - [ ] macOS: `brew install redis`
  - [ ] Linux: `sudo apt-get install redis-server`
  - [ ] Docker: `docker run -d -p 6379:6379 redis:alpine`

- [ ] Start Redis
  ```bash
  redis-server
  ```

- [ ] Verify Redis is running
  ```bash
  redis-cli ping
  # Expected: PONG
  ```

### 3. Environment Configuration

- [ ] Create/update `.env` file
  ```env
  REDIS_HOST=localhost
  REDIS_PORT=6379
  REDIS_PASSWORD=
  ```

- [ ] Verify environment variables are loaded
  ```bash
  # In your app
  console.log(process.env.REDIS_HOST);
  ```

### 4. Code Verification

- [ ] No TypeScript errors
  ```bash
  npm run build
  ```

- [ ] All tests pass
  ```bash
  npm test
  ```

## Deployment

### 1. Build Application

- [ ] Clean build
  ```bash
  rm -rf dist
  npm run build
  ```

- [ ] Verify build output
  ```bash
  ls dist/
  ```

### 2. Start Application

- [ ] Start in development mode
  ```bash
  npm run start:dev
  ```

- [ ] Start in production mode
  ```bash
  npm run start:prod
  ```

- [ ] Verify server is running
  ```bash
  curl http://localhost:3000/agent/health
  ```

### 3. Verify Queue System

- [ ] Check queue health
  ```bash
  curl http://localhost:3000/agent/queue/health
  ```

- [ ] Check queue stats
  ```bash
  curl http://localhost:3000/agent/queue/stats
  ```

## Post-Deployment Testing

### 1. Basic Functionality

- [ ] Test async queue
  ```bash
  curl -X POST http://localhost:3000/agent/chat \
    -H "Content-Type: application/json" \
    -d '{"message": "Test message"}'
  ```

- [ ] Test sync queue
  ```bash
  curl -X POST http://localhost:3000/agent/chat/sync \
    -H "Content-Type: application/json" \
    -d '{"message": "Test message"}'
  ```

- [ ] Test legacy mode
  ```bash
  curl -X POST http://localhost:3000/agent/chat \
    -H "Content-Type: application/json" \
    -d '{"message": "Test message", "useQueue": false}'
  ```

### 2. Job Management

- [ ] Submit a job and get job ID
- [ ] Check job status
  ```bash
  curl http://localhost:3000/agent/queue/job/:jobId
  ```

- [ ] Get job result
  ```bash
  curl http://localhost:3000/agent/queue/job/:jobId/result
  ```

- [ ] Cancel a job
  ```bash
  curl -X DELETE http://localhost:3000/agent/queue/job/:jobId
  ```

### 3. Session Management

- [ ] Create a session with first message
- [ ] Send follow-up message with session ID
- [ ] Verify conversation context is maintained
- [ ] Check session endpoint
  ```bash
  curl http://localhost:3000/agent/session/:sessionId
  ```

### 4. Error Handling

- [ ] Test with invalid message (empty string)
- [ ] Test with non-existent job ID
- [ ] Test with invalid session ID
- [ ] Verify error responses are proper

### 5. Performance Testing

- [ ] Run test script
  ```bash
  node test-agent-queue.js
  ```

- [ ] Monitor queue stats during load
- [ ] Check for memory leaks
- [ ] Verify job completion times

## Monitoring Setup

### 1. Queue Monitoring

- [ ] Set up queue stats endpoint monitoring
- [ ] Configure alerts for:
  - [ ] High queue depth (waiting > 100)
  - [ ] High failure rate (failed > 10%)
  - [ ] No active workers
  - [ ] Redis connection issues

### 2. Application Monitoring

- [ ] Set up application logs
- [ ] Configure error tracking
- [ ] Monitor response times
- [ ] Track job processing times

### 3. Redis Monitoring

- [ ] Monitor Redis memory usage
- [ ] Track Redis connection count
- [ ] Monitor Redis command latency
- [ ] Set up Redis persistence

## Production Configuration

### 1. Redis Configuration

- [ ] Enable Redis persistence (RDB/AOF)
- [ ] Set Redis password
- [ ] Configure Redis maxmemory policy
- [ ] Enable Redis TLS (if remote)

### 2. Queue Configuration

- [ ] Adjust retry attempts based on needs
- [ ] Configure job retention policy
- [ ] Set appropriate timeouts
- [ ] Configure concurrency limits

### 3. Security

- [ ] Enable Redis authentication
- [ ] Use environment variables for secrets
- [ ] Implement rate limiting
- [ ] Add request validation
- [ ] Enable CORS properly

### 4. Scaling

- [ ] Configure multiple workers (if needed)
- [ ] Set up Redis Cluster (if needed)
- [ ] Configure load balancer
- [ ] Set up auto-scaling rules

## Backup and Recovery

### 1. Redis Backup

- [ ] Configure Redis snapshots
- [ ] Set up automated backups
- [ ] Test backup restoration
- [ ] Document backup procedures

### 2. Job Recovery

- [ ] Test job recovery after restart
- [ ] Verify jobs persist in Redis
- [ ] Test retry mechanism
- [ ] Document recovery procedures

## Documentation

- [ ] Update API documentation
- [ ] Document configuration options
- [ ] Create runbook for operations
- [ ] Document troubleshooting steps
- [ ] Update deployment guide

## Rollback Plan

- [ ] Document rollback procedure
- [ ] Test rollback to direct processing
- [ ] Verify legacy mode works
- [ ] Keep old deployment artifacts

## Sign-Off

### Development Team

- [ ] Code reviewed
- [ ] Tests passed
- [ ] Documentation updated
- [ ] Signed off by: _________________ Date: _______

### Operations Team

- [ ] Infrastructure ready
- [ ] Monitoring configured
- [ ] Backup configured
- [ ] Signed off by: _________________ Date: _______

### QA Team

- [ ] Functional tests passed
- [ ] Performance tests passed
- [ ] Security tests passed
- [ ] Signed off by: _________________ Date: _______

## Post-Deployment

### Day 1

- [ ] Monitor queue stats every hour
- [ ] Check error logs
- [ ] Verify job completion rates
- [ ] Monitor Redis memory usage

### Week 1

- [ ] Review queue performance metrics
- [ ] Analyze failed jobs
- [ ] Optimize configuration if needed
- [ ] Gather user feedback

### Month 1

- [ ] Review overall system performance
- [ ] Analyze scaling needs
- [ ] Plan optimizations
- [ ] Update documentation

## Troubleshooting Reference

### Common Issues

| Issue | Check | Solution |
|-------|-------|----------|
| Jobs stuck in waiting | Redis connection | Restart Redis |
| High failure rate | Error logs | Check API keys, config |
| Slow processing | Queue stats | Add more workers |
| Memory issues | Redis memory | Increase maxmemory |
| Connection refused | Redis status | Start Redis server |

### Emergency Contacts

- **Development Lead**: ________________
- **Operations Lead**: ________________
- **On-Call Engineer**: ________________

### Useful Commands

```bash
# Check Redis
redis-cli ping
redis-cli info

# Check queue
curl http://localhost:3000/agent/queue/stats
curl http://localhost:3000/agent/queue/jobs?limit=10

# Restart services
pm2 restart shark-tank-ai
sudo systemctl restart redis

# View logs
pm2 logs shark-tank-ai
tail -f /var/log/redis/redis-server.log
```

## Notes

_Add any deployment-specific notes here_

---

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Version**: _______________  
**Environment**: _______________
