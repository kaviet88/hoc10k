import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  AlertCircle
} from "lucide-react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { ExamStartDialog } from "@/components/exam/ExamStartDialog";
import { ExamProgressHeader } from "@/components/exam/ExamProgressHeader";
import { QuestionNavigator } from "@/components/exam/QuestionNavigator";
import { QuestionCard, Question } from "@/components/exam/QuestionCard";


const Practice = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { examId: examIdParam } = useParams<{ examId: string }>();
  const { user } = useAuth();
  
  const examTitle = searchParams.get("title") || "KIỂM TRA TRÌNH ĐỘ MOVERS 2";
  const examId = examIdParam || searchParams.get("examId");

  // Function to navigate back to exam preview
  const handleBackToPreview = () => {
    if (examId) {
      navigate(`/exams/${examId}`);
    } else {
      navigate("/");
    }
  };

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showStartDialog, setShowStartDialog] = useState(true);
  const [examStarted, setExamStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | number>>({});
  const [dropdownAnswers, setDropdownAnswers] = useState<Record<number, Record<string, string>>>({});
  const [listeningAnswers, setListeningAnswers] = useState<Record<number, Record<string, string>>>({});
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [testResult, setTestResult] = useState<{
    correct: number;
    wrong: number;
    unanswered: number;
    score: number;
  } | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"single" | "all">("single");

  const totalTime = 30 * 60;

  // Fetch questions from database
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoadingQuestions(true);
      setFetchError(null);

      if (!examId) {
        setFetchError("Không tìm thấy ID đề thi");
        setLoadingQuestions(false);
        return;
      }

      // SECURE: Use the RPC function that returns questions WITHOUT correct_answer
      const { data, error } = await supabase
        .rpc('get_practice_questions', {
          p_test_id: examId
        });

      if (error) {
        console.error("Error fetching questions:", error);
        setFetchError("Không thể tải câu hỏi. Vui lòng thử lại.");
        setLoadingQuestions(false);
        return;
      }

      if (!data || data.length === 0) {
        setFetchError("Đề thi này chưa có câu hỏi nào.");
        setLoadingQuestions(false);
        return;
      }

      // Map database questions to Question type - NO correctAnswer until submission!
      const mappedQuestions: Question[] = data.map((q: {
        id: string;
        question_number: number;
        question_text: string;
        question_type: string;
        options: unknown;
        audio_url: string | null;
        listening_blanks: unknown;
      }) => {
        const options = q.options as string[] | null;
        const listeningBlanks = q.listening_blanks as { id: string; label: string; placeholder: string }[] | null;

        return {
          id: q.question_number,
          type: q.question_type as Question["type"],
          question: q.question_text,
          options: Array.isArray(options) ? options : undefined,
          // NO correctAnswer field during the test - will be populated after submission
          points: 1,
          audioUrl: q.audio_url || undefined,
          listeningBlanks: listeningBlanks || undefined,
          // NO explanation during the test - will be populated after submission
        };
      });

      setQuestions(mappedQuestions);
      setLoadingQuestions(false);
    };

    fetchQuestions();
  }, [examId]);

  const handleStartExam = async () => {
    setShowStartDialog(false);
    setExamStarted(true);
    
    if (!user) return;
    
    const { data, error } = await supabase
      .from("user_test_attempts")
      .insert({
        user_id: user.id,
        test_id: examId || null,
        test_title: examTitle,
        total_questions: questions.length,
        status: "in_progress",
      })
      .select()
      .single();

    if (!error && data) {
      setAttemptId(data.id);
    }
  };

  useEffect(() => {
    if (!examStarted) return;
    
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [examStarted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const question = questions[currentQuestion];
  const answeredCount = Object.keys(answers).length;
  const answeredQuestions = Object.fromEntries(
    Object.keys(answers).map(id => [id, true])
  );

  const handleAnswer = (value: string | number) => {
    if (!question) return;
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  };

  const handleDropdownChange = (blankId: string, value: string) => {
    if (!question) return;
    setDropdownAnswers((prev) => ({
      ...prev,
      [question.id]: {
        ...(prev[question.id] || {}),
        [blankId]: value,
      },
    }));
    
    // Combine all dropdown answers for this question
    const currentDropdowns = { ...(dropdownAnswers[question.id] || {}), [blankId]: value };
    const combinedAnswer = Object.values(currentDropdowns).join(",");
    setAnswers((prev) => ({ ...prev, [question.id]: combinedAnswer }));
  };

  const handleListeningChange = (blankId: string, value: string) => {
    if (!question) return;
    setListeningAnswers((prev) => ({
      ...prev,
      [question.id]: {
        ...(prev[question.id] || {}),
        [blankId]: value,
      },
    }));
    
    // Combine all listening answers for this question
    const currentListening = { ...(listeningAnswers[question.id] || {}), [blankId]: value };
    const combinedAnswer = Object.values(currentListening).join(",");
    setAnswers((prev) => ({ ...prev, [question.id]: combinedAnswer }));
  };

  const handleSubmit = async () => {
    if (!user || !attemptId) {
      toast({
        title: "Vui lòng đăng nhập",
        description: "Bạn cần đăng nhập để lưu kết quả bài kiểm tra",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    // Prepare answers for secure submission
    const answersPayload = questions.map((q) => ({
      question_number: q.id,
      user_answer: answers[q.id]?.toString() || "",
    }));

    // Use secure RPC function to submit and get results with correct answers
    const { data: results, error } = await supabase
      .rpc("submit_test_answers", {
        p_attempt_id: attemptId,
        p_answers: answersPayload,
      });

    if (error) {
      console.error("Submit error:", error);
      toast({
        title: "Lỗi nộp bài",
        description: error.message,
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    // Calculate results from server response
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;

    if (results && Array.isArray(results)) {
      results.forEach((r: { is_correct: boolean; user_answer: string | null }) => {
        if (!r.user_answer || r.user_answer === "") {
          unanswered++;
        } else if (r.is_correct) {
          correct++;
        } else {
          wrong++;
        }
      });

      // Update questions with correct answers from server
      setQuestions((prev) =>
        prev.map((q) => {
          const result = results.find((r: { question_number: number; correct_answer: string }) => r.question_number === q.id);
          if (result) {
            return {
              ...q,
              correctAnswer: q.type === "multiple_choice" ? parseInt(result.correct_answer) : result.correct_answer,
            };
          }
          return q;
        })
      );
    }

    const scorePercent = Math.round((correct / questions.length) * 100);

    setTestResult({ correct, wrong, unanswered, score: scorePercent });
    setTestCompleted(true);
    setSubmitting(false);

    toast({
      title: "Nộp bài thành công! 🎉",
      description: `Điểm của bạn: ${scorePercent}% (${correct}/${questions.length} câu đúng)`,
    });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleQuestionSelect = (index: number) => {
    setCurrentQuestion(index);
  };

  const getAnswerDisplay = (q: Question, userAnswer: string | number | undefined) => {
    if (q.type === "multiple_choice" && q.options) {
      const userIndex = typeof userAnswer === 'number' ? userAnswer : parseInt(userAnswer as string);
      const correctIndex = typeof q.correctAnswer === 'number' ? q.correctAnswer : parseInt(q.correctAnswer as string);
      return {
        userAnswerText: userAnswer !== undefined ? q.options[userIndex] || userAnswer?.toString() : "Chưa trả lời",
        correctAnswerText: q.options[correctIndex] || q.correctAnswer.toString(),
      };
    }
    return {
      userAnswerText: userAnswer !== undefined ? userAnswer.toString() : "Chưa trả lời",
      correctAnswerText: q.correctAnswer.toString(),
    };
  };

  // Show loading while fetching questions
  if (loadingQuestions) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Header />
        <main className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Đang tải câu hỏi...</p>
          </div>
        </main>
      </div>
    );
  }

  // Show error if failed to fetch questions
  if (fetchError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Header />
        <main className="flex items-center justify-center h-[60vh]">
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Không thể tải đề thi</h2>
            <p className="text-muted-foreground mb-6">{fetchError}</p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={handleBackToPreview} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Quay lại
              </Button>
              <Button onClick={() => window.location.reload()}>
                Thử lại
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show start dialog
  if (showStartDialog) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <ExamStartDialog
            open={showStartDialog}
            onOpenChange={setShowStartDialog}
            examTitle={examTitle}
            timeLimit={30}
            totalQuestions={questions.length}
            maxPoints={10}
            difficulty="medium"
            onStart={handleStartExam}
            onBack={handleBackToPreview}
          />
          
          <div className="flex gap-4 justify-center mt-8">
            <Button variant="outline" onClick={handleBackToPreview} className="gap-2">
              <ChevronLeft className="w-4 h-4" />
              Quay lại danh sách
            </Button>
            <Button onClick={() => navigate("/exams")} className="bg-success hover:bg-success/90">
              Về trang môn học
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Show results if test completed
  if (testCompleted && testResult) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto bg-card rounded-xl shadow-card p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Hoàn thành bài kiểm tra!</h1>
            <p className="text-muted-foreground mb-8">Kết quả của bạn đã được lưu lại</p>

            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-primary/10 rounded-lg p-4">
                <p className="text-3xl font-bold text-primary">{testResult.score}%</p>
                <p className="text-sm text-muted-foreground">Điểm số</p>
              </div>
              <div className="bg-success/10 rounded-lg p-4">
                <p className="text-3xl font-bold text-success">{testResult.correct}</p>
                <p className="text-sm text-muted-foreground">Đúng</p>
              </div>
              <div className="bg-destructive/10 rounded-lg p-4">
                <p className="text-3xl font-bold text-destructive">{testResult.wrong}</p>
                <p className="text-sm text-muted-foreground">Sai</p>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-3xl font-bold text-muted-foreground">{testResult.unanswered}</p>
                <p className="text-sm text-muted-foreground">Bỏ qua</p>
              </div>
            </div>

            <div className="flex gap-4 justify-center mb-6">
              <Button variant="outline" onClick={handleBackToPreview} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Quay lại đề thi
              </Button>
              <Button variant="outline" onClick={() => setShowReview(!showReview)}>
                <Eye className="w-4 h-4 mr-2" />
                {showReview ? "Ẩn đáp án" : "Xem lại đáp án"}
              </Button>
              <Button onClick={() => window.location.reload()}>
                Làm lại bài kiểm tra
              </Button>
            </div>

            {/* Answer Review Section */}
            {showReview && (
              <div className="mt-8 text-left">
                <h2 className="text-lg font-semibold text-foreground mb-4 text-center">Xem lại đáp án</h2>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {questions.map((q, index) => {
                    const userAnswer = answers[q.id];
                    const isCorrect = userAnswer?.toString() === q.correctAnswer.toString();
                    const isUnanswered = userAnswer === undefined;
                    const { userAnswerText, correctAnswerText } = getAnswerDisplay(q, userAnswer);
                    const isExpanded = expandedQuestion === q.id;

                    return (
                      <div
                        key={q.id}
                        className={`border rounded-lg overflow-hidden ${
                          isCorrect 
                            ? "border-success/50 bg-success/5" 
                            : isUnanswered 
                            ? "border-muted bg-muted/20" 
                            : "border-destructive/50 bg-destructive/5"
                        }`}
                      >
                        <button
                          onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
                          className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {isCorrect ? (
                              <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                            ) : isUnanswered ? (
                              <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                            ) : (
                              <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                            )}
                            <span className="font-medium text-foreground">Câu {index + 1}</span>
                            <Badge variant="outline" className={`text-xs ${
                              isCorrect ? "text-success border-success" : isUnanswered ? "text-muted-foreground" : "text-destructive border-destructive"
                            }`}>
                              {isCorrect ? "Đúng" : isUnanswered ? "Bỏ qua" : "Sai"}
                            </Badge>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-border/50">
                            <div className="pt-4">
                              <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">
                                {q.question}
                              </p>
                              <div className="space-y-2">
                                <div className="flex items-start gap-2">
                                  <span className="text-sm font-medium text-muted-foreground min-w-[100px]">Bạn chọn:</span>
                                  <span className={`text-sm ${isCorrect ? "text-success" : isUnanswered ? "text-muted-foreground italic" : "text-destructive"}`}>
                                    {userAnswerText}
                                  </span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="text-sm font-medium text-muted-foreground min-w-[100px]">Đáp án đúng:</span>
                                  <span className="text-sm text-success font-medium">{correctAnswerText}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Check if question exists
  if (!question) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Header />
        <main className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Không tìm thấy câu hỏi</p>
            <Button onClick={handleBackToPreview} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Compact Header */}
      <div className="bg-card border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={handleBackToPreview} title="Quay lại xem trước đề thi">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg font-bold text-foreground">{examTitle}</h1>
                <p className="text-sm text-muted-foreground">Câu {currentQuestion + 1} / {questions.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* View mode toggle */}
              <div className="flex items-center bg-muted rounded-lg p-1">
                <button
                  onClick={() => setViewMode("single")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    viewMode === "single" ? "bg-card shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  Từng câu
                </button>
                <button
                  onClick={() => setViewMode("all")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    viewMode === "all" ? "bg-card shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  Tất cả
                </button>
              </div>

              {/* Timer */}
              <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full">
                <Clock className="w-4 h-4 text-primary" />
                <span className="font-bold text-primary text-lg">{formatTime(timeRemaining)}</span>
                <span className="text-sm text-muted-foreground">Thời gian còn lại</span>
              </div>

              {/* Submit button */}
              <Button 
                className="bg-primary hover:bg-primary/90 px-6" 
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Nộp bài
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        {/* Progress Header */}
        <ExamProgressHeader
          currentQuestion={currentQuestion}
          totalQuestions={questions.length}
          answeredCount={answeredCount}
          timeRemaining={timeRemaining}
          totalTime={totalTime}
        />

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question card - takes 2 columns */}
          <div className="lg:col-span-2">
            <QuestionCard
              question={question}
              questionNumber={currentQuestion + 1}
              totalQuestions={questions.length}
              selectedAnswer={answers[question.id]}
              dropdownAnswers={dropdownAnswers[question.id]}
              listeningAnswers={listeningAnswers[question.id]}
              onAnswerChange={handleAnswer}
              onDropdownChange={handleDropdownChange}
              onListeningChange={handleListeningChange}
            />
          </div>

          {/* Navigator sidebar */}
          <div>
            <QuestionNavigator
              totalQuestions={questions.length}
              currentQuestion={currentQuestion}
              answeredQuestions={answeredQuestions}
              onQuestionSelect={handleQuestionSelect}
              onPrevious={handlePrevious}
              onNext={handleNext}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Practice;
