-- Create pending_orders table to track orders awaiting payment verification
CREATE TABLE IF NOT EXISTS public.pending_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('cart', 'document')),
  order_data JSONB NOT NULL, -- Store cart items or document info
  payment_content TEXT NOT NULL, -- The expected payment description
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'cancelled', 'expired')),
  bank_transaction_id TEXT, -- Bank's transaction reference
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 minutes'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pending_orders_order_id ON public.pending_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_pending_orders_user_id ON public.pending_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_orders_status ON public.pending_orders(status);
CREATE INDEX IF NOT EXISTS idx_pending_orders_payment_content ON public.pending_orders(payment_content);

-- Enable RLS
ALTER TABLE public.pending_orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own pending orders
CREATE POLICY "pending_orders_select_own"
ON public.pending_orders
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own pending orders
CREATE POLICY "pending_orders_insert_own"
ON public.pending_orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending orders (for cancellation)
CREATE POLICY "pending_orders_update_own"
ON public.pending_orders
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for webhook)
CREATE POLICY "pending_orders_service_all"
ON public.pending_orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_pending_orders_updated_at
BEFORE UPDATE ON public.pending_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create bank_transactions table to log all incoming bank notifications
CREATE TABLE IF NOT EXISTS public.bank_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id TEXT NOT NULL UNIQUE,
  bank_code TEXT NOT NULL,
  account_number TEXT NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
  matched_order_id TEXT REFERENCES public.pending_orders(order_id),
  raw_data JSONB,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bank_transactions_transaction_id ON public.bank_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_description ON public.bank_transactions(description);

-- Enable RLS
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

-- Only service role can access bank transactions
CREATE POLICY "bank_transactions_service_all"
ON public.bank_transactions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.pending_orders TO authenticated;
GRANT ALL ON public.pending_orders TO service_role;
GRANT ALL ON public.bank_transactions TO service_role;

