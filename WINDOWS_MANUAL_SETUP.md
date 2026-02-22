# Windows Manual SSH Setup - Step by Step

## Step 1: Generate SSH Key

Open PowerShell and run these commands one by one:

```powershell
# Create .ssh directory
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.ssh"

# Generate SSH key (press Enter when asked for passphrase - leave it empty!)
ssh-keygen -t ed25519 -C "github-actions" -f "$env:USERPROFILE\.ssh\github_deploy_key"
```

When prompted:
- "Enter passphrase (empty for no passphrase):" - Just press **Enter**
- "Enter same passphrase again:" - Just press **Enter** again

## Step 2: View Your Public Key

```powershell
Get-Content "$env:USERPROFILE\.ssh\github_deploy_key.pub"
```

Copy the entire output (it starts with `ssh-ed25519`).

## Step 3: Add Public Key to VPS

Open a NEW PowerShell window and connect to your VPS:

```powershell
ssh root@213.199.33.174
```

Enter your VPS password when prompted.

Once connected to VPS, run these commands:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
```

This opens a text editor. Now:
1. Paste your public key (from Step 2) on a new line
2. Press `Ctrl + X` to exit
3. Press `Y` to save
4. Press `Enter` to confirm

Then set permissions:

```bash
chmod 600 ~/.ssh/authorized_keys
exit
```

## Step 4: Test SSH Connection

Back in your original PowerShell window:

```powershell
ssh -i "$env:USERPROFILE\.ssh\github_deploy_key" root@213.199.33.174
```

If it connects WITHOUT asking for a password, SUCCESS! Type `exit` to disconnect.

## Step 5: Get Private Key for GitHub

```powershell
Get-Content "$env:USERPROFILE\.ssh\github_deploy_key"
```

Copy the ENTIRE output including:
- `-----BEGIN OPENSSH PRIVATE KEY-----`
- All the middle lines
- `-----END OPENSSH PRIVATE KEY-----`

## Step 6: Update GitHub Secret

1. Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions
2. Find `VPS_SSH_KEY` and click "Update"
3. Paste the private key (everything from Step 5)
4. Click "Update secret"

## Step 7: Verify All GitHub Secrets

Make sure you have all 5 secrets:

| Secret Name | Value | Where to Get |
|-------------|-------|--------------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username | hub.docker.com |
| `DOCKERHUB_TOKEN` | Docker Hub access token | hub.docker.com → Settings → Security |
| `VPS_HOST` | `213.199.33.174` | Your VPS IP |
| `VPS_USERNAME` | `root` | Your SSH username |
| `VPS_SSH_KEY` | Private key from Step 5 | Full content |

## Step 8: Deploy!

```powershell
git add .
git commit -m "Fix SSH authentication and Docker build"
git push origin master
```

Watch the deployment at: https://github.com/YOUR_USERNAME/YOUR_REPO/actions

## Troubleshooting

### "ssh-keygen is not recognized"

You need to install Git for Windows which includes SSH tools:
https://git-scm.com/download/win

After installation, close and reopen PowerShell.

### "Permission denied" when connecting to VPS

Make sure you:
1. Copied the ENTIRE public key (no line breaks in the middle)
2. Pasted it correctly in authorized_keys
3. Set the correct permissions (chmod 600)

Try adding the key again:

```powershell
# Get your public key again
Get-Content "$env:USERPROFILE\.ssh\github_deploy_key.pub"

# SSH to VPS
ssh root@213.199.33.174

# Edit authorized_keys
nano ~/.ssh/authorized_keys
# Add the key on a NEW line (don't replace existing keys)
# Save: Ctrl+X, Y, Enter

# Fix permissions
chmod 600 ~/.ssh/authorized_keys
exit
```

### Key file has wrong format

Make sure when you copy the private key for GitHub:
- Include the BEGIN line
- Include all middle lines (no missing lines)
- Include the END line
- No extra spaces or characters

### Still not working?

Use this alternative method - copy the key file content directly:

```powershell
# This will show the key in a way that's easier to copy
notepad "$env:USERPROFILE\.ssh\github_deploy_key"
```

Copy everything from Notepad and paste into GitHub secret.

## Quick Test Commands

```powershell
# Check if key files exist
Test-Path "$env:USERPROFILE\.ssh\github_deploy_key"
Test-Path "$env:USERPROFILE\.ssh\github_deploy_key.pub"

# View public key
Get-Content "$env:USERPROFILE\.ssh\github_deploy_key.pub"

# View private key
Get-Content "$env:USERPROFILE\.ssh\github_deploy_key"

# Test SSH connection
ssh -i "$env:USERPROFILE\.ssh\github_deploy_key" root@213.199.33.174
```

## After Successful Setup

Your app will be available at:
- Main app: http://213.199.33.174:3000
- Health check: http://213.199.33.174:3000/health

To check logs on VPS:
```bash
ssh root@213.199.33.174
docker logs -f shark-tank-ai
```
