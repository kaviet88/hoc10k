import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  ArrowRight, 
  AlertTriangle, 
  Clock, 
  ChevronLeft,
  HelpCircle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Question {
  id: number;
  type: "multiple_choice" | "fill_blank";
  question: string;
  image?: string;
  options?: string[];
  correctAnswer: string | number;
  points: number;
}

const sampleQuestions: Question[] = [
  {
    id: 1,
    type: "multiple_choice",
    question: "Trong hình trên có bao nhiêu đoạn thẳng?",
    image: "polygon",
    options: ["12 đoạn thẳng", "10 đoạn thẳng", "11 đoạn thẳng", "9 đoạn thẳng"],
    correctAnswer: 2,
    points: 1,
  },
  {
    id: 2,
    type: "fill_blank",
    question: "Đề bài nào đúng với sơ đồ sau đây?\n\nĐề bài 1: Sách Toán có 24 trang. Sách Toán có nhiều hơn sách Văn 16 trang. Hỏi sách Văn có bao nhiêu trang?\nĐề bài 2: Sách Toán có 24 trang. Sách Toán có ít hơn sách Văn 16 trang. Hỏi sách Văn có bao nhiêu trang?\nĐề bài 3: Sách Văn có 24 trang. Sách Văn có nhiều hơn sách Toán 16 trang. Hỏi sách Toán có bao nhiêu trang?\nĐề bài 4: Sách Văn có 16 trang. Sách Văn có nhiều hơn sách Toán 24 trang. Hỏi sách Toán có bao nhiêu trang?",
    image: "diagram",
    correctAnswer: "1",
    points: 1,
  },
  {
    id: 3,
    type: "multiple_choice",
    question: "Kết quả của phép tính 25 + 17 = ?",
    options: ["41", "42", "43", "44"],
    correctAnswer: 1,
    points: 1,
  },
  {
    id: 4,
    type: "multiple_choice",
    question: "Số liền sau của 99 là:",
    options: ["98", "100", "101", "97"],
    correctAnswer: 1,
    points: 1,
  },
  {
    id: 5,
    type: "fill_blank",
    question: "Điền số thích hợp vào chỗ trống: 15 + ___ = 28",
    correctAnswer: "13",
    points: 1,
  },
];

// Generate 30 questions by repeating sample
const allQuestions: Question[] = Array.from({ length: 30 }, (_, i) => ({
  ...sampleQuestions[i % sampleQuestions.length],
  id: i + 1,
}));

const Practice = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | number>>({});
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes
  const [showHint, setShowHint] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [testResult, setTestResult] = useState<{
    correct: number;
    wrong: number;
    unanswered: number;
    score: number;
  } | null>(null);

  // Create test attempt on mount
  useEffect(() => {
    const createAttempt = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("user_test_attempts")
        .insert({
          user_id: user.id,
          test_title: "(VT) Toán VIOEDU 2: Ôn tập hình học",
          total_questions: allQuestions.length,
          status: "in_progress",
        })
        .select()
        .single();

      if (!error && data) {
        setAttemptId(data.id);
      }
    };

    createAttempt();
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const question = allQuestions[currentQuestion];
  const answeredCount = Object.keys(answers).length;
  const completionPercent = Math.round((answeredCount / allQuestions.length) * 100);

  const handleAnswer = (value: string | number) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
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

    // Calculate results
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;

    const answersToInsert = allQuestions.map((q) => {
      const userAnswer = answers[q.id];
      const correctAnswer = q.correctAnswer.toString();
      const isCorrect = userAnswer?.toString() === correctAnswer;
      
      if (userAnswer === undefined) {
        unanswered++;
      } else if (isCorrect) {
        correct++;
      } else {
        wrong++;
      }

      return {
        attempt_id: attemptId,
        question_number: q.id,
        user_answer: userAnswer?.toString() || null,
        correct_answer: correctAnswer,
        is_correct: isCorrect,
      };
    });

    const scorePercent = Math.round((correct / allQuestions.length) * 100);
    const timeSpent = 30 * 60 - timeRemaining;

    // Save answers
    await supabase.from("user_test_answers").insert(answersToInsert);

    // Update attempt
    await supabase
      .from("user_test_attempts")
      .update({
        correct_answers: correct,
        wrong_answers: wrong,
        unanswered: unanswered,
        score_percent: scorePercent,
        time_spent_seconds: timeSpent,
        completed_at: new Date().toISOString(),
        status: "completed",
      })
      .eq("id", attemptId);

    setTestResult({ correct, wrong, unanswered, score: scorePercent });
    setTestCompleted(true);
    setSubmitting(false);

    toast({
      title: "Nộp bài thành công! 🎉",
      description: `Điểm của bạn: ${scorePercent}% (${correct}/${allQuestions.length} câu đúng)`,
    });
  };

  const handleNext = () => {
    if (currentQuestion < allQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setShowHint(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
      setShowHint(false);
    }
  };

  const handleQuestionSelect = (index: number) => {
    setCurrentQuestion(index);
    setShowHint(false);
  };

  const getQuestionStatus = (index: number) => {
    if (index === currentQuestion) return "current";
    if (answers[allQuestions[index].id] !== undefined) return "answered";
    return "unanswered";
  };

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

            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => navigate("/")}>
                Về trang chủ
              </Button>
              <Button onClick={() => window.location.reload()}>
                Làm lại bài kiểm tra
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Back button and title */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">(VT) Toán VIOEDU 2: Ôn tập hình học</h1>
            <p className="text-sm text-muted-foreground">Câu {currentQuestion + 1} / {allQuestions.length}</p>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-full border">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-bold text-primary">{formatTime(timeRemaining)}</span>
              <span className="text-sm text-muted-foreground">Thời gian còn lại</span>
            </div>
            <Button 
              className="bg-success hover:bg-success/90" 
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Nộp bài
            </Button>
          </div>
        </div>

        {/* Progress Header */}
        <div className="bg-card rounded-xl p-4 shadow-card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Câu hỏi: {currentQuestion + 1} / {allQuestions.length}</span>
              <span className="text-sm text-muted-foreground">({answeredCount} đã trả lời)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Hoàn thành: {completionPercent}%</span>
              <Progress value={completionPercent} className="w-32 h-2" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Thời gian:</span>
              <span className="font-bold text-primary">{formatTime(timeRemaining)}</span>
              <Progress value={(timeRemaining / (30 * 60)) * 100} className="w-24 h-2" />
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-sm text-muted-foreground">Đã trả lời</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-muted" />
                <span className="text-sm text-muted-foreground">Chưa trả lời</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm text-muted-foreground">Đang làm</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm text-muted-foreground">Thời gian</span>
              </div>
            </div>

            <div className="flex items-center gap-8 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{currentQuestion + 1}</p>
                <p className="text-xs text-muted-foreground">Câu hiện tại</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-success">{answeredCount}</p>
                <p className="text-xs text-muted-foreground">Đã trả lời</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{allQuestions.length - answeredCount}</p>
                <p className="text-xs text-muted-foreground">Còn lại</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{completionPercent}%</p>
                <p className="text-xs text-muted-foreground">Hoàn thành</p>
              </div>
            </div>
          </div>

          {/* Encouragement message */}
          <div className="text-center mt-4">
            <span className="text-success">🚀 Bắt đầu tốt! Hãy tiếp tục cố gắng!</span>
          </div>
        </div>

        {/* Main content */}
        <div className="flex gap-6">
          {/* Question Card */}
          <div className="flex-1 bg-card rounded-xl shadow-card overflow-hidden">
            {/* Question header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-primary border-primary">
                  Câu {currentQuestion + 1} / {allQuestions.length}
                </Badge>
                <Badge className={question.type === "multiple_choice" ? "bg-success" : "bg-primary"}>
                  {question.type === "multiple_choice" ? "Trắc nghiệm" : "Điền vào chỗ trống"}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="text-destructive border-destructive gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Báo lỗi
                </Button>
                <span className="text-sm text-muted-foreground">{question.points} điểm</span>
              </div>
            </div>

            {/* Question content */}
            <div className="p-6">
              <p className="text-lg font-medium text-foreground mb-2">Bạn hãy chọn đáp án đúng.</p>
              
              {/* Question image/diagram */}
              {question.image && (
                <div className="bg-muted/30 rounded-lg p-6 mb-6 flex justify-center">
                  {question.image === "polygon" && (
                    <svg width="300" height="250" viewBox="0 0 300 250" className="text-foreground">
                      {/* Polygon shape */}
                      <polygon 
                        points="150,30 250,80 270,180 150,220 30,180 50,80" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                      />
                      {/* Internal lines */}
                      <line x1="150" y1="30" x2="150" y2="220" stroke="currentColor" strokeWidth="1.5" />
                      <line x1="50" y1="80" x2="270" y2="180" stroke="currentColor" strokeWidth="1.5" />
                      <line x1="250" y1="80" x2="30" y2="180" stroke="currentColor" strokeWidth="1.5" />
                      {/* Labels */}
                      <text x="140" y="20" className="text-sm fill-current">B</text>
                      <text x="260" y="75" className="text-sm fill-current">C</text>
                      <text x="280" y="185" className="text-sm fill-current">D</text>
                      <text x="140" y="240" className="text-sm fill-current">K</text>
                      <text x="15" y="185" className="text-sm fill-current">M</text>
                      <text x="35" y="75" className="text-sm fill-current">A</text>
                      <text x="275" y="220" className="text-sm fill-current">E</text>
                      <text x="200" y="220" className="text-sm fill-current">H</text>
                    </svg>
                  )}
                  {question.image === "diagram" && (
                    <div className="text-center">
                      <div className="inline-block border-2 border-foreground rounded p-4">
                        <p className="text-sm mb-2">? trang</p>
                        <div className="flex items-center gap-4">
                          <div className="text-left">
                            <p className="font-medium">Sách Văn</p>
                            <p className="font-medium">Sách Toán</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="h-6 w-24 bg-primary/20 border border-primary rounded flex items-center justify-end px-2">
                              <span className="text-xs">16 trang</span>
                            </div>
                            <div className="h-6 w-40 bg-success/20 border border-success rounded flex items-center justify-end px-2">
                              <span className="text-xs">24 trang</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <p className="text-foreground mb-6 whitespace-pre-line">{question.question}</p>

              {/* Answer options */}
              {question.type === "multiple_choice" && question.options && (
                <RadioGroup
                  value={answers[question.id]?.toString()}
                  onValueChange={(value) => handleAnswer(parseInt(value))}
                  className="space-y-3"
                >
                  {question.options.map((option, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                        answers[question.id] === index
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        <span className="font-medium text-primary mr-2">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {question.type === "fill_blank" && (
                <div className="flex items-center gap-3">
                  <span className="text-foreground">Đề bài đúng là đề bài số</span>
                  <Input
                    type="text"
                    placeholder="Ô trống 1"
                    value={answers[question.id]?.toString() || ""}
                    onChange={(e) => handleAnswer(e.target.value)}
                    className="w-32"
                  />
                </div>
              )}

              {/* Hint section */}
              <button
                onClick={() => setShowHint(!showHint)}
                className="flex items-center gap-2 text-primary mt-6 hover:underline"
              >
                <HelpCircle className="w-4 h-4" />
                Hướng dẫn
              </button>

              {showHint && (
                <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    Đọc kỹ đề bài và quan sát hình vẽ để tìm ra đáp án đúng.
                  </p>
                </div>
              )}

              {/* Progress */}
              <div className="flex items-center gap-2 mt-6">
                <span className="text-sm text-muted-foreground">Tiến độ:</span>
                <Progress value={completionPercent} className="flex-1 h-2" />
                <span className="text-sm text-muted-foreground">{answeredCount} / {allQuestions.length}</span>
              </div>
            </div>
          </div>

          {/* Question Navigator */}
          <div className="w-72 shrink-0">
            <div className="bg-card rounded-xl shadow-card p-4">
              {/* Question grid */}
              <div className="grid grid-cols-6 gap-2 mb-6">
                {allQuestions.map((_, index) => {
                  const status = getQuestionStatus(index);
                  return (
                    <button
                      key={index}
                      onClick={() => handleQuestionSelect(index)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        status === "current"
                          ? "bg-primary text-primary-foreground"
                          : status === "answered"
                          ? "bg-success/20 text-success border border-success"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              <p className="text-sm text-muted-foreground text-center mb-4">
                {allQuestions.length} câu hỏi • Câu {currentQuestion + 1}/{allQuestions.length}
              </p>

              {/* Navigation buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-1"
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Câu trước
                </Button>
                <Button
                  className="flex-1 gap-1 bg-primary"
                  onClick={handleNext}
                  disabled={currentQuestion === allQuestions.length - 1}
                >
                  Câu tiếp
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Practice;
