import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  FileText,
  Download,
  Eye,
  Search,
  Loader2,
  Lock,
  CheckCircle,
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
  view_count: number;
  download_count: number;
  is_free: boolean;
  is_published: boolean;
}


const badgeColors: Record<string, string> = {
  primary: "bg-primary/10 text-primary border-primary/20",
  success: "bg-green-100 text-green-700 border-green-200",
  secondary: "bg-secondary/20 text-secondary-foreground border-secondary/30",
  accent: "bg-orange-100 text-orange-700 border-orange-200",
};

const Documents = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBadge, setFilterBadge] = useState("all");
  const [filterType, setFilterType] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  const fetchDocuments = async () => {
    setLoading(true);

    // Fetch all published documents
    const { data: docsData, error: docsError } = await supabase
      .from("documents")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (docsError) {
      console.error("Error fetching documents:", docsError);
      setLoading(false);
      return;
    }

    setDocuments((docsData as Document[]) || []);

    // Fetch user's purchased documents if logged in
    if (user) {
      const { data: purchasedData } = await supabase
        .from("purchased_documents" as any)
        .select("document_id")
        .eq("user_id", user.id);

      if (purchasedData) {
        setPurchasedIds(new Set((purchasedData as any[]).map((p) => p.document_id)));
      }
    }

    setLoading(false);
  };

  const hasAccess = (doc: Document) => {
    return doc.is_free || purchasedIds.has(doc.id);
  };

  // Get unique badges
  const uniqueBadges = [...new Set(documents.map((d) => d.badge).filter(Boolean))];

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBadge = filterBadge === "all" || doc.badge === filterBadge;
    const matchesType =
      filterType === "all" ||
      (filterType === "free" && doc.is_free) ||
      (filterType === "purchased" && purchasedIds.has(doc.id)) ||
      (filterType === "premium" && !doc.is_free);
    return matchesSearch && matchesBadge && matchesType;
  });

  // Pagination
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleIncrementView = async (docId: string) => {
    await supabase.rpc("increment_document_view" as any, { doc_id: docId });
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Tài liệu</h1>
          <p className="text-muted-foreground">
            Kho tài liệu học tập phong phú với nhiều môn học
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[250px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm tài liệu..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select
                value={filterBadge}
                onValueChange={(value) => {
                  setFilterBadge(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  {uniqueBadges.map((badge) => (
                    <SelectItem key={badge} value={badge!}>
                      {badge}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filterType}
                onValueChange={(value) => {
                  setFilterType(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="free">Miễn phí</SelectItem>
                  <SelectItem value="purchased">Đã mua</SelectItem>
                  <SelectItem value="premium">Trả phí</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{" "}
          {Math.min(currentPage * itemsPerPage, filteredDocuments.length)} trong{" "}
          {filteredDocuments.length} tài liệu
        </p>

        {/* Documents Grid */}
        {paginatedDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">Không tìm thấy tài liệu nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedDocuments.map((doc) => (
              <Card
                key={doc.id}
                className="group overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative aspect-[3/4] bg-muted">
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
                      <File className="w-16 h-16 text-muted-foreground/30" />
                    </div>
                  )}
                  {/* Free/Purchased Badge */}
                  <div className="absolute top-2 right-2">
                    {doc.is_free ? (
                      <Badge className="bg-green-500 text-white">Miễn phí</Badge>
                    ) : purchasedIds.has(doc.id) ? (
                      <Badge className="bg-primary text-white">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Đã mua
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Lock className="w-3 h-3 mr-1" />
                        Trả phí
                      </Badge>
                    )}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                    {doc.title}
                  </h3>
                  {doc.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {doc.description}
                    </p>
                  )}
                  {doc.badge && (
                    <Badge
                      variant="outline"
                      className={`mb-3 ${badgeColors[doc.badge_color] || badgeColors.primary}`}
                    >
                      {doc.badge}
                    </Badge>
                  )}
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {doc.view_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-4 h-4" />
                      {doc.download_count}
                    </span>
                  </div>
                  <Link to={`/documents/${doc.id}`}>
                    <Button
                      className="w-full"
                      variant={hasAccess(doc) ? "default" : "outline"}
                      onClick={() => handleIncrementView(doc.id)}
                    >
                      {hasAccess(doc) ? "Xem chi tiết" : "Xem chi tiết"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Trước
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  onClick={() => setCurrentPage(pageNum)}
                  className="w-10"
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Sau
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Documents;

