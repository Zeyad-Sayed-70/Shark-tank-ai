# 🚀 Quick Start - Complete Deployment Guide

## Prerequisites
- Docker Hub account
- VPS with root access
- GitHub repository

## Part 1: GitHub Secrets (5 minutes)

### Get Your Docker Hub Token
1. Go to https://hub.docker.com and login
2. Click your username → **Account Settings** → **Security**
3. Click **New Access Token**
4. Name: "GitHub Actions", Permissions: **Read, Write, Delete**
5. Click **Generate** and **COPY THE TOKEN**

### Add GitHub Secrets
Go to your repo → **Settings** → **Secrets and variables** → **Actions**

Add these 5 secrets:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username | `johndoe` |
| `DOCKERHUB_TOKEN` | Token from step above | `dckr_pat_abc123...` |
| `VPS_HOST` | Your VPS IP address | `213.199.33.174` |
| `VPS_USERNAME` | SSH username | `root` |
| `VPS_SSH_KEY` | Your private SSH key | `-----BEGIN OPENSSH...` |

**Getting your SSH key:**
```bash
# On your local machine
cat ~/.ssh/id_rsa
# Copy EVERYTHING including BEGIN and END lines
```

**Don't have an SSH key?**
```bash
ssh-keygen -t ed25519 -f ~/.ssh/vps_key
ssh-copy-id -i ~/.ssh/vps_key.pub root@YOUR_VPS_IP
cat ~/.ssh/vps_key  # Use this for VPS_SSH_KEY secret
```

## Part 2: VPS Setup (10 minutes)

### Connect to VPS
```bash
ssh root@213.199.33.174
```

### Run Setup Script
```bash
# Download and run the setup script
curl -o vps-setup.sh https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/master/vps-setup.sh
chmod +x vps-setup.sh
sudo bash vps-setup.sh
```

**Or copy-paste method:**
1. Copy content of `vps-setup.sh` from your project
2. On VPS: `nano vps-setup.sh`
3. Paste content, save (Ctrl+X, Y, Enter)
4. Run: `chmod +x vps-setup.sh && sudo bash vps-setup.sh`

### Configure Environment
```bash
# Edit .env file
nano /opt/shark-tank-ai/.env

# Copy your local .env content and paste it
# Save: Ctrl+X, Y, Enter
```

### Upload Deploy Script
```bash
# Exit VPS first
exit

# On local machine - edit deploy.sh first!
# Replace YOUR_DOCKERHUB_USERNAME with your actual username
nano deploy.sh

# Upload to VPS
scp deploy.sh root@213.199.33.174:/opt/shark-tank-ai/

# SSH back and make executable
ssh root@213.199.33.174
chmod +x /opt/shark-tank-ai/deploy.sh
exit
```

## Part 3: Deploy (2 minutes)

### Push to GitHub
```bash
# On local machine
git add .
git commit -m "Setup Docker deployment"
git push origin master
```

### Watch Deployment
1. Go to your GitHub repo → **Actions** tab
2. Click on the running workflow
3. Watch the build and deploy process

### Access Your App
```
http://YOUR_VPS_IP:3000
http://YOUR_VPS_IP:3000/health
```

## Verification Checklist

- [ ] Docker Hub account created
- [ ] 5 GitHub secrets added
- [ ] VPS setup script completed
- [ ] .env file configured on VPS
- [ ] deploy.sh uploaded and executable
- [ ] Pushed to master branch
- [ ] GitHub Actions workflow succeeded
- [ ] App accessible at http://VPS_IP:3000

## Common Issues

### GitHub Actions fails at "Log in to Docker Hub"
- Check DOCKERHUB_USERNAME and DOCKERHUB_TOKEN secrets
- Regenerate Docker Hub token if needed

### GitHub Actions fails at "Trigger VPS deployment"
- Check VPS_HOST, VPS_USERNAME, VPS_SSH_KEY secrets
- Test SSH manually: `ssh -i ~/.ssh/id_rsa root@YOUR_VPS_IP`

### App not accessible
```bash
# SSH to VPS
ssh root@213.199.33.174

# Check if container is running
docker ps

# Check logs
docker logs shark-tank-ai

# Check firewall
ufw status
ufw allow 3000/tcp
```

### Container keeps restarting
```bash
# Check logs for errors
docker logs shark-tank-ai

# Common issues:
# - Missing environment variables in .env
# - Wrong MongoDB/Redis connection strings
# - Port 3000 already in use
```

## Useful Commands

### On VPS
```bash
# View logs
docker logs -f shark-tank-ai

# Restart app
docker restart shark-tank-ai

# Manual redeploy
cd /opt/shark-tank-ai && ./deploy.sh

# Check container status
docker ps -a

# Stop app
docker stop shark-tank-ai
```

### Local Testing
```bash
# Test Docker build locally
docker build -t shark-tank-ai:test .
docker run -p 3000:3000 --env-file .env shark-tank-ai:test

# Or use docker-compose
docker-compose up --build
```

## Next Steps

1. **Set up domain**: Point your domain to VPS IP
2. **Add SSL**: Use nginx reverse proxy with Let's Encrypt
3. **Monitoring**: Set up logging and alerts
4. **Backups**: Automate data directory backups

## Need Help?

See detailed guides:
- `GITHUB_SECRETS_SETUP.md` - Detailed GitHub secrets guide
- `VPS_SETUP_COMMANDS.md` - Step-by-step VPS commands
- `DEPLOYMENT_GUIDE.md` - Complete deployment documentation
