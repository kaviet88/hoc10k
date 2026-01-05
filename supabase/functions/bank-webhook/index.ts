import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

// Bank webhook secret for authentication (should be set in Supabase secrets)
const WEBHOOK_SECRET = Deno.env.get("BANK_WEBHOOK_SECRET") || "your-webhook-secret";

// Expected bank account for verification
const EXPECTED_ACCOUNT = "0773702777";

interface BankTransaction {
  id: string;
  transactionId: string;
  bankCode: string;
  accountNumber: string;
  amount: number;
  description: string;
  transactionDate: string;
  type: 'credit' | 'debit';
}

interface CartItem {
  id: string;
  type: string;
  name: string;
  duration: string;
  price: number;
}

interface CartOrderData {
  items: CartItem[];
}

interface DocumentOrderData {
  document_id: string;
  title: string;
}

type OrderData = CartOrderData | DocumentOrderData;

// Webhook payloads can have arbitrary structure from different bank providers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WebhookPayload = Record<string, any>;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Verify webhook secret
    const webhookSecret = req.headers.get('x-webhook-secret');
    if (webhookSecret !== WEBHOOK_SECRET) {
      console.error("Invalid webhook secret");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase configuration missing");
      throw new Error("Server configuration error");
    }

    // Use service role for webhook operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log("Received webhook payload:", JSON.stringify(body));

    // Parse transaction data - adapt this based on your bank's webhook format
    // This example supports common Vietnamese bank webhook formats (Casso, SePay, etc.)
    const transactions: BankTransaction[] = parseTransactions(body);

    const results = [];

    for (const transaction of transactions) {
      console.log("Processing transaction:", transaction.transactionId);

      // Only process credit (incoming) transactions to expected account
      if (transaction.type !== 'credit') {
        console.log("Skipping non-credit transaction");
        continue;
      }

      if (transaction.accountNumber !== EXPECTED_ACCOUNT) {
        console.log("Skipping transaction to different account");
        continue;
      }

      // Log the bank transaction
      const { error: logError } = await supabase
        .from('bank_transactions')
        .upsert({
          transaction_id: transaction.transactionId,
          bank_code: transaction.bankCode,
          account_number: transaction.accountNumber,
          amount: transaction.amount,
          description: transaction.description,
          transaction_date: transaction.transactionDate,
          raw_data: body,
        }, {
          onConflict: 'transaction_id'
        });

      if (logError) {
        console.error("Failed to log transaction:", logError);
      }

      // Extract order ID from transaction description
      // Expected format: "Thanh toan ORDER_ID" or contains the order ID
      const orderId = extractOrderId(transaction.description);

      if (!orderId) {
        console.log("Could not extract order ID from description:", transaction.description);
        results.push({
          transactionId: transaction.transactionId,
          status: 'no_order_id',
          message: 'Could not extract order ID from description'
        });
        continue;
      }

      // Find matching pending order
      const { data: pendingOrder, error: findError } = await supabase
        .from('pending_orders')
        .select('*')
        .eq('order_id', orderId)
        .eq('status', 'pending')
        .single();

      if (findError || !pendingOrder) {
        console.log("No matching pending order found for:", orderId);
        results.push({
          transactionId: transaction.transactionId,
          orderId,
          status: 'no_match',
          message: 'No matching pending order found'
        });
        continue;
      }

      // Verify amount matches
      if (transaction.amount < pendingOrder.amount) {
        console.log("Amount mismatch:", transaction.amount, "vs expected:", pendingOrder.amount);
        results.push({
          transactionId: transaction.transactionId,
          orderId,
          status: 'amount_mismatch',
          message: `Amount ${transaction.amount} is less than expected ${pendingOrder.amount}`
        });
        continue;
      }

      // Update pending order as verified
      const { error: updateError } = await supabase
        .from('pending_orders')
        .update({
          status: 'verified',
          bank_transaction_id: transaction.transactionId,
          verified_at: new Date().toISOString(),
        })
        .eq('id', pendingOrder.id);

      if (updateError) {
        console.error("Failed to update pending order:", updateError);
        results.push({
          transactionId: transaction.transactionId,
          orderId,
          status: 'update_failed',
          message: 'Failed to update order status'
        });
        continue;
      }

      // Update bank_transaction with matched order
      await supabase
        .from('bank_transactions')
        .update({
          matched_order_id: orderId,
          processed_at: new Date().toISOString(),
        })
        .eq('transaction_id', transaction.transactionId);

      // Process the order based on type
      const orderData = pendingOrder.order_data as OrderData;

      if (pendingOrder.order_type === 'cart') {
        // Insert purchases for cart items
        const cartData = orderData as CartOrderData;
        const purchases = cartData.items.map((item: CartItem) => ({
          user_id: pendingOrder.user_id,
          program_id: item.id,
          program_type: item.type,
          program_name: item.name,
          duration: item.duration,
          price: item.price,
          payment_method: 'bank_transfer',
        }));

        const { error: purchaseError } = await supabase
          .from('purchase_history')
          .insert(purchases);

        if (purchaseError) {
          console.error("Failed to create purchase history:", purchaseError);
        }
      } else if (pendingOrder.order_type === 'document') {
        // Insert purchased document record
        const docData = orderData as DocumentOrderData;
        const { error: docError } = await supabase
          .from('purchased_documents')
          .insert({
            user_id: pendingOrder.user_id,
            document_id: docData.document_id,
            price: pendingOrder.amount,
            payment_method: 'bank_transfer',
          });

        if (docError) {
          console.error("Failed to create purchased document:", docError);
        }
      }

      console.log("Successfully verified payment for order:", orderId);
      results.push({
        transactionId: transaction.transactionId,
        orderId,
        status: 'verified',
        message: 'Payment verified and order processed'
      });
    }

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      results
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Webhook processing error:", error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Parse transactions from various webhook formats
function parseTransactions(body: WebhookPayload): BankTransaction[] {
  const transactions: BankTransaction[] = [];

  // Format 1: Casso webhook format
  if (body.data && Array.isArray(body.data)) {
    for (const item of body.data) {
      transactions.push({
        id: item.id?.toString() || '',
        transactionId: item.tid?.toString() || item.transactionId?.toString() || '',
        bankCode: item.bankSubAccId || item.bankCode || 'MB',
        accountNumber: item.subAccId || item.accountNumber || '',
        amount: Math.abs(item.amount || 0),
        description: item.description || item.content || '',
        transactionDate: item.when || item.transactionDate || new Date().toISOString(),
        type: (item.amount > 0 || item.type === 'IN') ? 'credit' : 'debit',
      });
    }
  }
  // Format 2: SePay/PayOS format
  else if (body.content || body.transferAmount) {
    transactions.push({
      id: body.id?.toString() || '',
      transactionId: body.referenceCode?.toString() || body.transactionId?.toString() || '',
      bankCode: body.gateway || 'MB',
      accountNumber: body.accountNumber || EXPECTED_ACCOUNT,
      amount: Math.abs(body.transferAmount || body.amount || 0),
      description: body.content || body.description || '',
      transactionDate: body.transactionDate || new Date().toISOString(),
      type: 'credit',
    });
  }
  // Format 3: Simple array format
  else if (Array.isArray(body)) {
    for (const item of body) {
      transactions.push({
        id: item.id?.toString() || '',
        transactionId: item.transactionId?.toString() || item.tid?.toString() || '',
        bankCode: item.bankCode || 'MB',
        accountNumber: item.accountNumber || EXPECTED_ACCOUNT,
        amount: Math.abs(item.amount || 0),
        description: item.description || item.content || '',
        transactionDate: item.transactionDate || new Date().toISOString(),
        type: item.type === 'credit' || item.amount > 0 ? 'credit' : 'debit',
      });
    }
  }
  // Format 4: Single transaction object
  else if (body.transactionId || body.amount) {
    transactions.push({
      id: body.id?.toString() || '',
      transactionId: body.transactionId?.toString() || '',
      bankCode: body.bankCode || 'MB',
      accountNumber: body.accountNumber || EXPECTED_ACCOUNT,
      amount: Math.abs(body.amount || 0),
      description: body.description || body.content || '',
      transactionDate: body.transactionDate || new Date().toISOString(),
      type: body.type === 'credit' || body.amount > 0 ? 'credit' : 'debit',
    });
  }

  return transactions;
}

// Extract order ID from transaction description
function extractOrderId(description: string): string | null {
  if (!description) return null;

  // Pattern 1: "Thanh toan ORDER_ID"
  const pattern1 = /Thanh\s*toan\s+(\S+)/i;
  const match1 = description.match(pattern1);
  if (match1) return match1[1];

  // Pattern 2: "ORD-" prefix
  const pattern2 = /ORD-[A-Z0-9]+/i;
  const match2 = description.match(pattern2);
  if (match2) return match2[0];

  // Pattern 3: Look for UUID-like pattern
  const pattern3 = /[A-Z0-9]{8,}/i;
  const match3 = description.match(pattern3);
  if (match3) return match3[0];

  return null;
}

