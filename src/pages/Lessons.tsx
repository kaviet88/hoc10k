import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { LessonCard } from "@/components/lessons/LessonCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Search, Loader2 } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  duration: string;
  viewCount: number;
  commentCount: number;
  badge: string;
  badgeColor: "primary" | "success" | "secondary" | "accent";
  programId: string;
}

// Mock courses data - in a real app, this would come from the database
const mockCourses: Course[] = [
  {
    id: "1",
    programId: "1",
    title: "Thuyết trình Meet the Animals",
    description: "Thuyết Trình: Meet the Animals - Khám phá thế giới động vật qua tiếng Anh",
    thumbnail: "https://images.unsplash.com/photo-1535268244390-4bb3dc9c8c16?w=400",
    price: 10000,
    duration: "0 phút",
    viewCount: 83,
    commentCount: 0,
    badge: "Tiếng Anh Cơ Bản",
    badgeColor: "primary",
  },
  {
    id: "2",
    programId: "2",
    title: "Bài tập bổ trợ Starters Movers",
    description: "Bài tập bổ trợ Stater - Movers giúp học sinh luyện tập kỹ năng",
    thumbnail: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400",
    price: 360000,
    duration: "0 phút",
    viewCount: 2059,
    commentCount: 0,
    badge: "Tiếng Anh Cơ Bản",
    badgeColor: "primary",
  },
  {
    id: "3",
    programId: "3",
    title: "Tiếng Anh Starters 360 ngày",
    description: "Nội dung học Starters - Độ tuổi phù hợp: Trên 5 tuổi",
    thumbnail: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400",
    price: 10000,
    duration: "0 phút",
    viewCount: 7719,
    commentCount: 0,
    badge: "Tiếng Anh - Cơ bản",
    badgeColor: "accent",
  },
  {
    id: "4",
    programId: "1",
    title: "Tiếng Anh Movers 360 ngày",
    description: "Khóa học tiếng Anh Movers dành cho học sinh tiểu học",
    thumbnail: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400",
    price: 590000,
    duration: "365 ngày",
    viewCount: 6276,
    commentCount: 0,
    badge: "Tiếng Anh Cơ Bản",
    badgeColor: "primary",
  },
  {
    id: "5",
    programId: "2",
    title: "Toán Tư Duy Lớp 1",
    description: "Phát triển tư duy logic và giải quyết vấn đề cho học sinh lớp 1",
    thumbnail: "https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=400",
    price: 390000,
    duration: "180 ngày",
    viewCount: 3456,
    commentCount: 0,
    badge: "Toán",
    badgeColor: "success",
  },
  {
    id: "6",
    programId: "3",
    title: "Tiếng Việt Nâng Cao Lớp 2",
    description: "Nâng cao kỹ năng đọc hiểu và viết văn cho học sinh lớp 2",
    thumbnail: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400",
    price: 490000,
    duration: "365 ngày",
    viewCount: 2890,
    commentCount: 0,
    badge: "Tiếng Việt",
    badgeColor: "secondary",
  },
];

const subjects = ["Tất cả", "Toán", "Tiếng Anh", "Tiếng Việt", "Tiếng Trung"];

const Lessons = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("Tất cả");
  const [purchasedProgramIds, setPurchasedProgramIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPurchasedCourses();
  }, [user]);

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

  const filteredCourses = mockCourses.filter((course) => {
    const matchesSearch = course.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesSubject =
      selectedSubject === "Tất cả" || course.badge.includes(selectedSubject);
    return matchesSearch && matchesSubject;
  });

  const isPurchased = (programId: string) => {
    return purchasedProgramIds.includes(programId);
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
              {filteredCourses.map((course, index) => (
                <div
                  key={course.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <LessonCard
                    id={course.id}
                    title={course.title}
                    description={course.description}
                    thumbnail={course.thumbnail}
                    price={course.price}
                    duration={course.duration}
                    viewCount={course.viewCount}
                    commentCount={course.commentCount}
                    badge={course.badge}
                    badgeColor={course.badgeColor}
                    isPurchased={isPurchased(course.programId)}
                  />
                </div>
              ))}
            </div>

            {filteredCourses.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Không tìm thấy bài học nào
              </div>
            )}

            {/* Load More */}
            {filteredCourses.length > 0 && (
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
