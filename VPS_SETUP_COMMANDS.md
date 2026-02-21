# VPS Setup Commands

## Step-by-Step VPS Setup

### Step 1: Connect to Your VPS

```bash
# Replace with your VPS IP and username
ssh root@213.199.33.174
```

### Step 2: Run the Setup Script

You have two options:

#### Option A: Copy-Paste Method (Recommended)

1. Open the `vps-setup.sh` file from your project
2. Copy the entire content
3. On your VPS, run:

```bash
# Create the setup script
cat > vps-setup.sh << 'ENDOFFILE'
# Paste the entire content of vps-setup.sh here
ENDOFFILE

# Make it executable
chmod +x vps-setup.sh

# Run it
sudo bash vps-setup.sh
```

#### Option B: Upload from Local Machine

```bash
# On your local machine (not on VPS)
scp vps-setup.sh root@213.199.33.174:/root/

# Then SSH to VPS
ssh root@213.199.33.174

# Make it executable and run
chmod +x vps-setup.sh
sudo bash vps-setup.sh
```

### Step 3: Upload deploy.sh Script

After setup completes, upload the deploy script:

```bash
# On your local machine
# First, edit deploy.sh and replace YOUR_DOCKERHUB_USERNAME with your actual username

# Then upload it
scp deploy.sh root@213.199.33.174:/opt/shark-tank-ai/

# SSH to VPS and make it executable
ssh root@213.199.33.174
chmod +x /opt/shark-tank-ai/deploy.sh
```

### Step 4: Configure Environment Variables

```bash
# On VPS
nano /opt/shark-tank-ai/.env
```

Copy your local `.env` content and paste it. Then save:
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

### Step 5: Test Manual Deployment (Optional)

```bash
# On VPS
cd /opt/shark-tank-ai
./deploy.sh
```

This will fail the first time because the Docker image doesn't exist yet. That's OK!

### Step 6: Configure Firewall (Optional but Recommended)

```bash
# On VPS
ufw allow 22/tcp    # SSH
ufw allow 3000/tcp  # Your app
ufw enable
ufw status
```

## Complete Command Sequence

Here's everything in one go:

```bash
# 1. Connect to VPS
ssh root@213.199.33.174

# 2. Create and run setup script (paste vps-setup.sh content)
cat > vps-setup.sh << 'ENDOFFILE'
[paste entire vps-setup.sh content here]
ENDOFFILE

chmod +x vps-setup.sh
sudo bash vps-setup.sh

# 3. Exit VPS
exit

# 4. Upload deploy script (on local machine)
# First edit deploy.sh with your Docker Hub username!
scp deploy.sh root@213.199.33.174:/opt/shark-tank-ai/

# 5. SSH back and configure
ssh root@213.199.33.174
chmod +x /opt/shark-tank-ai/deploy.sh

# 6. Edit environment variables
nano /opt/shark-tank-ai/.env
# Paste your .env content, then Ctrl+X, Y, Enter

# 7. Configure firewall
ufw allow 22/tcp
ufw allow 3000/tcp
ufw enable

# 8. Done! Exit VPS
exit
```

## Verify Setup

After setup, verify everything is ready:

```bash
# On VPS
ssh root@213.199.33.174

# Check Docker is installed
docker --version

# Check directory structure
ls -la /opt/shark-tank-ai/

# Should show:
# - deploy.sh (executable)
# - .env (with your variables)
# - data/ directory

# Check .env file (don't share this output!)
cat /opt/shark-tank-ai/.env
```

## What Happens Next?

Once VPS is set up and GitHub secrets are configured:

1. Edit `deploy.sh` locally with your Docker Hub username
2. Commit and push to master:
   ```bash
   git add .
   git commit -m "Configure deployment"
   git push origin master
   ```
3. GitHub Actions will automatically:
   - Build Docker image
   - Push to Docker Hub
   - SSH to VPS
   - Run deploy.sh
   - Start your app

4. Access your app at: `http://213.199.33.174:3000`

## Troubleshooting

### Can't connect to VPS
```bash
# Check if SSH port is correct
ssh -p 22 root@213.199.33.174

# Try with verbose output
ssh -v root@213.199.33.174
```

### Permission denied
```bash
# Make sure you're using the right username
ssh ubuntu@213.199.33.174  # Try ubuntu instead of root
```

### Docker not found after setup
```bash
# Reload shell
source ~/.bashrc

# Or logout and login again
exit
ssh root@213.199.33.174
```
