# Windows Setup Guide for Deployment

## Prerequisites

Make sure you have:
1. Git for Windows installed (includes SSH)
2. PowerShell (comes with Windows)
3. Access to your VPS

## Quick Setup (3 Steps)

### Step 1: Generate SSH Key

Open PowerShell in your project directory and run:

```powershell
.\setup-ssh.ps1
```

This will:
1. Generate a new SSH key
2. Show you the public key
3. Wait for you to add it to your VPS
4. Test the connection
5. Show you the private key for GitHub

### Step 2: Add Public Key to VPS

When the script shows you the public key:

1. Copy the public key (the line starting with `ssh-ed25519`)

2. Open a new PowerShell window and SSH to your VPS:
   ```powershell
   ssh root@213.199.33.174
   ```

3. Add the key:
   ```bash
   mkdir -p ~/.ssh
   echo "PASTE_YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   exit
   ```

4. Go back to the first PowerShell window and press Enter

### Step 3: Update GitHub Secret

1. The script will show you the private key
2. Copy EVERYTHING (including `-----BEGIN` and `-----END` lines)
3. Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions
4. Click on `VPS_SSH_KEY` → Update
5. Paste the private key
6. Click "Update secret"

### Step 4: Deploy

```powershell
git add .
git commit -m "Fix SSH authentication and Docker build"
git push origin master
```

## Alternative: Manual Setup

If the script doesn't work, do it manually:

### 1. Generate SSH Key

```powershell
# Create .ssh directory if it doesn't exist
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.ssh"

# Generate key
ssh-keygen -t ed25519 -C "github-actions" -f "$env:USERPROFILE\.ssh\github_deploy_key"
# Press Enter twice (no passphrase)
```

### 2. Get Public Key

```powershell
Get-Content "$env:USERPROFILE\.ssh\github_deploy_key.pub"
```

Copy the output.

### 3. Add to VPS

```powershell
# SSH to VPS
ssh root@213.199.33.174

# On VPS, run:
mkdir -p ~/.ssh
nano ~/.ssh/authorized_keys
# Paste the public key on a new line
# Press Ctrl+X, then Y, then Enter to save

chmod 600 ~/.ssh/authorized_keys
exit
```

### 4. Test Connection

```powershell
ssh -i "$env:USERPROFILE\.ssh\github_deploy_key" root@213.199.33.174
```

Should connect without asking for password!

### 5. Get Private Key for GitHub

```powershell
Get-Content "$env:USERPROFILE\.ssh\github_deploy_key"
```

Copy EVERYTHING and add to GitHub secret `VPS_SSH_KEY`.

## Test Your Setup

```powershell
.\test-ssh-connection.ps1
```

If this passes, GitHub Actions should work!

## Common Windows Issues

### Issue: "ssh-keygen not found"

Install Git for Windows: https://git-scm.com/download/win

It includes SSH tools.

### Issue: "Execution policy error"

Run PowerShell as Administrator and execute:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then try again.

### Issue: Can't find .ssh directory

```powershell
# Create it
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.ssh"
```

### Issue: Line endings in key file

Windows uses CRLF, but SSH keys need LF. The scripts handle this automatically, but if you copy-paste manually, make sure to use a proper text editor (VS Code, not Notepad).

## Using Git Bash (Alternative)

If you prefer, you can use Git Bash instead of PowerShell:

1. Open Git Bash in your project directory
2. Run the bash scripts:
   ```bash
   chmod +x setup-ssh.sh
   ./setup-ssh.sh
   ```

Git Bash provides a Linux-like environment on Windows.

## Verify All GitHub Secrets

Make sure these are set in GitHub:

| Secret | Value |
|--------|-------|
| DOCKERHUB_USERNAME | Your Docker Hub username |
| DOCKERHUB_TOKEN | Docker Hub access token |
| VPS_HOST | 213.199.33.174 |
| VPS_USERNAME | root |
| VPS_SSH_KEY | Private key content |

## Next Steps

After SSH is working:

1. Push to master
2. Watch GitHub Actions: https://github.com/YOUR_USERNAME/YOUR_REPO/actions
3. Check your app: http://213.199.33.174:3000/health

## Troubleshooting

### PowerShell script won't run

```powershell
# Check execution policy
Get-ExecutionPolicy

# If it's "Restricted", change it:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### SSH connection times out

Check if your firewall is blocking SSH:
```powershell
# Test if port 22 is open
Test-NetConnection -ComputerName 213.199.33.174 -Port 22
```

### Key format issues

Make sure you're copying the ENTIRE key including:
- `-----BEGIN OPENSSH PRIVATE KEY-----`
- All the middle lines
- `-----END OPENSSH PRIVATE KEY-----`

No extra spaces or line breaks!

## Quick Commands Reference

```powershell
# Generate SSH key
ssh-keygen -t ed25519 -f "$env:USERPROFILE\.ssh\github_deploy_key" -N '""'

# View public key
Get-Content "$env:USERPROFILE\.ssh\github_deploy_key.pub"

# View private key
Get-Content "$env:USERPROFILE\.ssh\github_deploy_key"

# Test SSH connection
ssh -i "$env:USERPROFILE\.ssh\github_deploy_key" root@213.199.33.174

# Copy file to VPS
scp -i "$env:USERPROFILE\.ssh\github_deploy_key" deploy.sh root@213.199.33.174:/opt/shark-tank-ai/
```

## Need Help?

See also:
- `FIX_DEPLOYMENT_NOW.md` - Complete deployment guide
- `SSH_KEY_SETUP.md` - Detailed SSH setup
- `GITHUB_ACTIONS_SSH_FIX.md` - Troubleshooting
