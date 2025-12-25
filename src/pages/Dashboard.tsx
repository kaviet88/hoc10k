import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import {
  BookOpen,
  Trophy,
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
  achievements: number;
  purchasedCourses: number;
  totalPoints: number;
  availablePoints: number;
  usedPoints: number;
  loginStreak: number;
  lastCheckIn: string | null;
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
    achievements: 0,
    purchasedCourses: 0,
    totalPoints: 0,
    availablePoints: 0,
    usedPoints: 0,
    loginStreak: 0,
    lastCheckIn: null,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      // Fetch purchase count
      const { count: purchaseCount } = await supabase
        .from("purchase_history")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      setStats((prev) => ({
        ...prev,
        purchasedCourses: purchaseCount || 0,
      }));
      setLoading(false);
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    // Simulate check-in
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setStats((prev) => ({
      ...prev,
      loginStreak: prev.loginStreak + 1,
      totalPoints: prev.totalPoints + 10,
      availablePoints: prev.availablePoints + 10,
      lastCheckIn: new Date().toISOString(),
    }));
    setCheckingIn(false);
  };

  const canCheckIn = () => {
    if (!stats.lastCheckIn) return true;
    const lastDate = new Date(stats.lastCheckIn).toDateString();
    const today = new Date().toDateString();
    return lastDate !== today;
  };

  const getUserName = () => {
    if (!user) return "";
    return user.user_metadata?.full_name || user.email?.split("@")[0] || "Bạn";
  };

  const getLevel = () => {
    if (stats.totalPoints < 100) return { name: "Học viên mới", icon: "🐼" };
    if (stats.totalPoints < 500) return { name: "Học viên tích cực", icon: "🦊" };
    if (stats.totalPoints < 1000) return { name: "Học viên xuất sắc", icon: "🦁" };
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
  const streakProgress = Math.min((stats.loginStreak / 7) * 100, 100);

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
                  Chào mừng bạn đến với Học10k! 👋
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
                      {stats.totalPoints}
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
                      {stats.availablePoints}
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
                      {stats.usedPoints}
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
                    {stats.loginStreak} ngày
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
                  Còn {7 - (stats.loginStreak % 7)} ngày để đạt milestone 1 tuần
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
                Nhận 10 điểm mỗi ngày + bonus cho milestone
              </p>

              <Button variant="outline" className="w-full gap-2">
                <Clock className="w-4 h-4" />
                Lịch sử điểm danh
              </Button>
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
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-secondary/20 flex items-center justify-center">
                <Trophy className="w-7 h-7 text-secondary-foreground" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">
                {stats.achievements}
              </div>
              <p className="text-sm text-muted-foreground">Thành tựu</p>
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
