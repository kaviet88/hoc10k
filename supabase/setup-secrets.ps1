# Supabase Secrets Setup Script for Payment Verification
# Run this script after setting up your bank API provider account

param(
    [string]$WebhookSecret = "",
    [string]$BankProvider = "casso",
    [string]$CassoApiKey = "",
    [string]$SepayApiKey = ""
)

Write-Host "=== Supabase Payment Verification Secrets Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
try {
    $supabaseVersion = supabase --version 2>$null
    Write-Host "✓ Supabase CLI found: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Supabase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "  npm install -g supabase" -ForegroundColor Yellow
    Write-Host "  or visit: https://supabase.com/docs/guides/cli" -ForegroundColor Yellow
    exit 1
}

# Generate webhook secret if not provided
if ([string]::IsNullOrEmpty($WebhookSecret)) {
    Write-Host "Generating a secure webhook secret..." -ForegroundColor Yellow
    $WebhookSecret = [System.Guid]::NewGuid().ToString().Replace("-", "") + [System.Guid]::NewGuid().ToString().Replace("-", "")
    Write-Host "Generated secret: $WebhookSecret" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Setting Supabase secrets..." -ForegroundColor Yellow
Write-Host ""

# Set BANK_WEBHOOK_SECRET
Write-Host "1. Setting BANK_WEBHOOK_SECRET..." -ForegroundColor Cyan
supabase secrets set BANK_WEBHOOK_SECRET="$WebhookSecret"
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ BANK_WEBHOOK_SECRET set successfully" -ForegroundColor Green
} else {
    Write-Host "   ✗ Failed to set BANK_WEBHOOK_SECRET" -ForegroundColor Red
}

# Set BANK_API_PROVIDER
Write-Host "2. Setting BANK_API_PROVIDER to '$BankProvider'..." -ForegroundColor Cyan
supabase secrets set BANK_API_PROVIDER="$BankProvider"
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ BANK_API_PROVIDER set successfully" -ForegroundColor Green
} else {
    Write-Host "   ✗ Failed to set BANK_API_PROVIDER" -ForegroundColor Red
}

# Set API key based on provider
if ($BankProvider -eq "casso") {
    if (-not [string]::IsNullOrEmpty($CassoApiKey)) {
        Write-Host "3. Setting CASSO_API_KEY..." -ForegroundColor Cyan
        supabase secrets set CASSO_API_KEY="$CassoApiKey"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✓ CASSO_API_KEY set successfully" -ForegroundColor Green
        } else {
            Write-Host "   ✗ Failed to set CASSO_API_KEY" -ForegroundColor Red
        }
    } else {
        Write-Host "3. Skipping CASSO_API_KEY (not provided)" -ForegroundColor Yellow
        Write-Host "   Run later: supabase secrets set CASSO_API_KEY=`"your-api-key`"" -ForegroundColor Gray
    }
} elseif ($BankProvider -eq "sepay") {
    if (-not [string]::IsNullOrEmpty($SepayApiKey)) {
        Write-Host "3. Setting SEPAY_API_KEY..." -ForegroundColor Cyan
        supabase secrets set SEPAY_API_KEY="$SepayApiKey"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✓ SEPAY_API_KEY set successfully" -ForegroundColor Green
        } else {
            Write-Host "   ✗ Failed to set SEPAY_API_KEY" -ForegroundColor Red
        }
    } else {
        Write-Host "3. Skipping SEPAY_API_KEY (not provided)" -ForegroundColor Yellow
        Write-Host "   Run later: supabase secrets set SEPAY_API_KEY=`"your-api-key`"" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=== Configuration Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Webhook URL for your bank provider:" -ForegroundColor Yellow
Write-Host "  https://bwpnagtehvqfbneknwwt.supabase.co/functions/v1/bank-webhook" -ForegroundColor White
Write-Host ""
Write-Host "Required header:" -ForegroundColor Yellow
Write-Host "  x-webhook-secret: $WebhookSecret" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT: Save this webhook secret! You'll need it to configure your bank provider." -ForegroundColor Red
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Configure the webhook URL in your bank provider (Casso/SePay)" -ForegroundColor White
Write-Host "  2. Add the x-webhook-secret header with the secret above" -ForegroundColor White
Write-Host "  3. Deploy edge functions: supabase functions deploy bank-webhook" -ForegroundColor White
Write-Host "  4. Deploy edge functions: supabase functions deploy verify-payment" -ForegroundColor White
Write-Host ""

# List current secrets
Write-Host "Current Supabase secrets:" -ForegroundColor Yellow
supabase secrets list

