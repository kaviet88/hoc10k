# Test Bank Webhook Endpoint
# This script tests the bank-webhook edge function locally or on Supabase

param(
    [string]$Endpoint = "https://bwpnagtehvqfbneknwwt.supabase.co/functions/v1/bank-webhook",
    [string]$WebhookSecret = "test-webhook-secret",
    [switch]$Local
)

# If testing locally, use the local URL
if ($Local) {
    $Endpoint = "http://localhost:54321/functions/v1/bank-webhook"
}

Write-Host "=== Bank Webhook Endpoint Test ===" -ForegroundColor Cyan
Write-Host "Endpoint: $Endpoint" -ForegroundColor Gray
Write-Host "Using Secret: $($WebhookSecret.Substring(0, [Math]::Min(10, $WebhookSecret.Length)))..." -ForegroundColor Gray
Write-Host ""

# Test Cases
$testCases = @(
    @{
        Name = "Test 1: Missing webhook secret"
        Headers = @{
            "Content-Type" = "application/json"
        }
        Body = @{
            transactionId = "TEST001"
            amount = 100000
            description = "Thanh toan ORD-TEST123"
            type = "credit"
        }
        ExpectedStatus = 401
    },
    @{
        Name = "Test 2: Invalid webhook secret"
        Headers = @{
            "Content-Type" = "application/json"
            "x-webhook-secret" = "wrong-secret"
        }
        Body = @{
            transactionId = "TEST002"
            amount = 100000
            description = "Thanh toan ORD-TEST123"
            type = "credit"
        }
        ExpectedStatus = 401
    },
    @{
        Name = "Test 3: Valid Casso format webhook"
        Headers = @{
            "Content-Type" = "application/json"
            "x-webhook-secret" = $WebhookSecret
        }
        Body = @{
            data = @(
                @{
                    tid = "CASSO001"
                    amount = 150000
                    description = "Thanh toan ORD-TESTCASSO"
                    when = "2025-12-31T10:00:00Z"
                    subAccId = "0773702777"
                    bankSubAccId = "MB"
                }
            )
        }
        ExpectedStatus = 200
    },
    @{
        Name = "Test 4: Valid SePay format webhook"
        Headers = @{
            "Content-Type" = "application/json"
            "x-webhook-secret" = $WebhookSecret
        }
        Body = @{
            referenceCode = "SEPAY001"
            transferAmount = 200000
            content = "Thanh toan ORD-TESTSEPAY"
            transactionDate = "2025-12-31T11:00:00Z"
            accountNumber = "0773702777"
            gateway = "MB"
        }
        ExpectedStatus = 200
    },
    @{
        Name = "Test 5: Simple transaction format"
        Headers = @{
            "Content-Type" = "application/json"
            "x-webhook-secret" = $WebhookSecret
        }
        Body = @{
            transactionId = "SIMPLE001"
            amount = 100000
            description = "Thanh toan ORD-TESTSIMPLE"
            type = "credit"
            accountNumber = "0773702777"
        }
        ExpectedStatus = 200
    },
    @{
        Name = "Test 6: GET method (should be rejected)"
        Method = "GET"
        Headers = @{
            "x-webhook-secret" = $WebhookSecret
        }
        Body = $null
        ExpectedStatus = 405
    },
    @{
        Name = "Test 7: OPTIONS preflight request"
        Method = "OPTIONS"
        Headers = @{}
        Body = $null
        ExpectedStatus = 200
    }
)

$passed = 0
$failed = 0

foreach ($test in $testCases) {
    Write-Host "`n$($test.Name)" -ForegroundColor Yellow
    Write-Host ("-" * 50)

    $method = if ($test.Method) { $test.Method } else { "POST" }

    try {
        $params = @{
            Uri = $Endpoint
            Method = $method
            Headers = $test.Headers
            ContentType = "application/json"
            ErrorAction = "Stop"
            UseBasicParsing = $true
        }

        if ($test.Body) {
            $params.Body = ($test.Body | ConvertTo-Json -Depth 10)
        }

        $response = Invoke-WebRequest @params
        $statusCode = $response.StatusCode
        $responseBody = $response.Content
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        try {
            $responseBody = $_.ErrorDetails.Message
        }
        catch {
            $responseBody = $_.Exception.Message
        }
    }

    Write-Host "  Method: $method"
    Write-Host "  Expected Status: $($test.ExpectedStatus)"
    Write-Host "  Actual Status: $statusCode"

    if ($responseBody) {
        try {
            $jsonResponse = $responseBody | ConvertFrom-Json
            Write-Host "  Response: $($jsonResponse | ConvertTo-Json -Compress)" -ForegroundColor Gray
        }
        catch {
            Write-Host "  Response: $responseBody" -ForegroundColor Gray
        }
    }

    if ($statusCode -eq $test.ExpectedStatus) {
        Write-Host "  Result: PASSED" -ForegroundColor Green
        $passed++
    }
    else {
        Write-Host "  Result: FAILED" -ForegroundColor Red
        $failed++
    }
}

Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($failed -gt 0) {
    Write-Host "Some tests failed. This may be expected if:" -ForegroundColor Yellow
    Write-Host "  1. The webhook secret hasn't been configured yet"
    Write-Host "  2. The edge function hasn't been deployed"
    Write-Host "  3. Supabase environment variables are not set"
    Write-Host ""
    Write-Host "To deploy the function:" -ForegroundColor Cyan
    Write-Host "  supabase functions deploy bank-webhook"
    Write-Host ""
    Write-Host "To set the webhook secret:" -ForegroundColor Cyan
    Write-Host "  supabase secrets set BANK_WEBHOOK_SECRET=`"$WebhookSecret`""
}

