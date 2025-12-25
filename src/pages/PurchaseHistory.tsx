import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, CreditCard, Loader2 } from "lucide-react";

interface Purchase {
  id: string;
  program_id: string;
  program_type: string;
  program_name: string;
  duration: string;
  price: number;
  payment_method: string;
  purchased_at: string;
}

const PurchaseHistory = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchPurchases = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("purchase_history")
        .select("*")
        .eq("user_id", user.id)
        .order("purchased_at", { ascending: false });

      if (!error && data) {
        setPurchases(data);
      }
      setLoading(false);
    };

    if (user) {
      fetchPurchases();
    }
  }, [user]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + " đ";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Lịch Sử Mua Hàng
          </h1>
          <p className="text-muted-foreground">
            Xem lại các chương trình bạn đã mua
          </p>
        </div>

        {purchases.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <BookOpen className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-lg text-muted-foreground">Bạn chưa mua chương trình nào</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => (
              <Card key={purchase.id} className="shadow-card">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                        <BookOpen className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{purchase.program_type}</Badge>
                        </div>
                        <h3 className="font-semibold text-foreground">{purchase.program_name}</h3>
                        <p className="text-sm text-muted-foreground">{purchase.duration}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(purchase.purchased_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            {purchase.payment_method}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{formatPrice(purchase.price)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PurchaseHistory;
