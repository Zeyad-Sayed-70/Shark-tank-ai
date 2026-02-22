# PowerShell Script for SSH Key Setup on Windows

Write-Host "Setting up SSH key for GitHub Actions deployment..." -ForegroundColor Green
Write-Host ""

# Configuration
$VPS_HOST = "213.199.33.174"
$VPS_USER = "root"
$SSH_DIR = "$env:USERPROFILE\.ssh"
$KEY_PATH = "$SSH_DIR\github_deploy_key"

# Create .ssh directory if it doesn't exist
if (-not (Test-Path $SSH_DIR)) {
    Write-Host "Creating .ssh directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $SSH_DIR | Out-Null
}

# Check if key already exists
if (Test-Path $KEY_PATH) {
    Write-Host "SSH key already exists at $KEY_PATH" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -eq "y" -or $overwrite -eq "Y") {
        Remove-Item "$KEY_PATH*" -Force
        Write-Host "Generating new key..." -ForegroundColor Cyan
        ssh-keygen -t ed25519 -C "github-actions-deploy" -f $KEY_PATH -N ""
    }
    else {
        Write-Host "Using existing key..." -ForegroundColor Cyan
    }
}
else {
    Write-Host "Generating new SSH key..." -ForegroundColor Cyan
    ssh-keygen -t ed25519 -C "github-actions-deploy" -f $KEY_PATH -N ""
}

Write-Host ""
Write-Host "Now we need to copy the public key to your VPS..." -ForegroundColor Cyan
Write-Host ""

# Read the public key
$publicKey = Get-Content "$KEY_PATH.pub"

Write-Host "Your public key is:" -ForegroundColor Yellow
Write-Host $publicKey -ForegroundColor White
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "MANUAL STEP REQUIRED:" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Copy the public key above (the line starting with 'ssh-ed25519')" -ForegroundColor White
Write-Host ""
Write-Host "2. SSH to your VPS and add the key:" -ForegroundColor White
Write-Host "   ssh $VPS_USER@$VPS_HOST" -ForegroundColor Gray
Write-Host "   mkdir -p ~/.ssh" -ForegroundColor Gray
Write-Host "   echo 'PASTE_PUBLIC_KEY_HERE' >> ~/.ssh/authorized_keys" -ForegroundColor Gray
Write-Host "   chmod 600 ~/.ssh/authorized_keys" -ForegroundColor Gray
Write-Host "   exit" -ForegroundColor Gray
Write-Host ""

$continue = Read-Host "Press Enter after you've added the key to your VPS"

Write-Host ""
Write-Host "Testing SSH connection..." -ForegroundColor Cyan

# Test connection
$testResult = ssh -i $KEY_PATH -o BatchMode=yes -o ConnectTimeout=5 "$VPS_USER@$VPS_HOST" "echo 'Connection successful!'" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "SSH connection test passed!" -ForegroundColor Green
}
else {
    Write-Host "SSH connection test failed!" -ForegroundColor Red
    Write-Host "Error: $testResult" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please make sure you added the public key correctly to your VPS." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "SSH Setup Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Copy the PRIVATE KEY below to GitHub:" -ForegroundColor White
Write-Host "   - Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions" -ForegroundColor Gray
Write-Host "   - Update secret: VPS_SSH_KEY" -ForegroundColor Gray
Write-Host "   - Paste the ENTIRE content below (including BEGIN and END lines)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Verify other GitHub secrets are set:" -ForegroundColor White
Write-Host "   - VPS_HOST: $VPS_HOST" -ForegroundColor Gray
Write-Host "   - VPS_USERNAME: $VPS_USER" -ForegroundColor Gray
Write-Host "   - VPS_PORT: 22 (optional)" -ForegroundColor Gray
Write-Host ""
Write-Host "================================================" -ForegroundColor Yellow
Write-Host "PRIVATE KEY (Copy everything below):" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow
Get-Content $KEY_PATH
Write-Host "================================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Keep this private key secure!" -ForegroundColor Red
Write-Host "Never commit it to your repository!" -ForegroundColor Red
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
