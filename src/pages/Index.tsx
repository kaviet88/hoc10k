import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { FilterSidebar } from "@/components/exams/FilterSidebar";
import { ExamCard } from "@/components/exams/ExamCard";
import { AITutorChat } from "@/components/chat/AITutorChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Search, BookMarked, Loader2 } from "lucide-react";

interface Exam {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  total_questions: number;
  participant_count: number | null;
  is_premium: boolean | null;
  difficulty: string | null;
  grade: number | null;
  time_limit_minutes: number;
  exam_type: string | null;
}

const subjectBadgeColors: Record<string, "primary" | "success" | "secondary" | "accent"> = {
  "Toán": "primary",
  "Tiếng Việt": "success",
  "Tiếng Anh": "accent",
  "TNTV": "secondary",
  "default": "primary",
};

const Index = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("practice_tests")
      .select("*")
      .order("created_at", { ascending: false });

    if (data && !error) {
      setExams(data);
    } else {
      console.error("Error fetching exams:", error);
    }

    setLoading(false);
  };

  const filteredExams = exams.filter((exam) =>
    exam.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getBadgeColor = (subject: string): "primary" | "success" | "secondary" | "accent" => {
    return subjectBadgeColors[subject] || subjectBadgeColors["default"];
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-primary">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Bộ đề thi</h1>
              <p className="text-sm text-muted-foreground">Luyện tập và kiểm tra kiến thức</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Tìm kiếm đề thi..." 
                className="pl-9 w-full sm:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <BookMarked className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <FilterSidebar />

          {/* Exam Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredExams.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Không tìm thấy đề thi nào
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredExams.map((exam, index) => (
                  <div
                    key={exam.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <ExamCard
                      id={exam.id}
                      title={exam.title}
                      thumbnail={`https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop`}
                      examCount={exam.total_questions}
                      participantCount={exam.participant_count || 0}
                      isPremium={exam.is_premium || false}
                      badge={exam.subject}
                      badgeColor={getBadgeColor(exam.subject)}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Load More */}
            {!loading && filteredExams.length > 0 && (
              <div className="flex justify-center mt-8">
                <Button variant="outline" size="lg">
                  Xem thêm đề thi
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-foreground mb-4">Về chúng tôi</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Giới thiệu</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Liên hệ</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Tuyển dụng</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-4">Hỗ trợ</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Hướng dẫn sử dụng</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Câu hỏi thường gặp</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Chính sách bảo mật</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-4">Chương trình</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Toán học</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Tiếng Việt</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Tiếng Anh</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-4">Kết nối</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Facebook</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Youtube</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Zalo</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2025 Học 10k. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>

      {/* AI Tutor Chat */}
      <AITutorChat />
    </div>
  );
};

export default Index;
