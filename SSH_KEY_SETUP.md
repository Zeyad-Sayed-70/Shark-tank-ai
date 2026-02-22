# SSH Key Setup for GitHub Actions

## The Problem
GitHub Actions can't authenticate to your VPS because:
1. The SSH key format might be wrong
2. The public key isn't on your VPS
3. The key permissions are incorrect on VPS

## Solution: Step-by-Step

### Step 1: Generate a New SSH Key (Recommended)

On your local machine:

```bash
# Generate a new SSH key specifically for deployment
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key

# When prompted for passphrase, press Enter (no passphrase)
```

This creates two files:
- `~/.ssh/github_deploy_key` (private key - for GitHub secret)
- `~/.ssh/github_deploy_key.pub` (public key - for VPS)

### Step 2: Copy Public Key to VPS

```bash
# Copy the public key to your VPS
ssh-copy-id -i ~/.ssh/github_deploy_key.pub root@213.199.33.174

# Or manually:
cat ~/.ssh/github_deploy_key.pub
# Copy the output, then SSH to VPS and add it to authorized_keys
```

**Manual method:**
```bash
# 1. Show the public key
cat ~/.ssh/github_deploy_key.pub

# 2. SSH to VPS
ssh root@213.199.33.174

# 3. Add the key
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
# Paste the public key on a new line
# Save: Ctrl+X, Y, Enter

# 4. Set correct permissions
chmod 600 ~/.ssh/authorized_keys
```

### Step 3: Test SSH Connection

```bash
# Test the connection with the new key
ssh -i ~/.ssh/github_deploy_key root@213.199.33.174

# If it works without asking for password, you're good!
```

### Step 4: Update GitHub Secret

```bash
# Get the PRIVATE key content
cat ~/.ssh/github_deploy_key
```

Copy the ENTIRE output including:
```
-----BEGIN OPENSSH PRIVATE KEY-----
...all the lines...
-----END OPENSSH PRIVATE KEY-----
```

**Update GitHub Secret:**
1. Go to your repo → Settings → Secrets and variables → Actions
2. Find `VPS_SSH_KEY` secret
3. Click "Update" (or delete and recreate)
4. Paste the ENTIRE private key content
5. Click "Update secret"

### Step 5: Verify All Secrets

Make sure these are set correctly:

| Secret | Value | How to Check |
|--------|-------|--------------|
| `VPS_HOST` | `213.199.33.174` | Your VPS IP |
| `VPS_USERNAME` | `root` | SSH username |
| `VPS_SSH_KEY` | Private key content | From `cat ~/.ssh/github_deploy_key` |
| `VPS_PORT` | `22` | Default SSH port (optional) |

## Alternative: Use Existing SSH Key

If you want to use your existing SSH key:

### Check if public key is on VPS
```bash
# SSH to VPS
ssh root@213.199.33.174

# Check authorized_keys
cat ~/.ssh/authorized_keys

# You should see your public key there
```

### Add your public key if missing
```bash
# On local machine, get your public key
cat ~/.ssh/id_rsa.pub
# or
cat ~/.ssh/id_ed25519.pub

# Copy the output

# SSH to VPS
ssh root@213.199.33.174

# Add the key
echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Update GitHub secret with private key
```bash
# On local machine
cat ~/.ssh/id_rsa
# or
cat ~/.ssh/id_ed25519

# Copy EVERYTHING and update VPS_SSH_KEY secret
```

## Common Issues

### Issue: "Permission denied (publickey)"

**Check 1: Key format**
```bash
# Your private key should start with one of these:
-----BEGIN OPENSSH PRIVATE KEY-----
-----BEGIN RSA PRIVATE KEY-----
-----BEGIN EC PRIVATE KEY-----
```

**Check 2: VPS authorized_keys permissions**
```bash
# On VPS
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

**Check 3: VPS SSH config**
```bash
# On VPS, check SSH config
sudo nano /etc/ssh/sshd_config

# Make sure these are set:
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys

# Restart SSH
sudo systemctl restart sshd
```

### Issue: "Host key verification failed"

Add this to your GitHub workflow before the SSH step:

```yaml
- name: Add VPS to known hosts
  run: |
    mkdir -p ~/.ssh
    ssh-keyscan -H ${{ secrets.VPS_HOST }} >> ~/.ssh/known_hosts
```

### Issue: Key has passphrase

GitHub Actions can't handle SSH keys with passphrases. Generate a new key without passphrase:

```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_deploy_key -N ""
```

## Test the Complete Flow

### 1. Test SSH manually
```bash
ssh -i ~/.ssh/github_deploy_key root@213.199.33.174
```

### 2. Test the deploy script
```bash
ssh -i ~/.ssh/github_deploy_key root@213.199.33.174 "cd /opt/shark-tank-ai && bash deploy.sh"
```

### 3. Push to GitHub
```bash
git add .
git commit -m "Fix SSH authentication"
git push origin master
```

## Quick Fix Script

Run this on your local machine:

```bash
#!/bin/bash

echo "🔑 Setting up SSH key for GitHub Actions..."

# Generate key
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_deploy_key -N ""

# Copy to VPS
echo "📤 Copying public key to VPS..."
ssh-copy-id -i ~/.ssh/github_deploy_key.pub root@213.199.33.174

# Test connection
echo "🧪 Testing connection..."
ssh -i ~/.ssh/github_deploy_key root@213.199.33.174 "echo 'Connection successful!'"

# Show private key
echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Copy this PRIVATE KEY to GitHub secret VPS_SSH_KEY:"
echo "================================================"
cat ~/.ssh/github_deploy_key
echo "================================================"
```

Save as `setup-ssh.sh`, make executable, and run:
```bash
chmod +x setup-ssh.sh
./setup-ssh.sh
```
