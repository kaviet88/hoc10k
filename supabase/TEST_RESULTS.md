# Bank Webhook Integration Test Results

## Test Date: December 31, 2025

## Summary

| Category | Status |
|----------|--------|
| Webhook Authentication | ✅ Working (rejects unauthorized requests) |
| CORS Preflight | ✅ Working |
| Logic Unit Tests | ✅ 12/12 Passed |
| Full Integration | ⚠️ Needs secret configuration |

## Endpoint Tests

### ✅ Authentication Tests (PASSED)
| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| Missing webhook secret | 401 | 401 | ✅ PASSED |
| Invalid webhook secret | 401 | 401 | ✅ PASSED |
| OPTIONS preflight | 200 | 200 | ✅ PASSED |

### ⚠️ Authorization Tests (Pending Secret Configuration)
| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| Valid Casso format | 200 | 401 | ⚠️ Needs secret |
| Valid SePay format | 200 | 401 | ⚠️ Needs secret |
| Simple transaction | 200 | 401 | ⚠️ Needs secret |

## Logic Unit Tests

### ✅ All Logic Tests PASSED (12/12)
| Test | Status |
|------|--------|
| Parse Casso format webhook | ✅ |
| Parse SePay format webhook | ✅ |
| Parse simple transaction format | ✅ |
| Parse array format with multiple transactions | ✅ |
| Handle negative amount as debit | ✅ |
| Extract order ID from "Thanh toan ORD-XXX" format | ✅ |
| Extract order ID with ORD- prefix in middle of text | ✅ |
| Extract UUID-like order ID | ✅ |
| Extract order ID case insensitively | ✅ |
| Fallback pattern may match long strings | ✅ |
| Return null when no pattern matches | ✅ |
| Handle empty description | ✅ |

## Configuration Required

The webhook endpoint is deployed and working correctly. It properly rejects unauthorized requests.

### Step 1: Set Secrets in Supabase Dashboard

Since CLI access is restricted, configure secrets via the Dashboard:

1. Open: **https://supabase.com/dashboard/project/bwpnagtehvqfbneknwwt/settings/functions**
2. Scroll to **"Secrets"** section
3. Click **"Add new secret"** and add these:

| Name | Value | Description |
|------|-------|-------------|
| `BANK_WEBHOOK_SECRET` | `hoc10k-webhook-2025-secure-key` | Any secure random string (32+ chars) |
| `BANK_API_PROVIDER` | `casso` | or `sepay` depending on your bank provider |
| `CASSO_API_KEY` | `<your-key>` | Get from https://casso.vn (if using Casso) |
| `SEPAY_API_KEY` | `<your-key>` | Get from https://sepay.vn (if using SePay) |

### Step 2: Configure Bank Provider Webhook

In your bank provider's dashboard (Casso or SePay), set:

- **Webhook URL:** `https://bwpnagtehvqfbneknwwt.supabase.co/functions/v1/bank-webhook`
- **Method:** POST
- **Header:** `x-webhook-secret: <same-value-as-BANK_WEBHOOK_SECRET>`

### Step 3: Verify Configuration

After configuring secrets, run:
```powershell
cd supabase
.\test-bank-webhook.ps1 -WebhookSecret "hoc10k-webhook-2025-secure-key"
```

## Re-run Tests

After configuring secrets, run:
```powershell
cd supabase
.\test-bank-webhook.ps1 -WebhookSecret "<your-secret>"
```

Or run logic tests:
```powershell
npx tsx supabase/test-webhook-logic.ts
```

