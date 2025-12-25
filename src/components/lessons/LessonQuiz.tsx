import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, RotateCcw, Trophy, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface LessonQuizProps {
  lessonTitle: string;
}

export const LessonQuiz = ({ lessonTitle }: LessonQuizProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Sample quiz data - in a real app, this would come from the database
  const questions: QuizQuestion[] = [
    {
      id: "q1",
      question: 'Từ nào sau đây là danh từ KHÔNG đếm được?',
      options: ["Apple", "Water", "Book", "Cat"],
      correctAnswer: 1,
      explanation: '"Water" (nước) là danh từ không đếm được vì không thể đếm trực tiếp.',
    },
    {
      id: "q2",
      question: 'Câu nào sau đây đúng ngữ pháp?',
      options: ["I have a water", "I have water", "I have two waters", "I have an water"],
      correctAnswer: 1,
      explanation: 'Danh từ không đếm được như "water" không dùng mạo từ a/an.',
    },
    {
      id: "q3",
      question: "Điền từ thích hợp: I need ___ milk for the recipe.",
      options: ["a", "an", "some", "many"],
      correctAnswer: 2,
      explanation: 'Với danh từ không đếm được, ta dùng "some" thay vì "a/an" hoặc "many".',
    },
    {
      id: "q4",
      question: "Từ nào sau đây là danh từ ĐẾM ĐƯỢC?",
      options: ["Rice", "Information", "Student", "Bread"],
      correctAnswer: 2,
      explanation: '"Student" là danh từ đếm được, có thể nói "one student, two students".',
    },
    {
      id: "q5",
      question: 'Chọn câu đúng:',
      options: [
        "There are many informations",
        "There is much information",
        "There are much information",
        "There is many informations",
      ],
      correctAnswer: 1,
      explanation: '"Information" là danh từ không đếm được, dùng với "much", không thêm "s".',
    },
  ];

  const handleSelectAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) {
      toast({
        title: "Vui lòng chọn đáp án",
        variant: "destructive",
      });
      return;
    }

    const isCorrect = selectedAnswer === questions[currentQuestion].correctAnswer;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setAnswers((prev) => [...prev, selectedAnswer]);
    setShowResult(true);
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
  };

  const currentQ = questions[currentQuestion];
  const isCorrect = selectedAnswer === currentQ.correctAnswer;
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
              const isAnswerCorrect = ans === questions[index].correctAnswer;
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
          {questions.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index < currentQuestion
                  ? answers[index] === questions[index].correctAnswer
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
            const isCorrectAnswer = index === currentQ.correctAnswer;
            let optionClass = "border-border hover:border-primary/50 hover:bg-primary/5";

            if (showResult) {
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
                disabled={showResult}
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
      {showResult && (
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
          <Button variant="gradient" onClick={handleSubmitAnswer} className="px-8">
            Kiểm tra đáp án
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
