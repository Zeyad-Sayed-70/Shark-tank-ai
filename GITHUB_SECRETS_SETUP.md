# GitHub Secrets Setup Guide

## Required GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these 5 secrets:

### 1. DOCKERHUB_USERNAME
- **Value**: Your Docker Hub username (e.g., `johndoe`)
- **How to get it**: 
  - Go to https://hub.docker.com
  - Sign up or log in
  - Your username is shown in the top right corner

### 2. DOCKERHUB_TOKEN
- **Value**: Your Docker Hub access token
- **How to get it**:
  1. Log in to https://hub.docker.com
  2. Click your username → **Account Settings**
  3. Go to **Security** tab
  4. Click **New Access Token**
  5. Give it a name (e.g., "GitHub Actions")
  6. Set permissions to **Read, Write, Delete**
  7. Click **Generate**
  8. **COPY THE TOKEN** (you won't see it again!)
  9. Paste it as the secret value

### 3. VPS_HOST
- **Value**: Your VPS IP address or domain
- **Examples**: 
  - `213.199.33.174`
  - `myserver.example.com`
- **How to get it**: Check your VPS provider dashboard or SSH connection details

### 4. VPS_USERNAME
- **Value**: SSH username for your VPS
- **Common values**: 
  - `root` (most common for VPS)
  - `ubuntu` (for Ubuntu servers)
  - `admin` (some providers)
- **How to get it**: Check your VPS provider's SSH instructions

### 5. VPS_SSH_KEY
- **Value**: Your PRIVATE SSH key (the entire key content)
- **How to get it**:

#### If you already have an SSH key:
```bash
# On your local machine
cat ~/.ssh/id_rsa
# or
cat ~/.ssh/id_ed25519
```
Copy the ENTIRE output including:
```
-----BEGIN OPENSSH PRIVATE KEY-----
...all the lines...
-----END OPENSSH PRIVATE KEY-----
```

#### If you need to create a new SSH key:
```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/vps_deploy_key

# Don't set a passphrase (just press Enter)

# Copy the private key
cat ~/.ssh/vps_deploy_key

# Copy the public key to your VPS
ssh-copy-id -i ~/.ssh/vps_deploy_key.pub root@YOUR_VPS_IP
# Or manually:
cat ~/.ssh/vps_deploy_key.pub
# Then SSH to VPS and add it to ~/.ssh/authorized_keys
```

### 6. VPS_PORT (Optional)
- **Value**: SSH port number
- **Default**: `22`
- **Only add this if your VPS uses a different SSH port**

## Quick Checklist

- [ ] Created Docker Hub account
- [ ] Created Docker Hub access token
- [ ] Added DOCKERHUB_USERNAME secret
- [ ] Added DOCKERHUB_TOKEN secret
- [ ] Added VPS_HOST secret (your VPS IP)
- [ ] Added VPS_USERNAME secret (usually `root`)
- [ ] Added VPS_SSH_KEY secret (entire private key)
- [ ] Added VPS_PORT secret (if not using port 22)

## Verify Secrets

After adding all secrets, you should see them listed in:
**Settings** → **Secrets and variables** → **Actions**

The values will be hidden (shown as `***`), which is correct for security.

## Test SSH Connection

Before deploying, test that your SSH key works:

```bash
# On your local machine
ssh -i ~/.ssh/vps_deploy_key root@YOUR_VPS_IP

# If it works without asking for a password, you're good!
```

## Common Issues

### "Permission denied (publickey)"
- Your public key is not on the VPS
- Run: `ssh-copy-id -i ~/.ssh/vps_deploy_key.pub root@YOUR_VPS_IP`

### "Host key verification failed"
- First time connecting to VPS
- Connect manually once: `ssh root@YOUR_VPS_IP`
- Type `yes` to accept the host key

### Docker Hub login fails
- Check your DOCKERHUB_TOKEN is correct
- Make sure the token has Read, Write, Delete permissions
- Token might have expired - generate a new one
