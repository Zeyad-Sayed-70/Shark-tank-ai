# GitHub Actions SSH Authentication Fix

## The Error
```
ssh: handshake failed: ssh: unable to authenticate, attempted methods [none publickey], no supported methods remain
```

This means GitHub Actions can't authenticate to your VPS with the provided SSH key.

## Quick Fix (5 minutes)

### Step 1: Run the Setup Script

On your local machine:

```bash
# Make the script executable
chmod +x setup-ssh.sh

# Run it
./setup-ssh.sh
```

This will:
1. Generate a new SSH key
2. Copy it to your VPS
3. Test the connection
4. Show you the private key to copy

### Step 2: Update GitHub Secret

1. Copy the private key shown by the script (everything including BEGIN and END lines)
2. Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions
3. Click on `VPS_SSH_KEY` → Update
4. Paste the private key
5. Click "Update secret"

### Step 3: Push to GitHub

```bash
git add .
git commit -m "Fix SSH authentication for deployment"
git push origin master
```

## Manual Fix (if script doesn't work)

### 1. Generate SSH Key

```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_deploy_key
# Press Enter when asked for passphrase (no passphrase!)
```

### 2. Copy Public Key to VPS

```bash
# Method 1: Automatic
ssh-copy-id -i ~/.ssh/github_deploy_key.pub root@213.199.33.174

# Method 2: Manual
cat ~/.ssh/github_deploy_key.pub
# Copy the output

# SSH to VPS
ssh root@213.199.33.174

# Add the key
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "PASTE_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
exit
```

### 3. Test Connection

```bash
# This should work WITHOUT asking for password
ssh -i ~/.ssh/github_deploy_key root@213.199.33.174

# If it works, you're good!
```

### 4. Update GitHub Secret

```bash
# Get the private key
cat ~/.ssh/github_deploy_key
```

Copy EVERYTHING (including BEGIN and END lines) and update the `VPS_SSH_KEY` secret in GitHub.

## Verify GitHub Secrets

Make sure ALL these secrets are set correctly:

| Secret Name | Value | How to Get |
|-------------|-------|------------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username | hub.docker.com |
| `DOCKERHUB_TOKEN` | Docker Hub access token | hub.docker.com → Settings → Security |
| `VPS_HOST` | `213.199.33.174` | Your VPS IP |
| `VPS_USERNAME` | `root` | Your SSH username |
| `VPS_SSH_KEY` | Private key content | `cat ~/.ssh/github_deploy_key` |

## Common Issues

### Issue 1: Key has wrong format

**Check your key format:**
```bash
head -1 ~/.ssh/github_deploy_key
```

Should show one of:
- `-----BEGIN OPENSSH PRIVATE KEY-----`
- `-----BEGIN RSA PRIVATE KEY-----`
- `-----BEGIN EC PRIVATE KEY-----`

If it shows something else, regenerate the key.

### Issue 2: Key has passphrase

GitHub Actions can't use keys with passphrases. Generate without:
```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy_key -N ""
```

### Issue 3: Wrong permissions on VPS

```bash
# SSH to VPS
ssh root@213.199.33.174

# Fix permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Check SSH config
sudo nano /etc/ssh/sshd_config
# Make sure: PubkeyAuthentication yes

# Restart SSH
sudo systemctl restart sshd
```

### Issue 4: Multiple keys in authorized_keys

```bash
# On VPS, check authorized_keys
cat ~/.ssh/authorized_keys

# Each key should be on ONE line
# If keys are split across multiple lines, fix them
```

## Test Before Pushing

Use the test script:

```bash
chmod +x test-ssh-connection.sh
./test-ssh-connection.sh
```

If this passes, GitHub Actions should work too.

## Still Not Working?

### Debug GitHub Actions

Add debug step to workflow:

```yaml
- name: Debug SSH
  run: |
    echo "VPS_HOST: ${{ secrets.VPS_HOST }}"
    echo "VPS_USERNAME: ${{ secrets.VPS_USERNAME }}"
    echo "Key length: ${#VPS_SSH_KEY}"
  env:
    VPS_SSH_KEY: ${{ secrets.VPS_SSH_KEY }}
```

### Try Alternative SSH Action

Replace the SSH action in `.github/workflows/docker-deploy.yml`:

```yaml
- name: Trigger VPS deployment
  run: |
    echo "${{ secrets.VPS_SSH_KEY }}" > deploy_key
    chmod 600 deploy_key
    ssh -i deploy_key -o StrictHostKeyChecking=no ${{ secrets.VPS_USERNAME }}@${{ secrets.VPS_HOST }} "cd /opt/shark-tank-ai && bash deploy.sh"
    rm deploy_key
```

## Success Checklist

- [ ] SSH key generated without passphrase
- [ ] Public key copied to VPS authorized_keys
- [ ] Test connection works: `ssh -i ~/.ssh/github_deploy_key root@213.199.33.174`
- [ ] Private key copied to GitHub secret VPS_SSH_KEY (with BEGIN/END lines)
- [ ] All 5 GitHub secrets are set
- [ ] Pushed to master branch
- [ ] GitHub Actions workflow succeeds

## Next Steps After Fix

Once SSH works:
1. GitHub Actions will build Docker image
2. Push to Docker Hub
3. SSH to VPS
4. Run deploy.sh
5. Your app will be live at http://213.199.33.174:3000
