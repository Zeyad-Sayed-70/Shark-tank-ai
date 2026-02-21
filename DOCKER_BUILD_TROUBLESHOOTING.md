# Docker Build Troubleshooting

## Issue: youtube-dl-exec preinstall script fails

The `youtube-dl-exec` package downloads binaries during installation, which can fail in Docker builds.

### Solution 1: Use Updated Dockerfile (Recommended)

The main `Dockerfile` has been updated to:
1. Install Python and ffmpeg (required by youtube-dl-exec)
2. Use `--ignore-scripts` flag to skip problematic install scripts
3. Manually rebuild youtube-dl-exec after installation

Try building again:
```bash
docker build -t shark-tank-ai:test .
```

### Solution 2: Use Alternative Dockerfile

If Solution 1 doesn't work, use the alternative Dockerfile:

```bash
docker build -f Dockerfile.alternative -t shark-tank-ai:test .
```

Update GitHub Actions workflow to use alternative:
```yaml
# In .github/workflows/docker-deploy.yml
# Change the build step to:
- name: Build and push Docker image
  uses: docker/build-push-action@v5
  with:
    context: .
    file: ./Dockerfile.alternative  # Add this line
    push: true
    tags: ${{ steps.meta.outputs.tags }}
    # ... rest of config
```

### Solution 3: Remove youtube-dl-exec (if not critical)

If you're not using YouTube download functionality in production:

1. Check where it's used:
```bash
grep -r "youtube-dl-exec" src/
```

2. If it's only in development/testing, move it to devDependencies:
```json
{
  "devDependencies": {
    "youtube-dl-exec": "^3.0.30"
  }
}
```

3. Or remove it entirely if not needed

### Solution 4: Use npm install instead of npm ci

Edit Dockerfile to use `npm install` which is more forgiving:

```dockerfile
# In builder stage
RUN npm install --production=false && \
    npm cache clean --force

# In production stage
RUN npm install --only=production && \
    npm cache clean --force
```

## Testing Locally

Before pushing to GitHub, test the build locally:

```bash
# Test main Dockerfile
docker build -t shark-tank-ai:test .

# Test alternative Dockerfile
docker build -f Dockerfile.alternative -t shark-tank-ai:test .

# Run the container
docker run -p 3000:3000 --env-file .env shark-tank-ai:test

# Check if it works
curl http://localhost:3000/health
```

## Common Docker Build Issues

### Issue: "npm ERR! network"
**Solution**: Add `.npmrc` file with retry settings (already created)

### Issue: "EACCES: permission denied"
**Solution**: The Dockerfile now uses a non-root user correctly

### Issue: "Cannot find module"
**Solution**: Make sure all dependencies are in package.json, not just devDependencies

### Issue: Build is very slow
**Solution**: 
- Use BuildKit: `DOCKER_BUILDKIT=1 docker build .`
- Enable layer caching in GitHub Actions (already configured)

### Issue: "Platform mismatch" on M1/M2 Mac
**Solution**: Build for linux/amd64:
```bash
docker build --platform linux/amd64 -t shark-tank-ai:test .
```

## Verify Build Success

After successful build:

```bash
# Check image size
docker images shark-tank-ai:test

# Inspect image
docker inspect shark-tank-ai:test

# Run and check logs
docker run -d --name test-app -p 3000:3000 --env-file .env shark-tank-ai:test
docker logs -f test-app

# Test health endpoint
curl http://localhost:3000/health

# Clean up
docker stop test-app
docker rm test-app
```

## GitHub Actions Specific Issues

### Build fails in GitHub Actions but works locally

1. **Check secrets**: Make sure all GitHub secrets are set correctly
2. **Check platform**: GitHub Actions uses linux/amd64
3. **Check cache**: Try clearing cache by changing cache key in workflow

### SSH deployment fails

1. **Test SSH manually**:
```bash
ssh -i ~/.ssh/id_rsa root@YOUR_VPS_IP
```

2. **Check VPS_SSH_KEY secret**: Must include BEGIN and END lines

3. **Check known_hosts**: Add this to workflow before SSH:
```yaml
- name: Add VPS to known hosts
  run: |
    mkdir -p ~/.ssh
    ssh-keyscan ${{ secrets.VPS_HOST }} >> ~/.ssh/known_hosts
```

## Need More Help?

1. Check GitHub Actions logs for detailed error messages
2. Run `docker build` locally with `--progress=plain` for verbose output:
   ```bash
   docker build --progress=plain -t shark-tank-ai:test .
   ```
3. Check if all required files are present:
   ```bash
   ls -la
   cat package.json
   cat .npmrc
   ```
