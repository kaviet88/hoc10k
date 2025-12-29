import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { DocumentPaymentDialog } from "@/components/documents/DocumentPaymentDialog";
import {
  FileText,
  Download,
  Eye,
  Loader2,
  Lock,
  CheckCircle,
  ArrowLeft,
  Calendar,
  ExternalLink,
  ShoppingCart,
  File,
} from "lucide-react";

interface Document {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  file_url: string | null;
  badge: string | null;
  badge_color: string;
  price: number;
  view_count: number;
  download_count: number;
  is_free: boolean;
  is_published: boolean;
  created_at: string;
}

const badgeColors: Record<string, string> = {
  primary: "bg-primary/10 text-primary border-primary/20",
  success: "bg-green-100 text-green-700 border-green-200",
  secondary: "bg-secondary/20 text-secondary-foreground border-secondary/30",
  accent: "bg-orange-100 text-orange-700 border-orange-200",
};

const DocumentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState<Document | null>(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState("");
  const [purchasing, setPurchasing] = useState(false);


  useEffect(() => {
    if (id) {
      fetchDocument();
    }
  }, [id, user]);

  const fetchDocument = async () => {
    if (!id) return;

    setLoading(true);

    // Fetch document details
    const { data: docData, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .eq("is_published", true)
      .single();

    if (docError || !docData) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy tài liệu",
        variant: "destructive",
      });
      navigate("/documents");
      return;
    }

    setDocument(docData as Document);

    // Check if user has purchased this document
    if (user) {
      const { data: purchaseData } = await supabase
        .from("purchased_documents")
        .select("id")
        .eq("user_id", user.id)
        .eq("document_id", id)
        .maybeSingle();

      setHasPurchased(!!purchaseData);
    }

    // Increment view count
    await supabase.rpc("increment_document_view", { doc_id: id });

    setLoading(false);
  };

  const hasAccess = () => {
    return document?.is_free === true || hasPurchased;
  };

  const handleDownload = async () => {
    if (!document?.file_url) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy file tài liệu",
        variant: "destructive",
      });
      return;
    }

    if (!hasAccess()) {
      toast({
        title: "Yêu cầu mua tài liệu",
        description: "Vui lòng mua tài liệu để tải về",
        variant: "destructive",
      });
      return;
    }

    setDownloading(true);

    // Increment download count
    await supabase.rpc("increment_document_download", { doc_id: document.id });

    // Open file URL in new tab or download
    window.open(document.file_url, "_blank");

    toast({
      title: "Đang tải xuống",
      description: "File đang được tải về...",
    });

    setDownloading(false);
  };

const handlePurchase = () => {
    if (!user) {
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Vui lòng đăng nhập để mua tài liệu",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!document) {
      return;
    }

    setPurchasing(true);

    // Generate order ID and show payment dialog
    const orderId = `DOC${Date.now().toString().slice(-9)}`;
    setCurrentOrderId(orderId);
    setShowPaymentDialog(true);

    // Reset purchasing state after a short delay
    setTimeout(() => setPurchasing(false), 500);
  };

  const handlePaymentConfirmed = async () => {
    if (!user || !document) return;

    // Record the purchase in the database
    const { error } = await supabase
      .from("purchased_documents")
      .insert({
        user_id: user.id,
        document_id: document.id,
        price: document.price || 0,
        payment_method: "bank_transfer",
      });

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xác nhận thanh toán. Vui lòng liên hệ hỗ trợ.",
        variant: "destructive",
      });
      console.error("Purchase error:", error);
      return;
    }

    setHasPurchased(true);
    toast({
      title: "Thanh toán thành công! 🎉",
      description: "Bạn có thể tải tài liệu ngay bây giờ.",
    });
  };

  const handleCancelPayment = () => {
    setShowPaymentDialog(false);
    setCurrentOrderId("");
    toast({
      title: "Đã hủy thanh toán",
      description: "Bạn có thể thử lại bất cứ lúc nào.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground">Không tìm thấy tài liệu</p>
          <Link to="/documents">
            <Button className="mt-4">Quay lại danh sách</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Link to="/documents" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách tài liệu
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Document Preview */}
            <Card>
              <CardContent className="p-0">
                <div className="relative aspect-[4/3] bg-muted rounded-t-lg overflow-hidden">
                  {document.thumbnail_url ? (
                    <img
                      src={document.thumbnail_url}
                      alt={document.title}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <File className="w-24 h-24 text-muted-foreground/30" />
                    </div>
                  )}
                  {/* Overlay for locked documents */}
                  {!hasAccess() && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
                      <Lock className="w-16 h-16 text-muted-foreground mb-4" />
                      <p className="text-lg font-semibold text-foreground mb-2">
                        Tài liệu yêu cầu mua
                      </p>
                      <p className="text-muted-foreground text-center max-w-md px-4">
                        Vui lòng mua tài liệu để xem nội dung đầy đủ và tải về
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Document Info */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl">{document.title}</CardTitle>
                    {document.badge && (
                      <Badge
                        variant="outline"
                        className={badgeColors[document.badge_color] || badgeColors.primary}
                      >
                        {document.badge}
                      </Badge>
                    )}
                  </div>
                  <div>
                    {document.is_free ? (
                      <Badge className="bg-green-500 text-white text-lg px-4 py-1">
                        Miễn phí
                      </Badge>
                    ) : hasPurchased ? (
                      <Badge className="bg-primary text-white text-lg px-4 py-1">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Đã mua
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-lg px-4 py-1">
                        <Lock className="w-4 h-4 mr-1" />
                        Trả phí
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {document.description && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-2">Mô tả</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {document.description}
                      </p>
                    </div>
                  </>
                )}

                <Separator />

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    {document.view_count} lượt xem
                  </span>
                  <span className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    {document.download_count} lượt tải
                  </span>
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(document.created_at).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Card */}
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Tải tài liệu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasAccess() ? (
                  <>
                    <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">
                          {document.is_free ? "Tài liệu miễn phí" : "Bạn đã mua tài liệu này"}
                        </span>
                      </div>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Bạn có thể xem và tải tài liệu này
                      </p>
                    </div>

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleDownload}
                      disabled={downloading || !document.file_url}
                    >
                      {downloading ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-5 h-5 mr-2" />
                      )}
                      Tải xuống
                    </Button>

                    {document.file_url && (
                      <Button
                        variant="outline"
                        className="w-full"
                        size="lg"
                        onClick={() => window.open(document.file_url!, "_blank")}
                      >
                        <ExternalLink className="w-5 h-5 mr-2" />
                        Mở trong tab mới
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 mb-2">
                        <Lock className="w-5 h-5" />
                        <span className="font-semibold">Tài liệu trả phí</span>
                      </div>
                      <p className="text-sm text-amber-600 dark:text-amber-400">
                        Mua tài liệu để xem nội dung đầy đủ và tải về
                      </p>
                    </div>

                    {/* Price Display */}
                    {document.price > 0 && (
                      <div className="text-center py-2">
                        <p className="text-2xl font-bold text-primary">
                          {new Intl.NumberFormat("vi-VN").format(document.price)} đ
                        </p>
                      </div>
                    )}

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handlePurchase}
                      disabled={purchasing}
                    >
                      {purchasing ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <ShoppingCart className="w-5 h-5 mr-2" />
                      )}
                      {purchasing ? "Đang xử lý..." : "Mua tài liệu"}
                    </Button>

                    {!user && (
                      <p className="text-xs text-center text-muted-foreground">
                        Bạn cần{" "}
                        <Link to="/auth" className="text-primary underline">
                          đăng nhập
                        </Link>{" "}
                        để mua tài liệu
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Related Documents - Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tài liệu liên quan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-4">
                  Đang cập nhật...
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Payment Dialog */}
      <DocumentPaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        orderId={currentOrderId}
        amount={document?.price || 50000}
        documentTitle={document?.title || ""}
        onPaymentConfirmed={handlePaymentConfirmed}
        onCancelPayment={handleCancelPayment}
      />
    </div>
  );
};

export default DocumentDetail;

