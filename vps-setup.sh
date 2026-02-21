#!/bin/bash

# VPS Initial Setup Script
# Run this script once on your VPS to set up the deployment environment

set -e

echo "🚀 Setting up VPS for Shark Tank AI deployment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Update system
print_status "Updating system packages..."
apt-get update
apt-get upgrade -y

# Install Docker if not installed
if ! command -v docker &> /dev/null; then
    print_status "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    
    # Start Docker service
    systemctl start docker
    systemctl enable docker
    
    print_status "Docker installed successfully"
else
    print_status "Docker is already installed"
fi

# Create application directory
print_status "Creating application directory..."
mkdir -p /opt/shark-tank-ai/data/conversations
cd /opt/shark-tank-ai

# Create .env file template
if [ ! -f .env ]; then
    print_status "Creating .env file template..."
    cat > .env << 'EOF'
# Qdrant Vector Database
QDRANT_API_KEY=your_qdrant_api_key_here
QDRANT_ENDPOINT_URL=https://your-qdrant-instance.cloud.qdrant.io

# AI Endpoints
AI_ENDPOINT=http://your-ai-endpoint:8000/v1/chat/gemini
MISTRAL_ENDPOINT=http://your-mistral-endpoint:8000/v1/mistral/chat
MISTRAL_COOKIE=your_mistral_cookie_here

# Ollama Embeddings
OLLAMA_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=playlist_automation
MONGODB_COLLECTION=tasks

# Application
PORT=3000
NODE_ENV=production
EOF
    print_warning "⚠️  Please edit /opt/shark-tank-ai/.env with your actual values"
else
    print_status ".env file already exists"
fi

# Download deploy script from repository
print_status "Please upload your deploy.sh script to /opt/shark-tank-ai/"
print_warning "You can use: scp deploy.sh user@vps:/opt/shark-tank-ai/"

# Set up firewall (optional)
if command -v ufw &> /dev/null; then
    print_status "Configuring firewall..."
    ufw allow 22/tcp
    ufw allow 3000/tcp
    print_warning "Firewall rules added. Enable with: ufw enable"
fi

# Create systemd service for auto-deployment (optional)
print_status "Creating webhook listener service (optional)..."
cat > /etc/systemd/system/shark-tank-deploy.service << 'EOF'
[Unit]
Description=Shark Tank AI Auto Deploy
After=network.target docker.service

[Service]
Type=oneshot
ExecStart=/opt/shark-tank-ai/deploy.sh
WorkingDirectory=/opt/shark-tank-ai
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

print_status "✅ VPS setup complete!"
echo ""
print_warning "Next steps:"
echo "1. Edit /opt/shark-tank-ai/.env with your actual environment variables"
echo "2. Upload deploy.sh: scp deploy.sh user@vps:/opt/shark-tank-ai/"
echo "3. Make deploy.sh executable: chmod +x /opt/shark-tank-ai/deploy.sh"
echo "4. Update DOCKER_IMAGE in deploy.sh with your Docker Hub username"
echo "5. Configure GitHub secrets for CI/CD"
echo "6. Push to master branch to trigger deployment"
echo ""
print_status "For manual deployment, run: cd /opt/shark-tank-ai && ./deploy.sh"
