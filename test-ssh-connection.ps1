# PowerShell Script to Test SSH Connection

$VPS_HOST = "213.199.33.174"
$VPS_USER = "root"
$KEY_PATH = "$env:USERPROFILE\.ssh\github_deploy_key"

Write-Host "🧪 Testing SSH connection to VPS..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Host: $VPS_HOST" -ForegroundColor White
Write-Host "  User: $VPS_USER" -ForegroundColor White
Write-Host "  Key: $KEY_PATH" -ForegroundColor White
Write-Host ""

# Check if key exists
if (-not (Test-Path $KEY_PATH)) {
    Write-Host "❌ SSH key not found at $KEY_PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "1. Run .\setup-ssh.ps1 to generate a new key" -ForegroundColor White
    Write-Host "2. Or use your existing key:" -ForegroundColor White
    Write-Host "   - id_rsa: $env:USERPROFILE\.ssh\id_rsa" -ForegroundColor Gray
    Write-Host "   - id_ed25519: $env:USERPROFILE\.ssh\id_ed25519" -ForegroundColor Gray
    exit 1
}

# Test connection
Write-Host "Testing connection..." -ForegroundColor Cyan
$result = ssh -i $KEY_PATH -o BatchMode=yes -o ConnectTimeout=10 "$VPS_USER@$VPS_HOST" "echo 'Connection successful!'" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ SSH connection works!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Testing deploy script..." -ForegroundColor Cyan
    
    $deployTest = ssh -i $KEY_PATH "$VPS_USER@$VPS_HOST" "test -f /opt/shark-tank-ai/deploy.sh && echo 'Deploy script exists'" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deploy script is ready" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 Everything looks good!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Make sure VPS_SSH_KEY secret in GitHub contains:" -ForegroundColor White
        Get-Content $KEY_PATH
        Write-Host ""
        Write-Host "2. Push to master to trigger deployment" -ForegroundColor White
    } else {
        Write-Host "⚠️  Deploy script not found on VPS" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Upload it with:" -ForegroundColor White
        Write-Host "scp -i $KEY_PATH deploy.sh ${VPS_USER}@${VPS_HOST}:/opt/shark-tank-ai/" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ SSH connection failed!" -ForegroundColor Red
    Write-Host "Error: $result" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting steps:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Check if public key is on VPS:" -ForegroundColor White
    Write-Host "   ssh ${VPS_USER}@${VPS_HOST} 'cat ~/.ssh/authorized_keys'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Add your public key to VPS manually" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Or run the setup script:" -ForegroundColor White
    Write-Host "   .\setup-ssh.ps1" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
