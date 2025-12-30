import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ContinueLearningWidget } from "@/components/dashboard/ContinueLearningWidget";
import {
  BookOpen,
  ShoppingBag,
  FileText,
  Clock,
  Info,
  Loader2,
  Coins,
  Star,
  Flag,
  Calendar,
} from "lucide-react";

interface UserStats {
  totalLessons: number;
  totalExams: number;
  purchasedCourses: number;
}

interface UserPoints {
  total_points: number;
  available_points: number;
  used_points: number;
  current_streak: number;
  longest_streak: number;
  last_check_in: string | null;
}

interface UserExam {
  id: string;
  title: string;
  subject: string;
  score: number | null;
  completed_at: string | null;
  test_id: string;
}

interface UserLesson {
  id: string;
  title: string;
  thumbnail_url: string | null;
  progress: number;
  last_accessed: string;
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    totalLessons: 0,
    totalExams: 0,
    purchasedCourses: 0,
  });
  const [points, setPoints] = useState<UserPoints>({
    total_points: 0,
    available_points: 0,
    used_points: 0,
    current_streak: 0,
    longest_streak: 0,
    last_check_in: null,
  });
  const [userExams, setUserExams] = useState<UserExam[]>([]);
  const [userLessons, setUserLessons] = useState<UserLesson[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Fetch purchase count and achievements count
      const [purchaseRes] = await Promise.all([
        supabase
          .from("purchase_history")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

      // Fetch user's exam attempts
      const { data: examAttempts } = await supabase
        .from("user_test_attempts")
        .select(`
          id,
          test_id,
          score_percent,
          completed_at,
          test_title,
          practice_tests (
            title,
            subject
          )
        `)
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(5);

      if (examAttempts) {
        const exams: UserExam[] = examAttempts.map((attempt) => ({
          id: attempt.id,
          test_id: attempt.test_id || "",
          title: (attempt.practice_tests as { title: string; subject: string } | null)?.title || attempt.test_title || "Đề thi",
          subject: (attempt.practice_tests as { title: string; subject: string } | null)?.subject || "",
          score: attempt.score_percent,
          completed_at: attempt.completed_at,
        }));
        setUserExams(exams);
      }

      // Fetch user's purchased lessons
      const { data: purchasedLessons } = await supabase
        .from("purchase_history")
        .select("program_id, program_name, purchased_at")
        .eq("user_id", user.id)
        .eq("program_type", "Khóa học")
        .order("purchased_at", { ascending: false })
        .limit(5);

      if (purchasedLessons) {
        // Get lesson details
        const lessonIds = purchasedLessons.map(p => p.program_id);
        const { data: lessonDetails } = await supabase
          .from("lessons")
          .select("id, title, thumbnail_url")
          .in("id", lessonIds);

        const lessons: UserLesson[] = purchasedLessons.map((purchase) => {
          const detail = lessonDetails?.find(l => l.id === purchase.program_id);
          return {
            id: purchase.program_id,
            title: detail?.title || purchase.program_name,
            thumbnail_url: detail?.thumbnail_url || null,
            progress: 0,
            last_accessed: purchase.purchased_at,
          };
        });
        setUserLessons(lessons);
      }

      // Count total exams and lessons
      const { count: examCount } = await supabase
        .from("user_test_attempts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const { count: lessonCount } = await supabase
        .from("purchase_history")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("program_type", "Khóa học");

      setStats({
        totalLessons: lessonCount || 0,
        totalExams: examCount || 0,
        purchasedCourses: purchaseRes.count || 0,
      });

      // Fetch user points
      const { data: pointsData } = await supabase
        .from("user_points")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (pointsData) {
        setPoints({
          total_points: pointsData.total_points,
          available_points: pointsData.available_points,
          used_points: pointsData.used_points,
          current_streak: pointsData.current_streak,
          longest_streak: pointsData.longest_streak,
          last_check_in: pointsData.last_check_in,
        });
      }

      setLoading(false);
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const canCheckIn = () => {
    if (!points.last_check_in) return true;
    const lastDate = new Date(points.last_check_in).toDateString();
    const today = new Date().toDateString();
    return lastDate !== today;
  };

  const handleCheckIn = async () => {
    if (!user || !canCheckIn()) return;
    
    setCheckingIn(true);

    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    
    // Calculate new streak
    let newStreak = 1;
    if (points.last_check_in === yesterday) {
      newStreak = points.current_streak + 1;
    }

    // Calculate bonus points for milestones (every 7 days)
    const bonusPoints = newStreak % 7 === 0 ? 50 : 0;
    const pointsEarned = 10 + bonusPoints;

    // Insert check-in record
    const { error: checkInError } = await supabase
      .from("check_in_history")
      .insert({
        user_id: user.id,
        check_in_date: today,
        points_earned: 10,
        streak_day: newStreak,
        bonus_points: bonusPoints,
      });

    if (checkInError) {
      toast({
        title: "Lỗi",
        description: "Không thể điểm danh. Vui lòng thử lại.",
        variant: "destructive",
      });
      setCheckingIn(false);
      return;
    }

    // Update user points
    const newLongestStreak = Math.max(newStreak, points.longest_streak);
    const { error: updateError } = await supabase
      .from("user_points")
      .update({
        total_points: points.total_points + pointsEarned,
        available_points: points.available_points + pointsEarned,
        current_streak: newStreak,
        longest_streak: newLongestStreak,
        last_check_in: today,
      })
      .eq("user_id", user.id);

    if (updateError) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật điểm. Vui lòng thử lại.",
        variant: "destructive",
      });
      setCheckingIn(false);
      return;
    }

    // Update local state
    setPoints({
      ...points,
      total_points: points.total_points + pointsEarned,
      available_points: points.available_points + pointsEarned,
      current_streak: newStreak,
      longest_streak: newLongestStreak,
      last_check_in: today,
    });

    toast({
      title: "Điểm danh thành công! 🎉",
      description: `Bạn nhận được ${pointsEarned} điểm${bonusPoints > 0 ? " (bao gồm bonus " + bonusPoints + " điểm!)" : ""}`,
    });

    setCheckingIn(false);
  };


  const getUserName = () => {
    if (!user) return "";
    return user.user_metadata?.full_name || user.email?.split("@")[0] || "Bạn";
  };

  const getLevel = () => {
    if (points.total_points < 100) return { name: "Học viên mới", icon: "🐼" };
    if (points.total_points < 500) return { name: "Học viên tích cực", icon: "🦊" };
    if (points.total_points < 1000) return { name: "Học viên xuất sắc", icon: "🦁" };
    return { name: "Học viên VIP", icon: "🏆" };
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

  const level = getLevel();
  const streakProgress = Math.min((points.current_streak / 7) * 100, 100);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl gradient-hero p-6 md:p-8 mb-8 text-primary-foreground">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-3xl">
                📚
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  Chào mừng {getUserName()} đến với Học10k! 👋
                </h1>
                <p className="text-primary-foreground/80 mt-1">
                  Chúc bạn có những giờ học thật vui vẻ!
                </p>
              </div>
            </div>
            <Link to="/purchase">
              <Button
                variant="secondary"
                size="lg"
                className="gap-2 bg-white text-primary hover:bg-white/90"
              >
                <ShoppingBag className="w-5 h-5" />
                Mua khóa học
                {itemCount > 0 && (
                  <span className="ml-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>

        {/* Continue Learning Widget */}
        {user && <ContinueLearningWidget userId={user.id} />}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Points Card */}
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-bold text-foreground">Điểm của bạn</h2>
                <Info className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Tổng quan về điểm tích lũy
              </p>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-accent/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Coins className="w-4 h-4 text-accent" />
                    Tổng điểm
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-foreground">
                      {points.total_points}
                    </span>
                    <span className="text-lg">🪙</span>
                  </div>
                </div>

                <div className="bg-success/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Star className="w-4 h-4 text-success" />
                    Khả dụng
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-success">
                      {points.available_points}
                    </span>
                    <span className="text-lg">🪙</span>
                  </div>
                </div>

                <div className="bg-secondary/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Flag className="w-4 h-4 text-secondary-foreground" />
                    Đã dùng
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-foreground">
                      {points.used_points}
                    </span>
                    <span className="text-lg">🪙</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-3xl">
                  {level.icon}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cấp độ hiện tại</p>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{level.name}</span>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full gap-2">
                <Clock className="w-4 h-4" />
                Xem lịch sử
              </Button>
            </CardContent>
          </Card>

          {/* Daily Check-in Card */}
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-bold text-foreground">
                  Điểm danh hàng ngày
                </h2>
                <Info className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Nhận điểm khi đăng nhập mỗi ngày
              </p>

              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">
                    {points.current_streak} ngày
                  </div>
                  <p className="text-sm text-muted-foreground">Chuỗi đăng nhập</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Tiến độ</span>
                  <span className="text-muted-foreground">{Math.round(streakProgress)}%</span>
                </div>
                <Progress value={streakProgress} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2">
                  Còn {7 - (points.current_streak % 7)} ngày để đạt milestone 1 tuần
                </p>
              </div>

              <Button
                className="w-full gradient-primary shadow-primary mb-4"
                size="lg"
                onClick={handleCheckIn}
                disabled={!canCheckIn() || checkingIn}
              >
                {checkingIn ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : null}
                {canCheckIn() ? "Điểm danh hôm nay" : "Đã điểm danh hôm nay ✓"}
              </Button>

              <p className="text-sm text-muted-foreground text-center mb-4">
                Nhận 10 điểm mỗi ngày + bonus 50 điểm khi đạt milestone
              </p>

              <Button variant="outline" className="w-full gap-2">
                <Clock className="w-4 h-4" />
                Lịch sử điểm danh
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Exams and Lessons Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Exams */}
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Đề thi của bạn</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1">
                    <Clock className="w-4 h-4" />
                    Lịch sử làm bài
                  </Button>
                  <Link to="/exams">
                    <Button variant="outline" size="sm">
                      Xem tất cả
                    </Button>
                  </Link>
                </div>
              </div>

              {userExams.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-4">Bạn chưa làm đề thi nào</p>
                  <Link to="/exams">
                    <Button variant="outline">Khám phá đề thi</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {userExams.map((exam) => (
                    <Link
                      key={exam.id}
                      to={`/exams/${exam.test_id}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{exam.title}</p>
                        <p className="text-sm text-muted-foreground">{exam.subject}</p>
                      </div>
                      {exam.score !== null && (
                        <div className="text-right">
                          <span className="text-lg font-bold text-primary">{exam.score}%</span>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Lessons */}
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Bài học của bạn</h2>
                <div className="flex gap-2">
                  <Button variant="default" size="sm" className="gap-1">
                    <Clock className="w-4 h-4" />
                    Lịch sử học bài
                  </Button>
                  <Link to="/my-courses">
                    <Button variant="default" size="sm">
                      Xem tất cả
                    </Button>
                  </Link>
                </div>
              </div>

              {userLessons.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-4">Bạn chưa mua bài học nào</p>
                  <Link to="/lessons">
                    <Button variant="outline">Khám phá bài học</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {userLessons.map((lesson) => (
                    <Link
                      key={lesson.id}
                      to={`/lessons/${lesson.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      {lesson.thumbnail_url ? (
                        <img
                          src={lesson.thumbnail_url}
                          alt={lesson.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-accent" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{lesson.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={lesson.progress} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground">{lesson.progress}%</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-card">
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-accent" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">
                {stats.totalLessons}
              </div>
              <p className="text-sm text-muted-foreground">Tổng số bài học</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="w-7 h-7 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">
                {stats.totalExams}
              </div>
              <p className="text-sm text-muted-foreground">Tổng số đề thi</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
                <ShoppingBag className="w-7 h-7 text-success" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">
                {stats.purchasedCourses}
              </div>
              <p className="text-sm text-muted-foreground">Khóa học đã mua</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
