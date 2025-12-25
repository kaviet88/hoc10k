import { Header } from "@/components/layout/Header";
import { FilterSidebar } from "@/components/exams/FilterSidebar";
import { ExamCard } from "@/components/exams/ExamCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Search, BookMarked } from "lucide-react";

import examThumb1 from "@/assets/exam-thumb-1.jpg";
import examThumb2 from "@/assets/exam-thumb-2.jpg";
import examThumb3 from "@/assets/exam-thumb-3.jpg";
import examThumb4 from "@/assets/exam-thumb-4.jpg";
import examThumb5 from "@/assets/exam-thumb-5.jpg";
import examThumb6 from "@/assets/exam-thumb-6.jpg";

const exams = [
  {
    id: 1,
    title: "(Vòng Trường) Bộ 8 đề Ôn tập Chủ Điểm Trong Tâm TOÁN VIOEDU Lớp 2 (năm 2025-2026)",
    thumbnail: examThumb1,
    examCount: 8,
    participantCount: 1250,
    isPremium: true,
    badge: "Toán",
    badgeColor: "primary" as const,
  },
  {
    id: 2,
    title: "Bộ 6 đề ôn học kỳ 1 Tiếng Việt lớp 2 (năm 2025-2026)",
    thumbnail: examThumb2,
    examCount: 6,
    participantCount: 890,
    isPremium: true,
    badge: "Tiếng Việt",
    badgeColor: "success" as const,
  },
  {
    id: 3,
    title: "Bộ 5 đề Ôn tập TNTV theo chuyên đề lớp 2 (năm 2025-2026)",
    thumbnail: examThumb3,
    examCount: 5,
    participantCount: 654,
    isPremium: true,
    badge: "TNTV",
    badgeColor: "secondary" as const,
  },
  {
    id: 4,
    title: "Bộ 3 đề thi Thử sức vòng thi Hương TNTV lớp 2 (năm 2025-2026)",
    thumbnail: examThumb4,
    examCount: 3,
    participantCount: 456,
    isPremium: true,
    badge: "Tiếng Anh",
    badgeColor: "accent" as const,
  },
  {
    id: 5,
    title: "Bộ 6 đề ôn luyện các dạng bài vòng thi Hương TNTV lớp 2 (năm 2025-2026)",
    thumbnail: examThumb5,
    examCount: 6,
    participantCount: 321,
    isPremium: true,
    badge: "Trò chơi",
    badgeColor: "secondary" as const,
  },
  {
    id: 6,
    title: "(Vòng Xã/Phường) Bộ 5 đề Ôn luyện VIOEDU TOÁN lớp 2 năm 2025-2026 (phần 1)",
    thumbnail: examThumb6,
    examCount: 5,
    participantCount: 789,
    isPremium: true,
    badge: "Quiz",
    badgeColor: "primary" as const,
  },
];

const Index = () => {
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
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {exams.map((exam, index) => (
                <div 
                  key={exam.id} 
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <ExamCard
                    title={exam.title}
                    thumbnail={exam.thumbnail}
                    examCount={exam.examCount}
                    participantCount={exam.participantCount}
                    isPremium={exam.isPremium}
                    badge={exam.badge}
                    badgeColor={exam.badgeColor}
                  />
                </div>
              ))}
            </div>

            {/* Load More */}
            <div className="flex justify-center mt-8">
              <Button variant="outline" size="lg">
                Xem thêm đề thi
              </Button>
            </div>
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
    </div>
  );
};

export default Index;
