import { useState, useEffect } from "react";
import { Copy, Check, Loader2, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { usePaymentVerification } from "@/hooks/usePaymentVerification";

interface DocumentPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  amount: number;
  documentId: string;
  documentTitle: string;
  onPaymentConfirmed: () => void;
  onCancelPayment: () => void;
}

// Bank account configuration
const BANK_CONFIG = {
  bankId: "MB", // MB Bank
  bankName: "Ngân hàng TMCP Quân đội",
  accountNumber: "0773702777",
  accountName: "LUONG THUY TRANG",
};

export const DocumentPaymentDialog = ({
  open,
  onOpenChange,
  orderId,
  amount,
  documentId,
  documentTitle,
  onPaymentConfirmed,
  onCancelPayment,
}: DocumentPaymentDialogProps) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Payment verification hook with auto-polling
  const {
    status: verificationStatus,
    isPolling,
    checkCount,
    secondsUntilNextCheck,
    isTestMode,
    testModeAutoVerifyIn,
    startPolling,
    cancelPayment: cancelVerification,
    manualVerify,
    simulatePayment,
  } = usePaymentVerification({
    orderId,
    amount,
    orderType: 'document',
    orderData: { document_id: documentId, title: documentTitle },
    onVerified: () => {
      onPaymentConfirmed();
      onOpenChange(false);
    },
    onCancelled: () => {
      onCancelPayment();
      onOpenChange(false);
    },
    onExpired: () => {
      onCancelPayment();
      onOpenChange(false);
    },
    pollingInterval: 5000, // Check every 5 seconds
  });

  // Start polling when dialog opens
  useEffect(() => {
    if (open && orderId && amount > 0 && documentId) {
      startPolling();
    }
  }, [open, orderId, amount, documentId, startPolling]);


  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + " đ";
  };

  const paymentContent = `Thanh toan ${orderId}`;

  // Generate VietQR URL for the QR code
  const generateQRCodeUrl = () => {
    const baseUrl = "https://img.vietqr.io/image";
    const template = "compact2";
    const params = new URLSearchParams({
      amount: amount.toString(),
      addInfo: paymentContent,
      accountName: BANK_CONFIG.accountName,
    });

    return `${baseUrl}/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNumber}-${template}.png?${params.toString()}`;
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: "Đã sao chép!",
        description: `${field} đã được sao chép vào clipboard.`,
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể sao chép. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    cancelVerification();
  };

  const handleConfirmPayment = async () => {
    setConfirming(true);
    try {
      const verified = await manualVerify();
      if (verified) {
        onPaymentConfirmed();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Payment confirmation error:", error);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0 gap-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-normal text-muted-foreground">
              Mở App Ngân hàng bất kỳ để{" "}
              <span className="font-bold text-foreground">quét mã QR</span> hoặc{" "}
              <span className="font-bold text-foreground">chuyển khoản</span>{" "}
              chính xác số tiền bên dưới
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6">
          {/* Document being purchased */}
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Tài liệu:</p>
            <p className="font-semibold text-foreground">{documentTitle}</p>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* QR Code Section */}
            <div className="flex-shrink-0">
              <div className="bg-gradient-to-b from-blue-50 to-blue-100 border-4 border-blue-500 rounded-2xl p-4 flex flex-col items-center">
                <img
                  src={generateQRCodeUrl()}
                  alt="Payment QR Code"
                  className="w-48 h-48 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
                <div className="flex items-center gap-2 mt-3">
                  <span className="font-bold text-blue-700 text-lg">MB Bank</span>
                </div>
              </div>
            </div>

            {/* Payment Details Section */}
            <div className="flex-1 space-y-4">
              {/* Bank */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Ngân hàng</p>
                <p className="font-semibold text-foreground">
                  {BANK_CONFIG.bankName}
                </p>
              </div>

              {/* Account Holder */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Chủ tài khoản:
                </p>
                <p className="font-semibold text-foreground">
                  {BANK_CONFIG.accountName}
                </p>
              </div>

              {/* Account Number */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Số tài khoản:
                  </p>
                  <p className="font-semibold text-foreground">
                    {BANK_CONFIG.accountNumber}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleCopy(BANK_CONFIG.accountNumber, "Số tài khoản")
                  }
                  className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                >
                  {copiedField === "Số tài khoản" ? (
                    <Check className="w-4 h-4 mr-1" />
                  ) : (
                    <Copy className="w-4 h-4 mr-1" />
                  )}
                  Sao chép
                </Button>
              </div>

              {/* Amount */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Số tiền:</p>
                  <p className="font-semibold text-lg text-blue-600">
                    {formatPrice(amount)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(amount.toString(), "Số tiền")}
                  className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                >
                  {copiedField === "Số tiền" ? (
                    <Check className="w-4 h-4 mr-1" />
                  ) : (
                    <Copy className="w-4 h-4 mr-1" />
                  )}
                  Sao chép
                </Button>
              </div>

              {/* Payment Content */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Nội dung:
                  </p>
                  <p className="font-semibold text-foreground">
                    {paymentContent}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(paymentContent, "Nội dung")}
                  className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                >
                  {copiedField === "Nội dung" ? (
                    <Check className="w-4 h-4 mr-1" />
                  ) : (
                    <Copy className="w-4 h-4 mr-1" />
                  )}
                  Sao chép
                </Button>
              </div>

              {/* Note */}
              <div className="pt-2">
                <p className="text-sm text-muted-foreground">
                  Lưu ý: Nhập chính xác số tiền{" "}
                  <span className="font-bold text-foreground">
                    {formatPrice(amount)}
                  </span>{" "}
                  và nội dung khi chuyển khoản.
                </p>

                {/* Payment Verification Status */}
                {isPolling && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-emerald-700">
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        <span className="text-sm font-medium">
                          Đang tự động kiểm tra thanh toán
                        </span>
                      </div>
                      <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                        Lần {checkCount}
                      </span>
                    </div>
                    {secondsUntilNextCheck > 0 && verificationStatus !== 'verifying' && (
                      <p className="text-xs text-emerald-600 mt-1">
                        Kiểm tra tiếp sau {secondsUntilNextCheck} giây...
                      </p>
                    )}
                    {verificationStatus === 'verifying' && (
                      <p className="text-xs text-blue-600 mt-1 flex items-center">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Đang xác minh...
                      </p>
                    )}
                  </div>
                )}

                {verificationStatus === 'verified' && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700 flex items-center">
                      <Check className="w-4 h-4 mr-2" />
                      Thanh toán đã được xác nhận!
                    </p>
                  </div>
                )}

                {/* Test Mode Indicator */}
                {isTestMode && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-amber-700 font-medium">
                        🧪 Chế độ thử nghiệm (Test Mode)
                      </p>
                      {testModeAutoVerifyIn !== null && testModeAutoVerifyIn > 0 && (
                        <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                          Tự động xác nhận sau {testModeAutoVerifyIn}s
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-amber-600 mt-1">
                      Thanh toán sẽ tự động được xác nhận mà không cần chuyển khoản thật.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCancel}
            >
              H���y thanh toán
            </Button>
            {isTestMode ? (
              <Button
                className="flex-1 bg-amber-500 hover:bg-amber-600"
                onClick={simulatePayment}
                disabled={confirming}
              >
                {confirming ? "Đang xác nhận..." : "🧪 Mô phỏng thanh toán"}
              </Button>
            ) : (
              <Button
                className="flex-1"
                onClick={handleConfirmPayment}
                disabled={confirming}
              >
                {confirming ? "Đang xác nhận..." : "Tôi đã thanh toán"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

