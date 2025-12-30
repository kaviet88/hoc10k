import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/ui/input";
import { Search, Eye, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface NewsItem {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  view_count: number;
  created_at: string;
  category: string | null;
}

const News = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "popular">("newest");
  const navigate = useNavigate();

  useEffect(() => {
    fetchNews();
  }, [sortBy]);

  const fetchNews = async () => {
    setLoading(true);

    let query = supabase
      .from("news")
      .select("*");

    if (sortBy === "newest") {
      query = query.order("created_at", { ascending: false });
    } else if (sortBy === "oldest") {
      query = query.order("created_at", { ascending: true });
    } else if (sortBy === "popular") {
      query = query.order("view_count", { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching news:", error);
    } else {
      setNews(data || []);
    }
    setLoading(false);
  };

  const filteredNews = news.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
  };

  const handleNewsClick = async (newsItem: NewsItem) => {
    // Increment view count
    await supabase
      .from("news")
      .update({ view_count: (newsItem.view_count || 0) + 1 })
      .eq("id", newsItem.id);

    navigate(`/news/${newsItem.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-accent/10 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-2">
            Tin tức & Hướng dẫn
          </h1>
          <p className="text-muted-foreground text-center">
            Cập nhật tin tức mới nhất và hướng dẫn sử dụng Học 10k
          </p>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="py-6 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm hướng dẫn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "popular")}
                className="border border-border rounded-md px-3 py-2 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="popular">Phổ biến nhất</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* News Grid */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Không tìm thấy tin tức nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredNews.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNewsClick(item)}
                  className="bg-card rounded-xl overflow-hidden shadow-card hover:shadow-lg transition-all duration-300 cursor-pointer group hover:-translate-y-1"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video overflow-hidden bg-muted">
                    {item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                        <span className="text-4xl">📰</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* View count */}
                    <div className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
                      <Eye className="w-4 h-4" />
                      <span>{item.view_count || 0}</span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>

                    {/* Description */}
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {item.description}
                      </p>
                    )}

                    {/* Date */}
                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default News;

