import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle2, 
  XCircle, 
  MinusCircle, 
  Clock, 
  Target, 
  Calendar,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TestAttempt {
  id: string;
  score_percent: number;
  correct_answers: number;
  wrong_answers: number;
  unanswered: number;
  total_questions: number;
  completed_at: string;
  time_spent_seconds: number;
  test_title: string;
}

interface AnswerDetail {
  id: string;
  question_number: number;
  user_answer: string | null;
  correct_answer: string;
  is_correct: boolean;
}

interface AttemptReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attempt: TestAttempt | null;
}

export const AttemptReviewDialog = ({ 
  open, 
  onOpenChange, 
  attempt 
}: AttemptReviewDialogProps) => {
  const [answers, setAnswers] = useState<AnswerDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchAnswers = async () => {
      if (!attempt || !open) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from("user_test_answers")
        .select("*")
        .eq("attempt_id", attempt.id)
        .order("question_number", { ascending: true });

      if (error) {
        console.error("Error fetching answers:", error);
      } else {
        setAnswers(data || []);
      }
      setLoading(false);
    };

    fetchAnswers();
  }, [attempt, open]);

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
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const toggleQuestion = (questionNumber: number) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionNumber)) {
        newSet.delete(questionNumber);
      } else {
        newSet.add(questionNumber);
      }
      return newSet;
    });
  };

  const getStatusIcon = (answer: AnswerDetail) => {
    if (!answer.user_answer) {
      return <MinusCircle className="w-5 h-5 text-muted-foreground" />;
    }
    return answer.is_correct 
      ? <CheckCircle2 className="w-5 h-5 text-success" />
      : <XCircle className="w-5 h-5 text-destructive" />;
  };

  const getStatusBadge = (answer: AnswerDetail) => {
    if (!answer.user_answer) {
      return <Badge variant="outline" className="bg-muted/50">Bỏ qua</Badge>;
    }
    return answer.is_correct 
      ? <Badge variant="outline" className="bg-success/10 text-success border-success/30">Đúng</Badge>
      : <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">Sai</Badge>;
  };

  if (!attempt) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-xl">{attempt.test_title}</DialogTitle>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {formatDate(attempt.completed_at)}
          </p>
        </DialogHeader>

        {/* Summary Stats */}
        <div className="px-6 py-4 bg-muted/30 border-b">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Target className="w-4 h-4" />
                <span className="text-xs">Điểm số</span>
              </div>
              <p className="text-lg font-bold text-foreground">
                {attempt.correct_answers}/{attempt.total_questions}
              </p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span className="text-xs">Đúng</span>
              </div>
              <p className="text-lg font-bold text-success">{attempt.correct_answers}</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <XCircle className="w-4 h-4 text-destructive" />
                <span className="text-xs">Sai</span>
              </div>
              <p className="text-lg font-bold text-destructive">{attempt.wrong_answers}</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs">Thời gian</span>
              </div>
              <p className="text-sm font-bold text-foreground">{formatTime(attempt.time_spent_seconds)}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-4">
            <Badge 
              variant="outline" 
              className={`text-base px-4 py-1 ${
                attempt.score_percent >= 70 
                  ? "bg-success/10 text-success border-success/30" 
                  : "bg-destructive/10 text-destructive border-destructive/30"
              }`}
            >
              {attempt.score_percent}% - {attempt.score_percent >= 70 ? "Đạt" : "Chưa đạt"}
            </Badge>
          </div>
        </div>

        {/* Answer List */}
        <ScrollArea className="flex-1 max-h-[400px]">
          <div className="p-6 space-y-3">
            <h4 className="font-semibold text-foreground mb-4">Chi tiết từng câu hỏi</h4>
            
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : answers.length > 0 ? (
              <div className="space-y-2">
                {answers.map((answer) => (
                  <div
                    key={answer.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleQuestion(answer.question_number)}
                      className="w-full p-4 flex items-center justify-between bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(answer)}
                        <span className="font-medium text-foreground">
                          Câu {answer.question_number}
                        </span>
                        {getStatusBadge(answer)}
                      </div>
                      {expandedQuestions.has(answer.question_number) 
                        ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      }
                    </button>
                    
                    {expandedQuestions.has(answer.question_number) && (
                      <div className="p-4 bg-muted/20 border-t space-y-3">
                        <div className="flex items-start gap-2">
                          <span className="text-sm text-muted-foreground min-w-[100px]">Đáp án của bạn:</span>
                          <span className={`text-sm font-medium ${
                            !answer.user_answer 
                              ? "text-muted-foreground italic" 
                              : answer.is_correct 
                                ? "text-success" 
                                : "text-destructive"
                          }`}>
                            {answer.user_answer || "Không trả lời"}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-sm text-muted-foreground min-w-[100px]">Đáp án đúng:</span>
                          <span className="text-sm font-medium text-success">
                            {answer.correct_answer}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Không có dữ liệu chi tiết cho lần thi này</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
