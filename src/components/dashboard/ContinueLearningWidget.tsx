import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Play, BookOpen, ArrowRight, Loader2 } from "lucide-react";

interface ContinueLearningData {
  programId: string;
  programName: string;
  programType: string;
  nextLessonId: string;
  nextLessonTitle: string;
  nextLessonOrder: number;
  completedLessons: number;
  totalLessons: number;
  lastAccessedAt: string;
}

interface ContinueLearningWidgetProps {
  userId: string;
}

export const ContinueLearningWidget = ({ userId }: ContinueLearningWidgetProps) => {
  const [data, setData] = useState<ContinueLearningData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContinueLearning = async () => {
      try {
        // Get the most recently accessed lesson progress
        const { data: recentProgress } = await supabase
          .from("user_lesson_progress")
          .select("*")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!recentProgress) {
          // No progress yet, try to get first purchased course
          const { data: firstPurchase } = await supabase
            .from("purchase_history")
            .select("*")
            .eq("user_id", userId)
            .order("purchased_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (firstPurchase) {
            // Get first lesson of this program
            const { data: firstLesson } = await supabase
              .from("program_lessons")
              .select("*")
              .eq("program_id", firstPurchase.program_id)
              .order("lesson_order", { ascending: true })
              .limit(1)
              .maybeSingle();

            const { count: totalLessonsCount } = await supabase
              .from("program_lessons")
              .select("*", { count: "exact", head: true })
              .eq("program_id", firstPurchase.program_id);

            if (firstLesson) {
              setData({
                programId: firstPurchase.program_id,
                programName: firstPurchase.program_name,
                programType: firstPurchase.program_type,
                nextLessonId: firstLesson.lesson_id,
                nextLessonTitle: firstLesson.lesson_title,
                nextLessonOrder: firstLesson.lesson_order,
                completedLessons: 0,
                totalLessons: totalLessonsCount || 1,
                lastAccessedAt: firstPurchase.purchased_at,
              });
            }
          }
          setLoading(false);
          return;
        }

        const programId = recentProgress.program_id;

        // Get program info from purchase history
        const { data: purchase } = await supabase
          .from("purchase_history")
          .select("*")
          .eq("user_id", userId)
          .eq("program_id", programId)
          .maybeSingle();

        if (!purchase) {
          setLoading(false);
          return;
        }

        // Get all lessons for this program
        const { data: allLessons } = await supabase
          .from("program_lessons")
          .select("*")
          .eq("program_id", programId)
          .order("lesson_order", { ascending: true });

        // Get completed lessons for this program
        const { data: completedProgress } = await supabase
          .from("user_lesson_progress")
          .select("lesson_id")
          .eq("user_id", userId)
          .eq("program_id", programId)
          .eq("completed", true);

        const completedLessonIds = new Set(completedProgress?.map((p) => p.lesson_id) || []);
        const completedCount = completedLessonIds.size;
        const totalLessons = allLessons?.length || 0;

        // Find the next incomplete lesson
        const nextLesson = allLessons?.find((lesson) => !completedLessonIds.has(lesson.lesson_id));

        if (nextLesson) {
          setData({
            programId: purchase.program_id,
            programName: purchase.program_name,
            programType: purchase.program_type,
            nextLessonId: nextLesson.lesson_id,
            nextLessonTitle: nextLesson.lesson_title,
            nextLessonOrder: nextLesson.lesson_order,
            completedLessons: completedCount,
            totalLessons,
            lastAccessedAt: recentProgress.updated_at,
          });
        } else if (allLessons && allLessons.length > 0) {
          // All lessons completed, show last lesson
          const lastLesson = allLessons[allLessons.length - 1];
          setData({
            programId: purchase.program_id,
            programName: purchase.program_name,
            programType: purchase.program_type,
            nextLessonId: lastLesson.lesson_id,
            nextLessonTitle: lastLesson.lesson_title,
            nextLessonOrder: lastLesson.lesson_order,
            completedLessons: completedCount,
            totalLessons,
            lastAccessedAt: recentProgress.updated_at,
          });
        }
      } catch (error) {
        console.error("Error fetching continue learning data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContinueLearning();
  }, [userId]);

  if (loading) {
    return (
      <Card className="shadow-card mb-8">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="shadow-card mb-8 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-bold text-foreground mb-1">
                Bắt đầu hành trình học tập
              </h3>
              <p className="text-sm text-muted-foreground">
                Mua khóa học đầu tiên để bắt đầu!
              </p>
            </div>
            <Link to="/purchase">
              <Button className="gradient-primary gap-2">
                Khám phá khóa học
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressPercent = data.totalLessons > 0 
    ? Math.round((data.completedLessons / data.totalLessons) * 100) 
    : 0;
  const isCompleted = data.completedLessons === data.totalLessons;

  return (
    <Card className="shadow-card mb-8 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Left section - Course info */}
          <div className="flex-1 p-6 bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Play className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground mb-1">
                  {isCompleted ? "Đã hoàn thành" : "Tiếp tục học"}
                </p>
                <h3 className="text-lg font-bold text-foreground mb-1 truncate">
                  {data.programName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Bài {data.nextLessonOrder}: {data.nextLessonTitle}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Tiến độ</span>
                <span className="font-medium text-foreground">
                  {data.completedLessons}/{data.totalLessons} bài học
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          </div>

          {/* Right section - CTA */}
          <div className="p-6 flex items-center justify-center bg-muted/30 md:w-48">
            <Link to={`/lessons/${data.programId}/${data.nextLessonId}`}>
              <Button className="gradient-primary gap-2 whitespace-nowrap">
                {isCompleted ? "Xem lại" : "Học tiếp"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
