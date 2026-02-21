# Docker Deployment Guide

This guide explains how to deploy the Shark Tank AI application using Docker and GitHub Actions CI/CD.

## Prerequisites

1. Docker Hub account
2. VPS with Docker installed
3. GitHub repository with Actions enabled

## Setup Instructions

### 1. Docker Hub Setup

1. Create a Docker Hub account at https://hub.docker.com
2. Create a new repository named `shark-tank-ai`
3. Generate an access token:
   - Go to Account Settings → Security → New Access Token
   - Save the token securely

### 2. GitHub Secrets Configuration

Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

- `DOCKERHUB_USERNAME`: Your Docker Hub username
- `DOCKERHUB_TOKEN`: Your Docker Hub access token
- `VPS_HOST`: Your VPS IP address or domain
- `VPS_USERNAME`: SSH username (usually `root` or your user)
- `VPS_SSH_KEY`: Your private SSH key for VPS access
- `VPS_PORT`: SSH port (default: 22)

### 3. VPS Setup

SSH into your VPS and run:

```bash
# Install Docker (if not already installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Create application directory
sudo mkdir -p /opt/shark-tank-ai/data/conversations
cd /opt/shark-tank-ai

# Copy the deploy.sh script to VPS
# (You can use scp or paste the content)
sudo nano deploy.sh
# Paste the content from deploy.sh file

# Make it executable
sudo chmod +x deploy.sh

# Create .env file with your environment variables
sudo nano .env
# Add all your environment variables from the local .env file

# Update the DOCKER_IMAGE in deploy.sh
sudo nano deploy.sh
# Replace YOUR_DOCKERHUB_USERNAME with your actual Docker Hub username
```

### 4. Test Local Build

Before pushing to GitHub, test the Docker build locally:

```bash
# Build the image
docker build -t shark-tank-ai:test .

# Run locally
docker run -p 3000:3000 --env-file .env shark-tank-ai:test

# Or use docker-compose
docker-compose up --build
```

### 5. Deploy

Once everything is configured:

```bash
git add .
git commit -m "Add Docker deployment setup"
git push origin master
```

The GitHub Action will:
1. Build the Docker image
2. Push it to Docker Hub
3. SSH into your VPS
4. Run the deployment script
5. Pull the new image and restart the container

## Manual Deployment on VPS

If you need to deploy manually:

```bash
ssh user@your-vps-ip
cd /opt/shark-tank-ai
./deploy.sh
```

## Monitoring

### View logs
```bash
docker logs -f shark-tank-ai
```

### Check container status
```bash
docker ps
```

### Restart container
```bash
docker restart shark-tank-ai
```

### Stop container
```bash
docker stop shark-tank-ai
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker logs shark-tank-ai

# Check if port is already in use
sudo netstat -tulpn | grep 3000
```

### Out of disk space
```bash
# Clean up old images
docker system prune -a

# Remove unused volumes
docker volume prune
```

### Environment variables not loading
```bash
# Verify .env file exists
cat /opt/shark-tank-ai/.env

# Check if container has env vars
docker exec shark-tank-ai env
```

## Security Best Practices

1. Never commit `.env` file to Git
2. Use strong SSH keys for VPS access
3. Keep Docker and system packages updated
4. Use firewall to restrict access to port 3000
5. Consider using a reverse proxy (nginx) with SSL

## Rollback

If deployment fails, rollback to previous version:

```bash
# On VPS
docker pull YOUR_DOCKERHUB_USERNAME/shark-tank-ai:previous-tag
docker stop shark-tank-ai
docker rm shark-tank-ai
# Run deploy.sh with the previous tag
```

## Health Check

The application includes a health check endpoint. Access it at:
```
http://your-vps-ip:3000/health
```

## Next Steps

1. Set up nginx reverse proxy with SSL
2. Configure domain name
3. Set up monitoring (Prometheus/Grafana)
4. Configure automated backups for data directory
