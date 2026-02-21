# Quick Start - Docker Deployment

## 🚀 Quick Deploy in 5 Steps

### 1. Update deploy.sh
Edit `deploy.sh` and replace `YOUR_DOCKERHUB_USERNAME` with your Docker Hub username:
```bash
DOCKER_IMAGE="yourusername/shark-tank-ai:latest"
```

### 2. Set up GitHub Secrets
Go to your GitHub repo → Settings → Secrets and variables → Actions

Add these secrets:
- `DOCKERHUB_USERNAME` - Your Docker Hub username
- `DOCKERHUB_TOKEN` - Your Docker Hub access token
- `VPS_HOST` - Your VPS IP address
- `VPS_USERNAME` - SSH username (e.g., root)
- `VPS_SSH_KEY` - Your private SSH key
- `VPS_PORT` - SSH port (default: 22)

### 3. Set up VPS
SSH into your VPS and run:
```bash
# Copy and run the setup script
curl -o vps-setup.sh https://raw.githubusercontent.com/YOUR_REPO/master/vps-setup.sh
chmod +x vps-setup.sh
sudo ./vps-setup.sh

# Upload deploy script
scp deploy.sh user@your-vps:/opt/shark-tank-ai/
ssh user@your-vps "chmod +x /opt/shark-tank-ai/deploy.sh"

# Edit environment variables
ssh user@your-vps
nano /opt/shark-tank-ai/.env
# Add your actual values
```

### 4. Test Locally (Optional)
```bash
docker build -t shark-tank-ai:test .
docker run -p 3000:3000 --env-file .env shark-tank-ai:test
```

### 5. Deploy
```bash
git add .
git commit -m "Setup Docker deployment"
git push origin master
```

That's it! GitHub Actions will automatically:
- Build your Docker image
- Push to Docker Hub
- Deploy to your VPS

## 📊 Monitor Deployment

Watch GitHub Actions:
- Go to your repo → Actions tab
- Click on the latest workflow run

Check VPS logs:
```bash
ssh user@your-vps
docker logs -f shark-tank-ai
```

## 🔧 Useful Commands

### On VPS
```bash
# View logs
docker logs -f shark-tank-ai

# Restart app
docker restart shark-tank-ai

# Manual deploy
cd /opt/shark-tank-ai && ./deploy.sh

# Check status
docker ps
```

### Local Testing
```bash
# Build and run
docker-compose up --build

# Run in background
docker-compose up -d

# Stop
docker-compose down
```

## 🆘 Troubleshooting

### Deployment fails
1. Check GitHub Actions logs
2. Verify all secrets are set correctly
3. Check VPS logs: `docker logs shark-tank-ai`

### Can't connect to app
1. Check if container is running: `docker ps`
2. Check firewall: `sudo ufw status`
3. Verify port 3000 is open

### Out of disk space
```bash
docker system prune -a
docker volume prune
```

## 📚 Full Documentation
See `DEPLOYMENT_GUIDE.md` for detailed instructions.
