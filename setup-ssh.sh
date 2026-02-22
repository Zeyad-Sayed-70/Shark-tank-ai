#!/bin/bash

# SSH Key Setup Script for GitHub Actions Deployment

set -e

echo "🔑 Setting up SSH key for GitHub Actions deployment..."
echo ""

# Configuration
VPS_HOST="213.199.33.174"
VPS_USER="deploy"
KEY_PATH="$HOME/.ssh/github_deploy_key"

# Check if key already exists
if [ -f "$KEY_PATH" ]; then
    echo "⚠️  SSH key already exists at $KEY_PATH"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Using existing key..."
    else
        rm -f "$KEY_PATH" "$KEY_PATH.pub"
        echo "Generating new key..."
        ssh-keygen -t ed25519 -C "github-actions-deploy" -f "$KEY_PATH" -N ""
    fi
else
    echo "📝 Generating new SSH key..."
    ssh-keygen -t ed25519 -C "github-actions-deploy" -f "$KEY_PATH" -N ""
fi

echo ""
echo "📤 Copying public key to VPS..."
echo "You may be asked for your VPS password..."

# Copy public key to VPS
ssh-copy-id -i "$KEY_PATH.pub" "$VPS_USER@$VPS_HOST"

echo ""
echo "🧪 Testing SSH connection..."

# Test connection
if ssh -i "$KEY_PATH" -o BatchMode=yes -o ConnectTimeout=5 "$VPS_USER@$VPS_HOST" "echo 'Connection successful!'" 2>/dev/null; then
    echo "✅ SSH connection test passed!"
else
    echo "❌ SSH connection test failed!"
    echo "Please check your VPS credentials and try again."
    exit 1
fi

echo ""
echo "================================================"
echo "✅ SSH Setup Complete!"
echo "================================================"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Copy the PRIVATE KEY below to GitHub:"
echo "   - Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions"
echo "   - Update secret: VPS_SSH_KEY"
echo "   - Paste the ENTIRE content below (including BEGIN and END lines)"
echo ""
echo "2. Verify other GitHub secrets are set:"
echo "   - VPS_HOST: $VPS_HOST"
echo "   - VPS_USERNAME: $VPS_USER"
echo "   - VPS_PORT: 22 (optional)"
echo ""
echo "================================================"
echo "🔐 PRIVATE KEY (Copy everything below):"
echo "================================================"
cat "$KEY_PATH"
echo "================================================"
echo ""
echo "⚠️  Keep this private key secure!"
echo "⚠️  Never commit it to your repository!"
echo ""
