import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  FileText,
  Download,
  Eye,
  Search,
  Loader2,
  CheckCircle,
  File,
  Calendar,
  ExternalLink,
} from "lucide-react";

interface PurchasedDocument {
  id: string;
  document_id: string;
  purchased_at: string;
  document: {
    id: string;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    file_url: string | null;
    badge: string | null;
    badge_color: string;
    view_count: number;
    download_count: number;
  };
}

interface FreeDocument {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  file_url: string | null;
  badge: string | null;
  badge_color: string;
  view_count: number;
  download_count: number;
  is_free: boolean;
}

const badgeColors: Record<string, string> = {
  primary: "bg-primary/10 text-primary border-primary/20",
  success: "bg-green-100 text-green-700 border-green-200",
  secondary: "bg-secondary/20 text-secondary-foreground border-secondary/30",
  accent: "bg-orange-100 text-orange-700 border-orange-200",
};

const MyDocuments = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [purchasedDocuments, setPurchasedDocuments] = useState<PurchasedDocument[]>([]);
  const [freeDocuments, setFreeDocuments] = useState<FreeDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"purchased" | "free">("purchased");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    if (!user) return;

    setLoading(true);

    // Fetch purchased document IDs
    const { data: purchaseIds } = await supabase
      .from("purchased_documents" as any)
      .select("id, document_id, purchased_at")
      .eq("user_id", user.id)
      .order("purchased_at", { ascending: false });

    if (purchaseIds && (purchaseIds as any[]).length > 0) {
      // Fetch the actual documents
      const docIds = (purchaseIds as any[]).map((p) => p.document_id);
      const { data: docsData } = await supabase
        .from("documents")
        .select("*")
        .in("id", docIds);

      if (docsData) {
        type DocType = { id: string; [key: string]: unknown };
        const docsMap = new Map((docsData as DocType[]).map((d) => [d.id, d]));
        const enrichedPurchases = (purchaseIds as any[])
          .filter((p) => docsMap.has(p.document_id))
          .map((p) => ({
            id: p.id,
            document_id: p.document_id,
            purchased_at: p.purchased_at,
            document: docsMap.get(p.document_id) as PurchasedDocument["document"],
          }));
        setPurchasedDocuments(enrichedPurchases);
      }
    }

    // Fetch free documents
    const { data: freeData, error: freeError } = await supabase
      .from("documents")
      .select("*")
      .eq("is_published", true)
      .eq("is_free", true)
      .order("created_at", { ascending: false });

    if (!freeError && freeData) {
      setFreeDocuments(freeData as FreeDocument[]);
    }

    setLoading(false);
  };

  const handleDownload = async (docId: string) => {
    try {
      // Get signed URL from edge function
      const { data: signedUrlData, error: signedUrlError } = await supabase.functions.invoke(
        "get-document-url",
        {
          body: { documentId: docId },
        }
      );

      if (signedUrlError || !signedUrlData?.signedUrl) {
        console.error("Failed to get signed URL:", signedUrlError);
        toast({
          title: "Lỗi",
          description: signedUrlData?.error || "Không thể tạo liên kết tải xuống",
          variant: "destructive",
        });
        return;
      }

      // Increment download count
      await supabase.rpc("increment_document_download" as any, { doc_id: docId });

      window.open(signedUrlData.signedUrl, "_blank");

      toast({
        title: "Đang tải xuống",
        description: "File đang được tải về...",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải tài liệu. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const filteredPurchased = purchasedDocuments.filter((p) =>
    p.document.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.document.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFree = freeDocuments.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Tài liệu của tôi</h1>
          <p className="text-muted-foreground">
            Quản lý và tải về tài liệu bạn đã mua hoặc tài liệu miễn phí
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {purchasedDocuments.length}
                </p>
                <p className="text-sm text-muted-foreground">Tài liệu đã mua</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {freeDocuments.length}
                </p>
                <p className="text-sm text-muted-foreground">Tài liệu miễn phí</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "purchased" ? "default" : "outline"}
            onClick={() => setActiveTab("purchased")}
          >
            Đã mua ({purchasedDocuments.length})
          </Button>
          <Button
            variant={activeTab === "free" ? "default" : "outline"}
            onClick={() => setActiveTab("free")}
          >
            Miễn phí ({freeDocuments.length})
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm tài liệu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Documents List */}
        {activeTab === "purchased" ? (
          filteredPurchased.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Không tìm thấy tài liệu nào"
                  : "Bạn chưa mua tài liệu nào"}
              </p>
              <Link to="/documents">
                <Button>Khám phá tài liệu</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPurchased.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      {/* Thumbnail */}
                      <div className="sm:w-40 h-32 sm:h-auto bg-muted flex-shrink-0">
                        {item.document.thumbnail_url ? (
                          <img
                            src={item.document.thumbnail_url}
                            alt={item.document.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/placeholder.svg";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <File className="w-12 h-12 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1">
                            <Link
                              to={`/documents/${item.document.id}`}
                              className="text-lg font-semibold text-foreground hover:text-primary transition-colors"
                            >
                              {item.document.title}
                            </Link>
                            {item.document.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {item.document.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                              {item.document.badge && (
                                <Badge
                                  variant="outline"
                                  className={badgeColors[item.document.badge_color] || badgeColors.primary}
                                >
                                  {item.document.badge}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Mua ngày {new Date(item.purchased_at).toLocaleDateString("vi-VN")}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleDownload(item.document.id)}
                              disabled={!item.document.file_url}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Tải xuống
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(item.document.id)}
                              disabled={!item.document.file_url}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : (
          filteredFree.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">Không có tài liệu miễn phí nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFree.map((doc) => (
                <Card key={doc.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      {/* Thumbnail */}
                      <div className="sm:w-40 h-32 sm:h-auto bg-muted flex-shrink-0">
                        {doc.thumbnail_url ? (
                          <img
                            src={doc.thumbnail_url}
                            alt={doc.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/placeholder.svg";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <File className="w-12 h-12 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/documents/${doc.id}`}
                                className="text-lg font-semibold text-foreground hover:text-primary transition-colors"
                              >
                                {doc.title}
                              </Link>
                              <Badge className="bg-green-500 text-white">Miễn phí</Badge>
                            </div>
                            {doc.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {doc.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                              {doc.badge && (
                                <Badge
                                  variant="outline"
                                  className={badgeColors[doc.badge_color] || badgeColors.primary}
                                >
                                  {doc.badge}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {doc.view_count} lượt xem
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Download className="w-3 h-3" />
                                {doc.download_count} lượt tải
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleDownload(doc.id)}
                              disabled={!doc.file_url}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Tải xuống
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(doc.id)}
                              disabled={!doc.file_url}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default MyDocuments;

