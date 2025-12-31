# Bank Payment Verification System

This document describes how to set up and use the bank webhook and transaction verification API for automatic payment confirmation.

## Overview

The system supports two methods for payment verification:

1. **Webhook (Recommended)**: Bank sends payment notifications to your webhook endpoint
2. **Polling API**: Your app periodically checks for payment confirmation

## Supported Bank API Providers

- [Casso](https://casso.vn) - Vietnamese bank transaction monitoring
- [SePay](https://sepay.vn) - Payment gateway with transaction webhooks

## Setup

### 1. Database Migration

Run the migration to create the required tables:

```bash
supabase db push
```

This creates:
- `pending_orders` - Tracks orders awaiting payment
- `bank_transactions` - Logs all incoming bank notifications

### 2. Environment Variables

Set these secrets in your Supabase project:

```bash
# Bank webhook authentication
supabase secrets set BANK_WEBHOOK_SECRET="your-secure-webhook-secret"

# Choose your bank API provider: "casso" or "sepay"
supabase secrets set BANK_API_PROVIDER="casso"

# For Casso
supabase secrets set CASSO_API_KEY="your-casso-api-key"

# For SePay
supabase secrets set SEPAY_API_KEY="your-sepay-api-key"
```

**For detailed setup instructions, see: [`supabase/SECRETS_SETUP.md`](../supabase/SECRETS_SETUP.md)**

**Quick setup with PowerShell:**
```powershell
cd supabase
.\setup-secrets.ps1 -BankProvider "casso" -CassoApiKey "your-api-key"
```

### 3. Deploy Edge Functions

```bash
supabase functions deploy bank-webhook
supabase functions deploy verify-payment
```

### 4. Configure Bank Webhook

Configure your bank API provider to send webhooks to:

```
https://<your-project-ref>.supabase.co/functions/v1/bank-webhook
```

Add the header:
```
x-webhook-secret: your-secure-webhook-secret
```

## How It Works

### Payment Flow

1. User initiates payment → App creates pending order in database
2. User completes bank transfer with order ID in description
3. Payment verification happens via:
   - **Webhook**: Bank sends notification → Webhook verifies and processes order
   - **Polling**: App polls verify-payment endpoint every 5 seconds
4. Order marked as verified → Purchase records created

### Auto-Verification

The payment dialogs automatically:
- Create pending orders when opened
- Poll for payment verification every 5 seconds
- Listen for real-time database updates (faster than polling)
- Show verification status to user

### Manual Verification

Users can click "Tôi đã thanh toán" to manually trigger verification check.

## Bank Account Configuration

Edit `BANK_CONFIG` in the payment dialog components:

```typescript
const BANK_CONFIG = {
  bankId: "MB",
  bankName: "Ngân hàng TMCP Quân đội",
  accountNumber: "0773702777",
  accountName: "LUONG THUY TRANG",
};
```

## Expected Payment Description Format

The system expects payments with descriptions like:
- `Thanh toan ORD-ABC123`
- Contains the order ID generated when payment dialog opens

## Webhook Payload Formats

The webhook supports multiple formats:

### Casso Format
```json
{
  "data": [
    {
      "tid": "123456",
      "amount": 100000,
      "description": "Thanh toan ORD-ABC123",
      "when": "2025-01-01T10:00:00Z"
    }
  ]
}
```

### SePay Format
```json
{
  "referenceCode": "123456",
  "transferAmount": 100000,
  "content": "Thanh toan ORD-ABC123",
  "transactionDate": "2025-01-01T10:00:00Z"
}
```

## Troubleshooting

### Payment not being verified

1. Check that order ID in payment description matches exactly
2. Verify amount is equal to or greater than expected
3. Check Supabase function logs for errors
4. Ensure bank API keys are correctly configured

### Webhook not receiving data

1. Verify webhook URL is correct
2. Check x-webhook-secret header is set correctly
3. Test with Casso/SePay webhook testing tools

## Security

- Webhook requires secret header authentication
- User can only view/modify their own pending orders (RLS)
- Service role required for webhook to update orders
- Bank transactions table only accessible by service role

