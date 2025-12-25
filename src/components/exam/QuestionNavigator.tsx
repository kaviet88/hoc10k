import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface QuestionNavigatorProps {
  totalQuestions: number;
  currentQuestion: number;
  answeredQuestions: Record<number, boolean>;
  onQuestionSelect: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;
}

export const QuestionNavigator = ({
  totalQuestions,
  currentQuestion,
  answeredQuestions,
  onQuestionSelect,
  onPrevious,
  onNext,
}: QuestionNavigatorProps) => {
  const getQuestionStatus = (index: number) => {
    if (index === currentQuestion) return "current";
    if (answeredQuestions[index + 1]) return "answered";
    return "unanswered";
  };

  const getButtonStyles = (status: string) => {
    switch (status) {
      case "current":
        return "bg-primary text-primary-foreground hover:bg-primary/90";
      case "answered":
        return "bg-success text-white hover:bg-success/90";
      default:
        return "bg-muted text-muted-foreground hover:bg-muted/80";
    }
  };

  return (
    <div className="bg-card rounded-xl p-4 shadow-card">
      {/* Question grid */}
      <div className="grid grid-cols-6 gap-2 mb-4">
        {Array.from({ length: totalQuestions }, (_, i) => {
          const status = getQuestionStatus(i);
          return (
            <button
              key={i}
              onClick={() => onQuestionSelect(i)}
              className={`w-10 h-10 rounded-lg font-medium text-sm transition-all ${getButtonStyles(status)}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Info */}
      <div className="text-center text-sm text-muted-foreground mb-4">
        {totalQuestions} câu hỏi • Câu {currentQuestion + 1}/{totalQuestions}
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={currentQuestion === 0}
          className="flex-1 gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Câu trước
        </Button>
        <Button
          onClick={onNext}
          disabled={currentQuestion === totalQuestions - 1}
          className="flex-1 gap-2 bg-primary hover:bg-primary/90"
        >
          Câu tiếp
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
