import { ShoppingCart, Trash2, BookOpen, CreditCard, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useCart, CartItem } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface CartSidebarProps {
  items: CartItem[];
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export const CartSidebar = ({
  items,
  onRemoveItem,
  onClearCart,
}: CartSidebarProps) => {
  const [paymentMethod, setPaymentMethod] = useState("online");
  const { checkout, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + " đ";
  };

  const total = items.reduce((sum, item) => sum + item.price, 0);

  const handleCheckout = async () => {
    if (!user) {
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Vui lòng đăng nhập để thanh toán",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    const success = await checkout(paymentMethod);
    if (success) {
      toast({
        title: "Thanh toán thành công!",
        description: "Cảm ơn bạn đã mua hàng. Xem lịch sử mua hàng để theo dõi đơn hàng.",
      });
      navigate("/purchase-history");
    } else {
      toast({
        title: "Thanh toán thất bại",
        description: "Đã xảy ra lỗi. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-card sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-bold text-foreground">
            Giỏ Hàng & Thanh Toán
          </h2>
        </div>
        {items.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearCart}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Xóa giỏ hàng
          </Button>
        )}
      </div>

      <div className="mb-6">
        <p className="text-sm text-muted-foreground mb-4">
          Sản phẩm đã chọn ({items.length}):
        </p>

        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Chưa có sản phẩm nào</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <Badge variant="outline" className="text-xs mb-1">
                      {item.type}
                    </Badge>
                    <p className="font-medium text-sm text-foreground truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.duration}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Thêm vào: {item.addedDate}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="text-sm font-semibold text-primary whitespace-nowrap">
                    {formatPrice(item.price)}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onRemoveItem(item.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border pt-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-foreground">Tổng cộng:</span>
          <span className="text-xl font-bold text-primary">
            {formatPrice(total)}
          </span>
        </div>

        <div className="mb-4">
          <label className="text-sm text-muted-foreground mb-2 block">
            Phương thức thanh toán
          </label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="online">Thanh toán online</SelectItem>
              <SelectItem value="bank">Chuyển khoản ngân hàng</SelectItem>
              <SelectItem value="momo">Ví MoMo</SelectItem>
              <SelectItem value="zalopay">ZaloPay</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!user && items.length > 0 && (
          <p className="text-xs text-accent mb-4">
            Vui lòng{" "}
            <a href="/auth" className="underline font-medium">
              đăng nhập
            </a>{" "}
            để thanh toán và lưu lịch sử mua hàng.
          </p>
        )}

        <p className="text-xs text-muted-foreground mb-4">
          Nếu không thể thanh toán, vui lòng{" "}
          <a href="#" className="text-accent hover:underline font-medium">
            LIÊN HỆ TẠI ĐÂY
          </a>
          , để chúng tôi hỗ trợ bạn.
        </p>
      </div>

      <Button
        className="w-full gradient-primary text-primary-foreground shadow-primary"
        size="lg"
        disabled={items.length === 0 || loading}
        onClick={handleCheckout}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        ) : (
          <CreditCard className="w-5 h-5 mr-2" />
        )}
        {user ? "Thanh Toán Ngay" : "Đăng nhập để thanh toán"}
      </Button>
    </div>
  );
};
