import { useState } from "react";
import { Copy, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface PaymentQRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  amount: number;
  onCancelPayment: () => void;
  onPaymentConfirmed: () => Promise<void>;
}

// Bank account configuration
const BANK_CONFIG = {
  bankId: "MB", // MB Bank
  bankName: "Ngân hàng TMCP Quân đội",
  accountNumber: "0773702777",
  accountName: "LUONG THUY TRANG",
};

export const PaymentQRDialog = ({
  open,
  onOpenChange,
  orderId,
  amount,
  onCancelPayment,
  onPaymentConfirmed,
}: PaymentQRDialogProps) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + " đ";
  };

  const paymentContent = `Thanh toan ${orderId}`;

  // Generate VietQR URL for the QR code
  const generateQRCodeUrl = () => {
    // VietQR format: https://img.vietqr.io/image/{bankId}-{accountNumber}-{template}.png?amount={amount}&addInfo={description}&accountName={name}
    const baseUrl = "https://img.vietqr.io/image";
    const template = "compact2"; // Options: print, qr_only, compact, compact2
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
    onCancelPayment();
    onOpenChange(false);
  };

  const handleConfirmPayment = async () => {
    setConfirming(true);
    try {
      await onPaymentConfirmed();
      onOpenChange(false);
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
          <div className="flex flex-col md:flex-row gap-6">
            {/* QR Code Section */}
            <div className="flex-shrink-0">
              <div className="bg-gradient-to-b from-blue-50 to-blue-100 border-4 border-blue-500 rounded-2xl p-4 flex flex-col items-center">
                <img
                  src={generateQRCodeUrl()}
                  alt="Payment QR Code"
                  className="w-48 h-48 object-contain"
                  onError={(e) => {
                    // Fallback if VietQR fails
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
                <div className="flex items-center gap-2 mt-3">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/vi/1/1f/MBBank_logo.svg"
                    alt="MB Bank Logo"
                    className="h-8"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <span className="font-bold text-blue-700 text-lg">MB</span>
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
                  và nội dung khi chuyển khoản. Vui lòng quét mã QR để thanh toán
                  được tiến hành tự động.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCancel}
              disabled={confirming}
            >
              Hủy thanh toán
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirmPayment}
              disabled={confirming}
            >
              {confirming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Tôi đã thanh toán"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

