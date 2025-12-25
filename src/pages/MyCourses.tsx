import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  BookOpen, 
  Clock, 
  Play, 
  Loader2, 
  Calendar,
  CheckCircle,
  Trophy
} from "lucide-react";

interface PurchasedCourse {
  id: string;
  program_id: string;
  program_name: string;
  program_type: string;
  duration: string;
  price: number;
  purchased_at: string;
  progress: number;
  lessonsCompleted: number;
  totalLessons: number;
}

interface ProgressData {
  program_id: string;
  completed_count: number;
  total_count: number;
}

const MyCourses = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<PurchasedCourse[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    fetchPurchasedCourses();
  }, [user]);

  const fetchPurchasedCourses = async () => {
    if (!user) return;

    // Fetch purchased courses
    const { data: purchaseData, error: purchaseError } = await supabase
      .from("purchase_history")
      .select("*")
      .eq("user_id", user.id)
      .order("purchased_at", { ascending: false });

    if (purchaseError || !purchaseData) {
      setLoading(false);
      return;
    }

    // Get unique program IDs
    const programIds = [...new Set(purchaseData.map((p) => p.program_id))];

    // Fetch total lessons per program
    const { data: lessonCounts } = await supabase
      .from("program_lessons")
      .select("program_id")
      .in("program_id", programIds);

    // Count total lessons per program
    const totalLessonsMap: Record<string, number> = {};
    lessonCounts?.forEach((lesson) => {
      totalLessonsMap[lesson.program_id] = (totalLessonsMap[lesson.program_id] || 0) + 1;
    });

    // Fetch user's completed lessons
    const { data: progressData } = await supabase
      .from("user_lesson_progress")
      .select("program_id, completed")
      .eq("user_id", user.id)
      .eq("completed", true)
      .in("program_id", programIds);

    // Count completed lessons per program
    const completedMap: Record<string, number> = {};
    progressData?.forEach((p) => {
      completedMap[p.program_id] = (completedMap[p.program_id] || 0) + 1;
    });

    // Enrich courses with real progress data
    const enrichedCourses = purchaseData.map((course) => {
      const totalLessons = totalLessonsMap[course.program_id] || 0;
      const lessonsCompleted = completedMap[course.program_id] || 0;
      const progress = totalLessons > 0 ? Math.round((lessonsCompleted / totalLessons) * 100) : 0;

      return {
        ...course,
        progress,
        lessonsCompleted,
        totalLessons,
      };
    });

    setCourses(enrichedCourses);
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "text-success";
    if (progress >= 40) return "text-accent";
    return "text-primary";
  };

  const getProgressBgColor = (progress: number) => {
    if (progress >= 80) return "bg-success";
    if (progress >= 40) return "bg-accent";
    return "bg-primary";
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

  const completedCourses = courses.filter((c) => c.progress === 100).length;
  const inProgressCourses = courses.filter((c) => c.progress > 0 && c.progress < 100).length;
  const notStartedCourses = courses.filter((c) => c.progress === 0).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-primary">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Khóa học của tôi</h1>
              <p className="text-sm text-muted-foreground">
                Quản lý và theo dõi tiến độ học tập
              </p>
            </div>
          </div>

          <Link to="/purchase">
            <Button className="gap-2">
              <BookOpen className="w-4 h-4" />
              Mua thêm khóa học
            </Button>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-foreground">{courses.length}</div>
              <p className="text-sm text-muted-foreground">Tổng khóa học</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-success">{completedCourses}</div>
              <p className="text-sm text-muted-foreground">Hoàn thành</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-accent">{inProgressCourses}</div>
              <p className="text-sm text-muted-foreground">Đang học</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-muted-foreground">{notStartedCourses}</div>
              <p className="text-sm text-muted-foreground">Chưa bắt đầu</p>
            </CardContent>
          </Card>
        </div>

        {/* Course List */}
        {courses.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Bạn chưa có khóa học nào
              </h3>
              <p className="text-muted-foreground mb-6">
                Hãy mua khóa học đầu tiên để bắt đầu hành trình học tập
              </p>
              <Link to="/purchase">
                <Button>Khám phá khóa học</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {courses.map((course) => (
              <Card key={course.id} className="shadow-card overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Course Image */}
                    <div className="w-full md:w-48 h-32 md:h-auto relative bg-gradient-to-br from-primary/20 to-accent/20">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-primary/50" />
                      </div>
                      {course.progress === 100 && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-success text-success-foreground gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Hoàn thành
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Course Info */}
                    <div className="flex-1 p-4 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {course.program_type}
                            </Badge>
                          </div>
                          <h3 className="text-lg font-bold text-foreground mb-2">
                            {course.program_name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{course.duration}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Mua ngày {formatDate(course.purchased_at)}</span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-muted-foreground">Tiến độ</span>
                              <span className={`font-semibold ${getProgressColor(course.progress || 0)}`}>
                                {course.progress}%
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${getProgressBgColor(course.progress || 0)}`}
                                style={{ width: `${course.progress}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {course.lessonsCompleted}/{course.totalLessons} bài học đã hoàn thành
                            </p>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="flex md:flex-col gap-2">
                          <Link to={`/lessons/${course.program_id}`} className="flex-1 md:flex-initial">
                            <Button className="w-full gap-2">
                              <Play className="w-4 h-4" />
                              {course.progress === 0 ? "Bắt đầu học" : "Tiếp tục học"}
                            </Button>
                          </Link>
                          {course.progress === 100 && (
                            <Button variant="outline" className="gap-2">
                              <Trophy className="w-4 h-4" />
                              Xem chứng chỉ
                            </Button>
                          )}
                        </div>
                      </div>
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

export default MyCourses;
