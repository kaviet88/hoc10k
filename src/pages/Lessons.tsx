import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { LessonCard } from "@/components/lessons/LessonCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Search, Loader2 } from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  price: number | null;
  duration: string | null;
  view_count: number | null;
  comment_count: number | null;
  badge: string | null;
  badge_color: string | null;
  program_id: string | null;
  is_published: boolean | null;
}

const subjects = ["Tất cả", "Toán", "Tiếng Anh", "Tiếng Việt", "Tiếng Trung"];

const Lessons = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("Tất cả");
  const [purchasedProgramIds, setPurchasedProgramIds] = useState<string[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLessons();
    fetchPurchasedCourses();
  }, [user]);

  const fetchLessons = async () => {
    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (data && !error) {
      setLessons(data);
    } else {
      console.error("Error fetching lessons:", error);
    }
  };

  const fetchPurchasedCourses = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("purchase_history")
      .select("program_id")
      .eq("user_id", user.id);

    if (data && !error) {
      setPurchasedProgramIds(data.map((p) => p.program_id));
    }
    setLoading(false);
  };

  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch = lesson.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesSubject =
      selectedSubject === "Tất cả" || (lesson.badge && lesson.badge.includes(selectedSubject));
    return matchesSearch && matchesSubject;
  });

  const isPurchased = (programId: string | null) => {
    if (!programId) return false;
    return purchasedProgramIds.includes(programId);
  };

  const getBadgeColor = (color: string | null): "primary" | "success" | "secondary" | "accent" => {
    if (color === "success" || color === "secondary" || color === "accent") {
      return color;
    }
    return "primary";
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

      <main className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-primary">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Bài học</h1>
              <p className="text-sm text-muted-foreground">
                Khám phá các khóa học chất lượng cao
              </p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm bài học..."
              className="pl-9 w-full sm:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filter Sidebar */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="bg-card rounded-xl p-4 shadow-card sticky top-4">
              <h3 className="font-bold text-foreground mb-4">Môn học</h3>
              <div className="flex flex-wrap gap-2">
                {subjects.map((subject) => (
                  <Badge
                    key={subject}
                    variant={selectedSubject === subject ? "default" : "outline"}
                    className={`cursor-pointer transition-colors ${
                      selectedSubject === subject
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedSubject(subject)}
                  >
                    {subject}
                  </Badge>
                ))}
              </div>

              <div className="mt-6">
                <Button className="w-full gap-2">
                  <Search className="w-4 h-4" />
                  Tìm kiếm
                </Button>
              </div>
            </div>
          </aside>

          {/* Course Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredLessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <LessonCard
                    id={lesson.id}
                    title={lesson.title}
                    description={lesson.description || ""}
                    thumbnail={lesson.thumbnail_url || "/placeholder.svg"}
                    price={lesson.price || 0}
                    duration={lesson.duration || "0 phút"}
                    viewCount={lesson.view_count || 0}
                    commentCount={lesson.comment_count || 0}
                    badge={lesson.badge || ""}
                    badgeColor={getBadgeColor(lesson.badge_color)}
                    isPurchased={isPurchased(lesson.program_id)}
                  />
                </div>
              ))}
            </div>

            {filteredLessons.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Không tìm thấy bài học nào
              </div>
            )}

            {/* Load More */}
            {filteredLessons.length > 0 && (
              <div className="flex justify-center mt-8">
                <Button variant="outline" size="lg">
                  Xem thêm bài học
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Lessons;
