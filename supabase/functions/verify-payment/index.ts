import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Type definitions for order data
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

// Bank API configuration - supports multiple providers
const BANK_API_CONFIG = {
  // Casso API (https://casso.vn)
  casso: {
    apiKey: Deno.env.get("CASSO_API_KEY") || "",
    baseUrl: "https://oauth.casso.vn/v2",
  },
  // SePay API (https://sepay.vn)
  sepay: {
    apiKey: Deno.env.get("SEPAY_API_KEY") || "",
    baseUrl: "https://my.sepay.vn/userapi",
  },
};

const BANK_API_PROVIDER = Deno.env.get("BANK_API_PROVIDER") || "casso";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw new Error("Server configuration error");
    }

    // Use anon key for user auth check
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId, action } = await req.json();

    if (!orderId) {
      return new Response(JSON.stringify({ error: "Order ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get pending order
    const { data: pendingOrder, error: orderError } = await supabaseAdmin
      .from('pending_orders')
      .select('*')
      .eq('order_id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !pendingOrder) {
      return new Response(JSON.stringify({
        error: "Order not found",
        status: 'not_found'
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If order is already verified, return success
    if (pendingOrder.status === 'verified') {
      return new Response(JSON.stringify({
        verified: true,
        status: 'verified',
        message: 'Payment already verified'
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If order is cancelled or expired
    if (pendingOrder.status === 'cancelled' || pendingOrder.status === 'expired') {
      return new Response(JSON.stringify({
        verified: false,
        status: pendingOrder.status,
        message: `Order is ${pendingOrder.status}`
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if order has expired
    if (new Date(pendingOrder.expires_at) < new Date()) {
      await supabaseAdmin
        .from('pending_orders')
        .update({ status: 'expired' })
        .eq('id', pendingOrder.id);

      return new Response(JSON.stringify({
        verified: false,
        status: 'expired',
        message: 'Order has expired'
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle cancel action
    if (action === 'cancel') {
      await supabaseAdmin
        .from('pending_orders')
        .update({ status: 'cancelled' })
        .eq('id', pendingOrder.id);

      return new Response(JSON.stringify({
        verified: false,
        status: 'cancelled',
        message: 'Order cancelled'
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try to verify payment via bank API
    const verificationResult = await verifyPaymentWithBankAPI(
      pendingOrder.payment_content,
      pendingOrder.amount,
      pendingOrder.created_at
    );

    if (verificationResult.verified) {
      // Update pending order as verified
      await supabaseAdmin
        .from('pending_orders')
        .update({
          status: 'verified',
          bank_transaction_id: verificationResult.transactionId,
          verified_at: new Date().toISOString(),
        })
        .eq('id', pendingOrder.id);

      // Process the order
      const orderData = pendingOrder.order_data as OrderData;

      if (pendingOrder.order_type === 'cart') {
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

        await supabaseAdmin
          .from('purchase_history')
          .insert(purchases);
      } else if (pendingOrder.order_type === 'document') {
        const docData = orderData as DocumentOrderData;
        await supabaseAdmin
          .from('purchased_documents')
          .insert({
            user_id: pendingOrder.user_id,
            document_id: docData.document_id,
            price: pendingOrder.amount,
            payment_method: 'bank_transfer',
          });
      }

      return new Response(JSON.stringify({
        verified: true,
        status: 'verified',
        message: 'Payment verified successfully',
        transactionId: verificationResult.transactionId
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Payment not found yet
    return new Response(JSON.stringify({
      verified: false,
      status: 'pending',
      message: 'Payment not yet received'
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Payment verification error:", error);
    return new Response(JSON.stringify({
      error: "Verification failed",
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

interface VerificationResult {
  verified: boolean;
  transactionId?: string;
  amount?: number;
}

async function verifyPaymentWithBankAPI(
  paymentContent: string,
  expectedAmount: number,
  orderCreatedAt: string
): Promise<VerificationResult> {

  const provider = BANK_API_PROVIDER;

  try {
    if (provider === 'casso') {
      return await verifyCasso(paymentContent, expectedAmount, orderCreatedAt);
    } else if (provider === 'sepay') {
      return await verifySepay(paymentContent, expectedAmount, orderCreatedAt);
    } else {
      console.log("No bank API provider configured");
      return { verified: false };
    }
  } catch (error) {
    console.error("Bank API error:", error);
    return { verified: false };
  }
}

async function verifyCasso(
  paymentContent: string,
  expectedAmount: number,
  orderCreatedAt: string
): Promise<VerificationResult> {
  const config = BANK_API_CONFIG.casso;

  if (!config.apiKey) {
    console.log("Casso API key not configured");
    return { verified: false };
  }

  const fromDate = new Date(orderCreatedAt);
  fromDate.setMinutes(fromDate.getMinutes() - 5); // 5 minutes before order

  const response = await fetch(`${config.baseUrl}/transactions`, {
    method: 'GET',
    headers: {
      'Authorization': `Apikey ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.error("Casso API error:", response.status);
    return { verified: false };
  }

  const data = await response.json();

  if (data.data && data.data.records) {
    for (const transaction of data.data.records) {
      // Check if transaction matches
      const description = transaction.description || '';
      const amount = Math.abs(transaction.amount || 0);
      const transactionDate = new Date(transaction.when);

      // Only check incoming transactions after order was created
      if (transaction.amount > 0 && transactionDate >= fromDate) {
        // Check if description contains our payment content
        if (description.toLowerCase().includes(paymentContent.toLowerCase()) ||
            description.includes(paymentContent.split(' ').pop() || '')) {
          // Check if amount matches (allow exact match or greater)
          if (amount >= expectedAmount) {
            return {
              verified: true,
              transactionId: transaction.tid?.toString(),
              amount: amount
            };
          }
        }
      }
    }
  }

  return { verified: false };
}

async function verifySepay(
  paymentContent: string,
  expectedAmount: number,
  orderCreatedAt: string
): Promise<VerificationResult> {
  const config = BANK_API_CONFIG.sepay;

  if (!config.apiKey) {
    console.log("SePay API key not configured");
    return { verified: false };
  }

  const response = await fetch(`${config.baseUrl}/transactions/list`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.error("SePay API error:", response.status);
    return { verified: false };
  }

  const data = await response.json();
  const fromDate = new Date(orderCreatedAt);
  fromDate.setMinutes(fromDate.getMinutes() - 5);

  if (data.transactions && Array.isArray(data.transactions)) {
    for (const transaction of data.transactions) {
      const description = transaction.content || transaction.description || '';
      const amount = Math.abs(transaction.transferAmount || transaction.amount || 0);
      const transactionDate = new Date(transaction.transactionDate);

      // Only check incoming transactions after order was created
      if (transactionDate >= fromDate) {
        if (description.toLowerCase().includes(paymentContent.toLowerCase()) ||
            description.includes(paymentContent.split(' ').pop() || '')) {
          if (amount >= expectedAmount) {
            return {
              verified: true,
              transactionId: transaction.referenceCode?.toString() || transaction.id?.toString(),
              amount: amount
            };
          }
        }
      }
    }
  }

  return { verified: false };
}

