import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  Clock,
  FileText,
  Target,
  Play,
  CheckCircle2,
  Trophy,
  Users,
  Calendar,
  Eye,
  Medal,
} from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

import examThumb1 from "@/assets/exam-thumb-1.jpg";
import examThumb2 from "@/assets/exam-thumb-2.jpg";
import examThumb3 from "@/assets/exam-thumb-3.jpg";

interface Exam {
  id: string;
  title: string;
  subject: string;
  grade: number;
  difficulty: string;
  exam_type: string;
  time_limit_minutes: number;
  total_questions: number;
  participant_count: number;
  rating: number;
  is_premium: boolean;
  description?: string;
}

interface TestAttempt {
  id: string;
  score_percent: number;
  correct_answers: number;
  total_questions: number;
  completed_at: string;
  time_spent_seconds: number;
  status: string;
}

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  avatar_url: string | null;
  score_percent: number;
  correct_answers: number;
  total_questions: number;
  time_spent_seconds: number;
  completed_at: string;
}

const ExamPreview = () => {
  const navigate = useNavigate();
  const { examId } = useParams();
  const { user } = useAuth();
  
  const [exam, setExam] = useState<Exam | null>(null);
  const [relatedExams, setRelatedExams] = useState<Exam[]>([]);
  const [userAttempts, setUserAttempts] = useState<TestAttempt[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<{ rank: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(examId || null);

  useEffect(() => {
    const fetchExamData = async () => {
      if (!examId) return;
      
      setLoading(true);

      // Fetch current exam
      const { data: examData, error: examError } = await supabase
        .from("practice_tests")
        .select("*")
        .eq("id", examId)
        .maybeSingle();

      if (examError || !examData) {
        console.error("Error fetching exam:", examError);
        setLoading(false);
        return;
      }

      setExam(examData);
      setSelectedExamId(examData.id);

      // Fetch related exams (same grade and subject)
      const { data: related } = await supabase
        .from("practice_tests")
        .select("*")
        .eq("grade", examData.grade)
        .eq("subject", examData.subject)
        .neq("id", examId)
        .limit(8);

      setRelatedExams(related || []);

      // Fetch leaderboard data
      const { data: leaderboardData } = await supabase
        .rpc('get_exam_leaderboard', { exam_id: examId, limit_count: 10 });

      setLeaderboard(leaderboardData || []);

      // Fetch user's attempts for this exam
      if (user) {
        const { data: attempts } = await supabase
          .from("user_test_attempts")
          .select("*")
          .eq("user_id", user.id)
          .eq("test_id", examId)
          .eq("status", "completed")
          .order("completed_at", { ascending: false });

        setUserAttempts(attempts || []);

        // Fetch user's rank
        const { data: rankData } = await supabase
          .rpc('get_user_exam_rank', { exam_id: examId, user_uuid: user.id });

        if (rankData && rankData.length > 0) {
          setUserRank({ rank: rankData[0].rank, total: rankData[0].total_participants });
        }
      }

      setLoading(false);
    };

    fetchExamData();
  }, [examId, user]);

  const handleStartExam = () => {
    if (exam) {
      navigate(`/practice?examId=${exam.id}&title=${encodeURIComponent(exam.title)}`);
    }
  };

  const handleSelectExam = (id: string) => {
    setSelectedExamId(id);
    navigate(`/exams/preview/${id}`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} phút ${secs} giây`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", { 
      day: "numeric", 
      month: "numeric", 
      year: "numeric" 
    });
  };

  const getBestAttempt = () => {
    if (userAttempts.length === 0) return null;
    return userAttempts.reduce((best, current) => 
      current.score_percent > best.score_percent ? current : best
    );
  };

  const getRankIcon = (rank: number | bigint) => {
    const rankNum = Number(rank);
    if (rankNum === 1) return "🥇";
    if (rankNum === 2) return "🥈";
    if (rankNum === 3) return "🥉";
    return `${rankNum}`;
  };

  const formatLeaderboardTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} phút ${secs} giây`;
  };

  const relatedThumbnails = [examThumb1, examThumb2, examThumb3];

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[600px]" />
            <Skeleton className="h-[600px] lg:col-span-2" />
          </div>
        </main>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Header />
        <main className="container mx-auto px-4 py-12 text-center">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Không tìm thấy đề thi</h1>
          <Button onClick={() => navigate("/exams")}>Quay lại danh sách</Button>
        </main>
      </div>
    );
  }

  const bestAttempt = getBestAttempt();
  const allExamsInSet = [exam, ...relatedExams];

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Quay lại danh sách bộ đề
        </button>

        {/* Title section */}
        <div className="flex items-start gap-3 mb-6">
          <FileText className="w-6 h-6 text-primary mt-1" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              {exam.title}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {allExamsInSet.length} đề thi
              </span>
              <span className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                Độ khó: {exam.difficulty}
              </span>
            </div>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left sidebar - Exam list */}
          <div className="bg-card rounded-xl shadow-card overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-foreground">Danh sách đề thi</h2>
            </div>
            <ScrollArea className="h-[500px]">
              <div className="divide-y">
                {allExamsInSet.map((e, index) => {
                  const isSelected = e.id === selectedExamId;
                  // Simulated attempt data for demo
                  const hasAttempt = index === 0 && userAttempts.length > 0;
                  
                  return (
                    <button
                      key={e.id}
                      onClick={() => handleSelectExam(e.id)}
                      className={`w-full p-4 text-left transition-colors ${
                        isSelected 
                          ? "bg-primary/5 border-l-4 border-primary" 
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className={`font-medium text-sm ${isSelected ? "text-primary" : "text-foreground"}`}>
                            Đề {index + 1}: {e.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{e.time_limit_minutes} phút</span>
                            <span>{e.total_questions} điểm</span>
                          </div>
                          
                          {hasAttempt && bestAttempt && (
                            <div className="mt-2">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Lần thi gần nhất</span>
                                <span className="text-success font-medium">{bestAttempt.score_percent}%</span>
                              </div>
                              <Progress value={bestAttempt.score_percent} className="h-1.5 mt-1" />
                            </div>
                          )}
                        </div>
                        
                        {hasAttempt && (
                          <div className="text-right">
                            <Badge variant="outline" className="text-xs">
                              {userAttempts.length} lần thi
                            </Badge>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Right content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Exam details card */}
            <div className="bg-card rounded-xl shadow-card p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-foreground">{exam.title}</h2>
                <Button variant="gradient" size="lg" className="gap-2" onClick={handleStartExam}>
                  <Play className="w-5 h-5" />
                  Bắt đầu thi
                </Button>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <Clock className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Thời gian</p>
                  <p className="text-lg font-bold text-foreground">{exam.time_limit_minutes} phút</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <Target className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Tổng điểm</p>
                  <p className="text-lg font-bold text-foreground">{exam.total_questions} điểm</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <CheckCircle2 className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Điều kiện đạt</p>
                  <p className="text-lg font-bold text-primary">&gt;= 70%</p>
                </div>
              </div>
            </div>

            {/* Test history */}
            <div className="bg-card rounded-xl shadow-card p-6">
              <h3 className="font-semibold text-foreground mb-4">Lịch sử thi thử</h3>
              
              {userAttempts.length > 0 ? (
                <div className="space-y-4">
                  {userAttempts.slice(0, 3).map((attempt, index) => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {index === 0 ? "Lần thi gần nhất" : `Lần thi ${userAttempts.length - index}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Điểm: {attempt.correct_answers}/{attempt.total_questions} &nbsp;|&nbsp;
                          Tỷ lệ: {attempt.score_percent}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {formatDate(attempt.completed_at)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <button className="text-xs text-primary hover:underline flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            Xem chi tiết
                          </button>
                          <Badge 
                            variant="outline" 
                            className={attempt.score_percent >= 70 
                              ? "bg-success/10 text-success border-success/30" 
                              : "bg-destructive/10 text-destructive border-destructive/30"
                            }
                          >
                            {attempt.score_percent >= 70 ? "Đạt" : "Chưa đạt"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <p className="text-sm text-muted-foreground text-center">
                    Tổng cộng đã thi {userAttempts.length} lần
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Bạn chưa thi đề này</p>
                  <p className="text-sm">Bắt đầu thi để xem lịch sử của bạn</p>
                </div>
              )}
            </div>

            {/* Leaderboard */}
            <div className="bg-card rounded-xl shadow-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-foreground">Bảng xếp hạng</h3>
              </div>
              
              {leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.user_id}
                      className={`flex items-center gap-4 p-3 rounded-lg ${
                        user && entry.user_id === user.id 
                          ? "bg-primary/10 border border-primary/30" 
                          : "bg-muted/30"
                      }`}
                    >
                      <span className="text-2xl w-8">{getRankIcon(entry.rank)}</span>
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                        {entry.avatar_url ? (
                          <img src={entry.avatar_url} alt={entry.user_name} className="w-full h-full object-cover" />
                        ) : (
                          <Users className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {entry.user_name}
                          {user && entry.user_id === user.id && (
                            <span className="text-xs text-primary ml-2">(Bạn)</span>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">
                          {entry.correct_answers}/{entry.total_questions} điểm
                          <span className="text-sm font-normal text-muted-foreground ml-1">
                            ({entry.score_percent}%)
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatLeaderboardTime(entry.time_spent_seconds)}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {userRank && !leaderboard.some(e => user && e.user_id === user.id) && (
                    <div className="pt-3 border-t">
                      <p className="text-sm text-muted-foreground text-center">
                        Xếp hạng của bạn: <span className="font-bold text-primary">#{userRank.rank}</span> / {userRank.total} người tham gia
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Chưa có ai hoàn thành đề thi này</p>
                  <p className="text-sm">Hãy là người đầu tiên!</p>
                </div>
              )}
            </div>

            {/* Related exams */}
            {relatedExams.length > 0 && (
              <div className="bg-card rounded-xl shadow-card p-6">
                <h3 className="font-semibold text-foreground mb-4">Bộ đề thi liên quan</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {relatedExams.slice(0, 3).map((relatedExam, index) => (
                    <div
                      key={relatedExam.id}
                      onClick={() => handleSelectExam(relatedExam.id)}
                      className="bg-muted/30 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
                    >
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={relatedThumbnails[index % relatedThumbnails.length]}
                          alt={relatedExam.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="p-3">
                        <Badge variant="secondary" className="text-xs mb-2">
                          Có thể ôn luyện
                        </Badge>
                        <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                          {relatedExam.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {relatedExam.total_questions} đề thi
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExamPreview;
