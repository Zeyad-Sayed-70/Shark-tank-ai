# Fix Deployment NOW - Complete Guide

## Current Issue
GitHub Actions is failing at "Trigger VPS deployment" with SSH authentication error.

## Quick Fix (Choose One Method)

### Method 1: Automated Script (Easiest) ⭐

```bash
# 1. Run the setup script
chmod +x setup-ssh.sh
./setup-ssh.sh

# 2. Copy the private key shown at the end

# 3. Update GitHub secret:
#    - Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions
#    - Click VPS_SSH_KEY → Update
#    - Paste the private key (everything including BEGIN/END lines)
#    - Click "Update secret"

# 4. Push to GitHub
git add .
git commit -m "Fix SSH authentication"
git push origin master
```

### Method 2: Manual Setup

```bash
# 1. Generate SSH key (no passphrase!)
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github_deploy_key
# Press Enter twice (no passphrase)

# 2. Copy public key to VPS
ssh-copy-id -i ~/.ssh/github_deploy_key.pub root@213.199.33.174
# Enter your VPS password when prompted

# 3. Test connection (should work without password)
ssh -i ~/.ssh/github_deploy_key root@213.199.33.174

# 4. Get private key
cat ~/.ssh/github_deploy_key
# Copy EVERYTHING (including BEGIN and END lines)

# 5. Update GitHub secret VPS_SSH_KEY with the private key

# 6. Push to GitHub
git add .
git commit -m "Fix SSH authentication"
git push origin master
```

## Verify All GitHub Secrets

Go to: Settings → Secrets and variables → Actions

You should have these 5 secrets:

| Secret | Example Value | Where to Get |
|--------|---------------|--------------|
| DOCKERHUB_USERNAME | `johndoe` | Your Docker Hub username |
| DOCKERHUB_TOKEN | `dckr_pat_abc123...` | hub.docker.com → Settings → Security → New Access Token |
| VPS_HOST | `213.199.33.174` | Your VPS IP address |
| VPS_USERNAME | `root` | Your SSH username |
| VPS_SSH_KEY | `-----BEGIN OPENSSH...` | `cat ~/.ssh/github_deploy_key` |

## Test Before Pushing

```bash
# Test SSH connection
chmod +x test-ssh-connection.sh
./test-ssh-connection.sh

# If this passes, GitHub Actions should work
```

## Complete Deployment Checklist

### On Local Machine:
- [ ] SSH key generated without passphrase
- [ ] Public key copied to VPS
- [ ] SSH connection tested successfully
- [ ] Private key copied to GitHub secret
- [ ] All 5 GitHub secrets configured
- [ ] deploy.sh edited with Docker Hub username
- [ ] Changes committed and pushed

### On VPS:
- [ ] VPS setup script completed
- [ ] /opt/shark-tank-ai directory exists
- [ ] deploy.sh uploaded and executable
- [ ] .env file configured
- [ ] Public SSH key in ~/.ssh/authorized_keys

### On GitHub:
- [ ] Repository has all secrets
- [ ] Workflow file is correct
- [ ] Push to master triggers workflow

## What Happens After Fix

1. **Push to master**
   ```bash
   git push origin master
   ```

2. **GitHub Actions runs**
   - Builds Docker image
   - Pushes to Docker Hub
   - SSHs to VPS
   - Runs deploy.sh

3. **VPS deploys**
   - Pulls latest image
   - Stops old container
   - Starts new container

4. **App is live**
   - Access at: http://213.199.33.174:3000
   - Health check: http://213.199.33.174:3000/health

## Troubleshooting

### SSH still fails after setup

```bash
# On VPS, check SSH config
ssh root@213.199.33.174
sudo nano /etc/ssh/sshd_config

# Make sure these lines exist and are uncommented:
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys

# Save and restart SSH
sudo systemctl restart sshd
exit

# Try again
ssh -i ~/.ssh/github_deploy_key root@213.199.33.174
```

### Docker Hub authentication fails

```bash
# Regenerate Docker Hub token
# 1. Go to hub.docker.com
# 2. Settings → Security
# 3. Delete old token
# 4. Create new token with Read, Write, Delete permissions
# 5. Update DOCKERHUB_TOKEN secret in GitHub
```

### Deploy script not found on VPS

```bash
# Upload deploy script
scp deploy.sh root@213.199.33.174:/opt/shark-tank-ai/

# Make it executable
ssh root@213.199.33.174 "chmod +x /opt/shark-tank-ai/deploy.sh"
```

## Monitor Deployment

### Watch GitHub Actions
1. Go to your repo → Actions tab
2. Click on the latest workflow run
3. Watch each step complete

### Check VPS
```bash
# SSH to VPS
ssh root@213.199.33.174

# Check if container is running
docker ps

# View logs
docker logs -f shark-tank-ai

# Check health
curl http://localhost:3000/health
```

## Success Indicators

✅ GitHub Actions workflow completes without errors
✅ Docker image appears in Docker Hub
✅ Container is running on VPS: `docker ps`
✅ App responds: `curl http://213.199.33.174:3000/health`
✅ Logs show no errors: `docker logs shark-tank-ai`

## Need Help?

See detailed guides:
- `SSH_KEY_SETUP.md` - Detailed SSH setup
- `GITHUB_ACTIONS_SSH_FIX.md` - SSH troubleshooting
- `DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `DOCKER_BUILD_TROUBLESHOOTING.md` - Docker issues

## Quick Commands Reference

```bash
# Generate SSH key
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy_key -N ""

# Copy to VPS
ssh-copy-id -i ~/.ssh/github_deploy_key.pub root@213.199.33.174

# Test connection
ssh -i ~/.ssh/github_deploy_key root@213.199.33.174

# Get private key for GitHub
cat ~/.ssh/github_deploy_key

# Test deployment locally
docker build -t shark-tank-ai:test .
docker run -p 3000:3000 --env-file .env shark-tank-ai:test

# Check VPS
ssh root@213.199.33.174 "docker ps && docker logs --tail 20 shark-tank-ai"
```
