# Supabase Secrets Setup for Payment Verification

This guide explains how to configure the required secrets for bank payment verification.

## Required Secrets

| Secret Name | Description | Required |
|------------|-------------|----------|
| `BANK_WEBHOOK_SECRET` | Authentication secret for bank webhook | Yes |
| `BANK_API_PROVIDER` | Bank API provider: `casso` or `sepay` | Yes |
| `CASSO_API_KEY` | Casso API key (if using Casso) | Conditional |
| `SEPAY_API_KEY` | SePay API key (if using SePay) | Conditional |

## Setup Instructions

### Option 1: Using Supabase CLI

Make sure you have the Supabase CLI installed and are logged in:

```bash
# Login to Supabase
supabase login

# Link your project (if not already linked)
supabase link --project-ref bwpnagtehvqfbneknwwt
```

Then set the secrets:

```bash
# Generate a secure webhook secret (use a random string generator)
supabase secrets set BANK_WEBHOOK_SECRET="your-secure-random-secret-min-32-chars"

# Choose your bank API provider
supabase secrets set BANK_API_PROVIDER="casso"

# Set the API key for your chosen provider
# For Casso:
supabase secrets set CASSO_API_KEY="your-casso-api-key"

# For SePay:
supabase secrets set SEPAY_API_KEY="your-sepay-api-key"
```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Edge Functions**
3. Scroll down to **Secrets**
4. Add each secret:
   - `BANK_WEBHOOK_SECRET`: A secure random string (minimum 32 characters)
   - `BANK_API_PROVIDER`: Either `casso` or `sepay`
   - `CASSO_API_KEY` or `SEPAY_API_KEY`: Your API key from the chosen provider

## Getting API Keys

### Casso (https://casso.vn)

1. Sign up at https://casso.vn
2. Connect your bank account
3. Go to **Integration** → **API Keys**
4. Create a new API key
5. Copy the API key and set it as `CASSO_API_KEY`

**Configure Webhook in Casso:**
- URL: `https://bwpnagtehvqfbneknwwt.supabase.co/functions/v1/bank-webhook`
- Method: POST
- Headers: `x-webhook-secret: <your-BANK_WEBHOOK_SECRET>`

### SePay (https://sepay.vn)

1. Sign up at https://sepay.vn
2. Connect your bank account
3. Go to **Settings** → **API**
4. Create a new API key
5. Copy the API key and set it as `SEPAY_API_KEY`

**Configure Webhook in SePay:**
- URL: `https://bwpnagtehvqfbneknwwt.supabase.co/functions/v1/bank-webhook`
- Method: POST
- Headers: `x-webhook-secret: <your-BANK_WEBHOOK_SECRET>`

## Verify Secrets are Set

```bash
# List all secrets (values are hidden)
supabase secrets list
```

## Deploy Edge Functions

After setting secrets, deploy the edge functions:

```bash
supabase functions deploy bank-webhook
supabase functions deploy verify-payment
```

## Security Notes

1. **Never commit secrets to version control** - The actual secret values should never be in `.env` or any committed file
2. **Use strong secrets** - The `BANK_WEBHOOK_SECRET` should be at least 32 characters of random alphanumeric characters
3. **Rotate secrets periodically** - Change your API keys and webhook secrets every few months
4. **Limit API permissions** - Only grant the minimum required permissions to your bank API keys

## Generating a Secure Webhook Secret

You can generate a secure secret using:

```bash
# Using OpenSSL
openssl rand -hex 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using PowerShell
[System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString()
```

## Troubleshooting

### Webhook not receiving requests
- Verify the webhook URL is correct in your bank provider's dashboard
- Check that `x-webhook-secret` header is included
- Check Edge Function logs: `supabase functions logs bank-webhook`

### API verification failing
- Verify the API key is correct
- Check that you've set the correct `BANK_API_PROVIDER` value
- Check Edge Function logs: `supabase functions logs verify-payment`

### 401 Unauthorized errors
- The `BANK_WEBHOOK_SECRET` in your request doesn't match the one set in Supabase
- Make sure there are no extra spaces or characters in the secret

