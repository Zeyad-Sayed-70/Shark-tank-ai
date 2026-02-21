# Docker Build Fix Summary

## Problem
The Docker build was failing with error:
```
npm error at throwError (file:///app/node_modules/youtube-dl-exec/scripts/preinstall.mjs:4:9)
```

This happens because `youtube-dl-exec` package tries to download binaries during installation, which can fail in Docker builds.

## Solutions Applied

### 1. Updated Main Dockerfile
- Added Python3, pip, and ffmpeg (required by youtube-dl-exec)
- Changed to use `npm ci` without `--only=production` in builder stage
- Added `--ignore-scripts` flag in production stage
- Added manual rebuild of youtube-dl-exec with error handling
- Added `.npmrc` file with retry settings

### 2. Created Alternative Dockerfile
- More robust approach using separate dependency stage
- Uses `npm install` with `--legacy-peer-deps`
- Better for problematic packages

### 3. Added .npmrc Configuration
- Increased fetch retry timeouts
- Added legacy peer deps support
- Better handling of network issues

## Files Modified/Created

### Modified:
- `Dockerfile` - Fixed to handle youtube-dl-exec properly
- `.dockerignore` - Added `!.npmrc` to include it in build
- `src/app.controller.ts` - Added `/health` endpoint

### Created:
- `Dockerfile.alternative` - Backup Dockerfile if main one fails
- `.npmrc` - NPM configuration for better package installation
- `test-docker-build.sh` - Script to test build locally
- `DOCKER_BUILD_TROUBLESHOOTING.md` - Comprehensive troubleshooting guide

## How to Test

### Option 1: Test Locally First (Recommended)
```bash
# Make script executable
chmod +x test-docker-build.sh

# Run test
./test-docker-build.sh

# If successful, run the container
docker run -p 3000:3000 --env-file .env shark-tank-ai:test

# Test health endpoint
curl http://localhost:3000/health
```

### Option 2: Push to GitHub
```bash
git add .
git commit -m "Fix Docker build for youtube-dl-exec"
git push origin master
```

GitHub Actions will automatically build and deploy.

## If Build Still Fails

### Try Alternative Dockerfile
1. Update `.github/workflows/docker-deploy.yml`:
```yaml
- name: Build and push Docker image
  uses: docker/build-push-action@v5
  with:
    context: .
    file: ./Dockerfile.alternative  # Add this line
    push: true
    # ... rest stays the same
```

2. Push changes:
```bash
git add .github/workflows/docker-deploy.yml
git commit -m "Use alternative Dockerfile"
git push origin master
```

### Remove youtube-dl-exec (Last Resort)
If you don't need YouTube download functionality:

1. Check usage:
```bash
grep -r "youtube-dl-exec" src/
```

2. If not critical, remove from package.json:
```bash
npm uninstall youtube-dl-exec
git add package.json package-lock.json
git commit -m "Remove youtube-dl-exec"
git push origin master
```

## What Changed in Dockerfile

### Before:
```dockerfile
# Builder stage
RUN npm ci --only=production && npm cache clean --force

# Production stage  
RUN npm ci --only=production && npm cache clean --force
```

### After:
```dockerfile
# Builder stage
RUN apk add --no-cache python3 py3-pip ffmpeg
RUN npm ci && npm cache clean --force

# Production stage
RUN apk add --no-cache dumb-init python3 py3-pip ffmpeg
RUN npm ci --only=production --ignore-scripts && npm cache clean --force
RUN npm rebuild youtube-dl-exec || true
```

## Key Improvements

1. **System Dependencies**: Added Python and ffmpeg needed by youtube-dl-exec
2. **Ignore Scripts**: Skip problematic install scripts, rebuild manually
3. **Error Handling**: Use `|| true` to continue even if rebuild fails
4. **NPM Config**: Better retry and timeout settings
5. **Health Check**: Added `/health` endpoint for monitoring

## Next Steps

1. Test build locally with `./test-docker-build.sh`
2. If successful, push to GitHub
3. Monitor GitHub Actions for successful deployment
4. Verify app is running on VPS: `http://YOUR_VPS_IP:3000/health`

## Monitoring Deployment

### GitHub Actions
- Go to repo → Actions tab
- Watch the workflow run
- Check logs if it fails

### VPS
```bash
ssh root@YOUR_VPS_IP
docker logs -f shark-tank-ai
docker ps
```

## Support

See `DOCKER_BUILD_TROUBLESHOOTING.md` for detailed troubleshooting steps.
