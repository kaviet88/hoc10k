import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

// Order data types
interface CartOrderData {
  items: Array<{
    id: string;
    name: string;
    type: string;
    duration: string;
    price: number;
  }>;
}

interface DocumentOrderData {
  document_id: string;
  title: string;
}

type OrderData = CartOrderData | DocumentOrderData;

interface UsePaymentVerificationOptions {
  orderId: string;
  amount: number;
  orderType: 'cart' | 'document';
  orderData: OrderData;
  onVerified?: () => void;
  onCancelled?: () => void;
  onExpired?: () => void;
  pollingInterval?: number; // in milliseconds
}

export const usePaymentVerification = ({
  orderId,
  amount,
  orderType,
  orderData,
  onVerified,
  onCancelled,
  onExpired,
  pollingInterval = 5000, // Poll every 5 seconds
}: UsePaymentVerificationOptions) => {
  const [status, setStatus] = useState<'idle' | 'pending' | 'verifying' | 'verified' | 'cancelled' | 'expired' | 'error'>('idle');
  const [isPolling, setIsPolling] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const paymentContent = `Thanh toan ${orderId}`;

  // Create pending order in database
  const createPendingOrder = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from('pending_orders')
        .insert({
          order_id: orderId,
          user_id: user.id,
          amount,
          order_type: orderType,
          order_data: orderData as unknown as Json,
          payment_content: paymentContent,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        // If order already exists, that's fine
        if (error.code === '23505') { // Unique violation
          console.log("Order already exists");
          return true;
        }
        throw error;
      }

      console.log("Created pending order:", data);
      return true;
    } catch (error) {
      console.error("Failed to create pending order:", error);
      return false;
    }
  }, [orderId, amount, orderType, orderData, paymentContent]);

  // Verify payment with backend
  const verifyPayment = useCallback(async () => {
    try {
      setStatus('verifying');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No session");
      }

      const response = await supabase.functions.invoke('verify-payment', {
        body: { orderId },
      });

      if (response.error) {
        throw response.error;
      }

      const result = response.data;

      if (result.verified) {
        setStatus('verified');
        setIsPolling(false);
        onVerified?.();
        toast({
          title: "Thanh toán thành công!",
          description: "Đơn hàng của bạn đã được xác nhận.",
        });
        return true;
      } else if (result.status === 'cancelled') {
        setStatus('cancelled');
        setIsPolling(false);
        onCancelled?.();
        return false;
      } else if (result.status === 'expired') {
        setStatus('expired');
        setIsPolling(false);
        onExpired?.();
        toast({
          title: "Đơn hàng đã hết hạn",
          description: "Vui lòng tạo đơn hàng mới để tiếp tục thanh toán.",
          variant: "destructive",
        });
        return false;
      }

      setStatus('pending');
      return false;
    } catch (error) {
      console.error("Payment verification error:", error);
      setStatus('error');
      return false;
    }
  }, [orderId, onVerified, onCancelled, onExpired]);

  // Start polling for payment verification
  const startPolling = useCallback(async () => {
    // First create the pending order
    const created = await createPendingOrder();
    if (!created) {
      toast({
        title: "Lỗi",
        description: "Không thể tạo đơn hàng. Vui lòng thử lại.",
        variant: "destructive",
      });
      return;
    }

    setStatus('pending');
    setIsPolling(true);
  }, [createPendingOrder]);

  // Stop polling
  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Cancel payment
  const cancelPayment = useCallback(async () => {
    stopPolling();

    try {
      await supabase.functions.invoke('verify-payment', {
        body: { orderId, action: 'cancel' },
      });
    } catch (error) {
      console.error("Failed to cancel payment:", error);
    }

    setStatus('cancelled');
    onCancelled?.();
  }, [orderId, stopPolling, onCancelled]);

  // Manual verification trigger
  const manualVerify = useCallback(async () => {
    const verified = await verifyPayment();
    if (!verified) {
      toast({
        title: "Chưa nhận được thanh toán",
        description: "Vui lòng đợi vài giây và thử lại sau khi chuyển khoản thành công.",
      });
    }
    return verified;
  }, [verifyPayment]);

  // Polling effect
  useEffect(() => {
    if (!isPolling) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    // Immediate first check
    verifyPayment();

    // Set up polling interval
    pollingRef.current = setInterval(() => {
      verifyPayment();
    }, pollingInterval);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isPolling, pollingInterval, verifyPayment]);

  // Subscribe to realtime updates for faster verification
  useEffect(() => {
    if (!isPolling || !orderId) return;

    const channel = supabase
      .channel(`pending_order_${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pending_orders',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          console.log("Pending order updated:", payload);
          const newStatus = payload.new?.status;

          if (newStatus === 'verified') {
            setStatus('verified');
            setIsPolling(false);
            onVerified?.();
            toast({
              title: "Thanh toán thành công!",
              description: "Đơn hàng của bạn đã được xác nhận.",
            });
          } else if (newStatus === 'cancelled') {
            setStatus('cancelled');
            setIsPolling(false);
            onCancelled?.();
          } else if (newStatus === 'expired') {
            setStatus('expired');
            setIsPolling(false);
            onExpired?.();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isPolling, orderId, onVerified, onCancelled, onExpired]);

  return {
    status,
    isPolling,
    paymentContent,
    startPolling,
    stopPolling,
    cancelPayment,
    manualVerify,
  };
};

// Generate a unique order ID
export const generateOrderId = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}${random}`;
};

