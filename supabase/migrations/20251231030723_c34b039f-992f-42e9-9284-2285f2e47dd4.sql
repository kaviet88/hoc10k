-- Create pending_orders table for payment verification flow
CREATE TABLE public.pending_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  order_type TEXT NOT NULL DEFAULT 'cart',
  order_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  payment_content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  transaction_id TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expire_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 minutes')
);

-- Enable RLS
ALTER TABLE public.pending_orders ENABLE ROW LEVEL SECURITY;

-- Users can create their own pending orders
CREATE POLICY "Users can create their own pending orders"
ON public.pending_orders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own pending orders
CREATE POLICY "Users can view their own pending orders"
ON public.pending_orders
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own pending orders
CREATE POLICY "Users can update their own pending orders"
ON public.pending_orders
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_pending_orders_user_id ON public.pending_orders(user_id);
CREATE INDEX idx_pending_orders_order_id ON public.pending_orders(order_id);
CREATE INDEX idx_pending_orders_status ON public.pending_orders(status);