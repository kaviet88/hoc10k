import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, RotateCcw, Trophy, ArrowRight, Loader2, HelpCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  // correct_answer and explanation are only available after checking
  correct_answer?: number;
  explanation?: string | null;
}

interface LessonQuizProps {
  lessonId: string;
  programId: string;
  lessonTitle: string;
}

export const LessonQuiz = ({ lessonId, programId, lessonTitle }: LessonQuizProps) => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [checkingAnswer, setCheckingAnswer] = useState(false);

  useEffect(() => {
    fetchQuizData();
  }, [lessonId, programId]);

  const fetchQuizData = async () => {
    setLoading(true);
    // SECURE: Use RPC function that returns questions WITHOUT correct_answer
    const { data, error } = await supabase
      .rpc('get_lesson_quiz_questions', {
        p_lesson_id: lessonId,
        p_program_id: programId
      });

    if (data && !error) {
      const formattedQuestions = data.map((q: {
        id: string;
        question: string;
        options: unknown;
        question_order: number;
      }) => ({
        id: q.id,
        question: q.question,
        options: q.options as string[],
        // NO correct_answer until the user checks their answer
      }));
      setQuestions(formattedQuestions);
    }
    setLoading(false);
  };

  const handleSelectAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null) {
      toast({
        title: "Vui lòng chọn đáp án",
        variant: "destructive",
      });
      return;
    }

    setCheckingAnswer(true);

    // SECURE: Use RPC function to check answer and get correct_answer + explanation
    const { data, error } = await supabase
      .rpc('check_lesson_quiz_answer', {
        p_question_id: questions[currentQuestion].id,
        p_user_answer: selectedAnswer
      });

    if (error) {
      console.error("Error checking answer:", error);
      toast({
        title: "Lỗi kiểm tra đáp án",
        description: "Vui lòng thử lại",
        variant: "destructive",
      });
      setCheckingAnswer(false);
      return;
    }

    if (data && data.length > 0) {
      const result = data[0];
      
      // Update the current question with correct_answer and explanation
      setQuestions((prev) =>
        prev.map((q, idx) =>
          idx === currentQuestion
            ? { ...q, correct_answer: result.correct_answer, explanation: result.explanation }
            : q
        )
      );

      if (result.is_correct) {
        setScore((prev) => prev + 1);
      }
    }

    setAnswers((prev) => [...prev, selectedAnswer]);
    setShowResult(true);
    setCheckingAnswer(false);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnswers([]);
    setQuizCompleted(false);
    // Re-fetch questions to clear correct_answer data
    fetchQuizData();
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-6 text-center min-h-[300px] flex flex-col items-center justify-center">
        <HelpCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Chưa có câu hỏi quiz cho bài học này</p>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const isCorrect = showResult && currentQ.correct_answer !== undefined && selectedAnswer === currentQ.correct_answer;
  const percentage = Math.round((score / questions.length) * 100);

  if (quizCompleted) {
    return (
      <div className="p-6 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <Trophy className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">Hoàn thành Quiz!</h3>
          <p className="text-muted-foreground">{lessonTitle}</p>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-card mb-6 max-w-md mx-auto">
          <div className="text-5xl font-bold text-primary mb-2">{percentage}%</div>
          <p className="text-muted-foreground mb-4">
            {score}/{questions.length} câu đúng
          </p>

          <div className="flex items-center justify-center gap-2 flex-wrap">
            {answers.map((ans, index) => {
              const q = questions[index];
              const isAnswerCorrect = q.correct_answer !== undefined && ans === q.correct_answer;
              return (
                <div
                  key={index}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isAnswerCorrect
                      ? "bg-success/20 text-success"
                      : "bg-destructive/20 text-destructive"
                  }`}
                >
                  {index + 1}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" onClick={handleRestart} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Làm lại
          </Button>
          <Button variant="gradient">Tiếp tục học</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Progress */}
      <div className="flex items-center justify-between mb-6">
        <Badge variant="secondary">
          Câu {currentQuestion + 1}/{questions.length}
        </Badge>
        <div className="flex items-center gap-1">
          {questions.map((q, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index < currentQuestion
                  ? q.correct_answer !== undefined && answers[index] === q.correct_answer
                    ? "bg-success"
                    : "bg-destructive"
                  : index === currentQuestion
                  ? "bg-primary"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>
        <Badge variant="outline" className="gap-1">
          <CheckCircle2 className="w-3 h-3 text-success" />
          {score} điểm
        </Badge>
      </div>

      {/* Question */}
      <div className="bg-card rounded-xl p-6 shadow-card mb-6">
        <h3 className="text-lg font-bold text-foreground mb-6">{currentQ.question}</h3>

        <div className="space-y-3">
          {currentQ.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrectAnswer = showResult && currentQ.correct_answer !== undefined && index === currentQ.correct_answer;
            let optionClass = "border-border hover:border-primary/50 hover:bg-primary/5";

            if (showResult && currentQ.correct_answer !== undefined) {
              if (isCorrectAnswer) {
                optionClass = "border-success bg-success/10";
              } else if (isSelected && !isCorrectAnswer) {
                optionClass = "border-destructive bg-destructive/10";
              }
            } else if (isSelected) {
              optionClass = "border-primary bg-primary/10";
            }

            return (
              <button
                key={index}
                onClick={() => handleSelectAnswer(index)}
                disabled={showResult || checkingAnswer}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${optionClass}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    showResult && isCorrectAnswer
                      ? "bg-success text-success-foreground"
                      : showResult && isSelected && !isCorrectAnswer
                      ? "bg-destructive text-destructive-foreground"
                      : isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {showResult ? (
                    isCorrectAnswer ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isSelected ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      String.fromCharCode(65 + index)
                    )
                  ) : (
                    String.fromCharCode(65 + index)
                  )}
                </div>
                <span
                  className={`font-medium ${
                    showResult && isCorrectAnswer
                      ? "text-success"
                      : showResult && isSelected && !isCorrectAnswer
                      ? "text-destructive"
                      : "text-foreground"
                  }`}
                >
                  {option}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Explanation */}
      {showResult && currentQ.explanation && (
        <div
          className={`rounded-xl p-4 mb-6 ${
            isCorrect ? "bg-success/10 border border-success/20" : "bg-destructive/10 border border-destructive/20"
          }`}
        >
          <div className="flex items-start gap-3">
            {isCorrect ? (
              <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            )}
            <div>
              <p className={`font-medium ${isCorrect ? "text-success" : "text-destructive"}`}>
                {isCorrect ? "Chính xác! 🎉" : "Chưa đúng!"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{currentQ.explanation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center">
        {!showResult ? (
          <Button 
            variant="gradient" 
            onClick={handleSubmitAnswer} 
            className="px-8"
            disabled={checkingAnswer}
          >
            {checkingAnswer ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang kiểm tra...
              </>
            ) : (
              "Kiểm tra đáp án"
            )}
          </Button>
        ) : (
          <Button variant="gradient" onClick={handleNextQuestion} className="gap-2 px-8">
            {currentQuestion < questions.length - 1 ? "Câu tiếp theo" : "Xem kết quả"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};