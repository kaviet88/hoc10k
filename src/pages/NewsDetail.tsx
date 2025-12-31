import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye, Calendar, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import DOMPurify from "dompurify";

interface NewsDetail {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  thumbnail_url: string | null;
  view_count: number;
  created_at: string;
  category: string | null;
}

const NewsDetail = () => {
  const { newsId } = useParams<{ newsId: string }>();
  const [news, setNews] = useState<NewsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (newsId) {
      fetchNewsDetail();
    }
  }, [newsId]);

  const fetchNewsDetail = async () => {
    setLoading(true);

    const { data, error } = await (supabase
      .from("news" as any)
      .select("*")
      .eq("id", newsId)
      .single() as any);

    if (error) {
      console.error("Error fetching news:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải tin tức",
        variant: "destructive",
      });
    } else {
      setNews(data as NewsDetail);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Đã sao chép",
        description: "Đường dẫn đã được sao chép vào clipboard",
      });
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Không tìm thấy tin tức</h1>
          <Button onClick={() => navigate("/news")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/news")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại tin tức
        </Button>

        {/* Article */}
        <article className="bg-card rounded-xl shadow-card overflow-hidden">
          {/* Thumbnail */}
          {news.thumbnail_url && (
            <div className="aspect-video overflow-hidden">
              <img
                src={news.thumbnail_url}
                alt={news.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6 md:p-8">
            {/* Category */}
            {news.category && (
              <Badge variant="secondary" className="mb-4">
                {news.category}
              </Badge>
            )}

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              {news.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm mb-6 pb-6 border-b border-border">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(news.created_at)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{news.view_count || 0} lượt xem</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-1" />
                Chia sẻ
              </Button>
            </div>

            {/* Description */}
            {news.description && (
              <p className="text-lg text-muted-foreground mb-6 italic">
                {news.description}
              </p>
            )}

            {/* Content - Sanitized for XSS protection */}
            {news.content ? (
              <div
                className="prose prose-lg max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize(news.content, {
                    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre', 'div', 'span'],
                    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel']
                  })
                }}
              />
            ) : (
              <p className="text-muted-foreground">Nội dung đang được cập nhật...</p>
            )}
          </div>
        </article>
      </div>
    </div>
  );
};

export default NewsDetail;

