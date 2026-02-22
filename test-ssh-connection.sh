#!/bin/bash

# Test SSH Connection to VPS

VPS_HOST="213.199.33.174"
VPS_USER="root"
KEY_PATH="$HOME/.ssh/github_deploy_key"

echo "🧪 Testing SSH connection to VPS..."
echo ""
echo "Configuration:"
echo "  Host: $VPS_HOST"
echo "  User: $VPS_USER"
echo "  Key: $KEY_PATH"
echo ""

# Check if key exists
if [ ! -f "$KEY_PATH" ]; then
    echo "❌ SSH key not found at $KEY_PATH"
    echo ""
    echo "Options:"
    echo "1. Run ./setup-ssh.sh to generate a new key"
    echo "2. Or use your existing key:"
    echo "   - id_rsa: $HOME/.ssh/id_rsa"
    echo "   - id_ed25519: $HOME/.ssh/id_ed25519"
    exit 1
fi

# Test connection
echo "Testing connection..."
if ssh -i "$KEY_PATH" -o BatchMode=yes -o ConnectTimeout=10 "$VPS_USER@$VPS_HOST" "echo 'Connection successful!'" 2>/dev/null; then
    echo "✅ SSH connection works!"
    echo ""
    echo "Testing deploy script..."
    if ssh -i "$KEY_PATH" "$VPS_USER@$VPS_HOST" "test -f /opt/shark-tank-ai/deploy.sh && echo 'Deploy script exists'"; then
        echo "✅ Deploy script is ready"
        echo ""
        echo "🎉 Everything looks good!"
        echo ""
        echo "Next steps:"
        echo "1. Make sure VPS_SSH_KEY secret in GitHub contains:"
        cat "$KEY_PATH"
        echo ""
        echo "2. Push to master to trigger deployment"
    else
        echo "⚠️  Deploy script not found on VPS"
        echo ""
        echo "Upload it with:"
        echo "scp -i $KEY_PATH deploy.sh $VPS_USER@$VPS_HOST:/opt/shark-tank-ai/"
    fi
else
    echo "❌ SSH connection failed!"
    echo ""
    echo "Troubleshooting steps:"
    echo ""
    echo "1. Check if public key is on VPS:"
    echo "   ssh $VPS_USER@$VPS_HOST 'cat ~/.ssh/authorized_keys'"
    echo ""
    echo "2. Add your public key to VPS:"
    echo "   ssh-copy-id -i $KEY_PATH.pub $VPS_USER@$VPS_HOST"
    echo ""
    echo "3. Or run the setup script:"
    echo "   ./setup-ssh.sh"
    exit 1
fi
