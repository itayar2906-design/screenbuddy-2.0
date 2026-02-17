# Screen Buddy Deployment Script
# Usage: ./scripts/deploy.ps1

Write-Host "Starting Screen Buddy Deployment..." -ForegroundColor Green

# Check for npx/supabase
if (-not (Get-Command "npx" -ErrorAction SilentlyContinue)) {
    Write-Error "npx is not installed. Please install Node.js."
    exit 1
}

$ProjectRef = Read-Host "Enter your Supabase Project Reference ID (copy from Settings > API)"
if ([string]::IsNullOrWhiteSpace($ProjectRef)) {
    Write-Error "Project Reference ID is required."
    exit 1
}

Write-Host "Linking project..." -ForegroundColor Cyan
try {
    # Link project (requires login if not already done)
    # Using specific db password if needed, but usually link prompts interactively
    # We assume 'npx supabase' works interactively in the user's terminal
    cmd /c "npx supabase link --project-ref $ProjectRef"
} catch {
    Write-Warning "Project linking might have failed or required interaction. Continuing..."
}

Write-Host "Pushing Database Changes..." -ForegroundColor Cyan
cmd /c "npx supabase db push"

Write-Host "Deploying Edge Functions..." -ForegroundColor Cyan
$Functions = Get-ChildItem "supabase/functions" -Directory
foreach ($func in $Functions) {
    Write-Host "Deploying $($func.Name)..." -ForegroundColor Yellow
    # Add --no-verify-jwt to verify only if secure token not provided.
    # Usually we want JWT verification for secure functions.
    # But for webhook (stripe-webhook), we definitely need --no-verify-jwt.
    # For others, we might want it.
    
    if ($func.Name -eq "stripe-webhook") {
        cmd /c "npx supabase functions deploy $($func.Name) --project-ref $ProjectRef --no-verify-jwt"
    } else {
        cmd /c "npx supabase functions deploy $($func.Name) --project-ref $ProjectRef"
    }
}

Write-Host "Deployment Complete! 🚀" -ForegroundColor Green
Write-Host "1. Go to Supabase Dashboard > Authentication > URL Configuration."
Write-Host "2. Add your app's deep link redirect URL (e.g., screenbuddy://*)."
Write-Host "3. Copy the Project URL and Anon Key to your .env file."
