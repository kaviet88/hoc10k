import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Clock, FileText, Target, Star, ArrowLeft } from "lucide-react";

interface ExamStartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examTitle: string;
  timeLimit: number;
  totalQuestions: number;
  maxPoints: number;
  difficulty: "easy" | "medium" | "hard";
  onStart: () => void;
  onBack: () => void;
}

const getDifficultyStars = (difficulty: "easy" | "medium" | "hard") => {
  const count = difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3;
  return Array.from({ length: 3 }, (_, i) => (
    <Star
      key={i}
      className={`w-5 h-5 ${i < count ? "fill-amber-400 text-amber-400" : "text-muted"}`}
    />
  ));
};

export const ExamStartDialog = ({
  open,
  onOpenChange,
  examTitle,
  timeLimit,
  totalQuestions,
  maxPoints,
  difficulty,
  onStart,
  onBack,
}: ExamStartDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-card border-0 shadow-xl">
        <div className="p-8">
          <h2 className="text-xl font-bold text-center text-foreground mb-8 uppercase tracking-wide">
            {examTitle}
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-sm text-muted-foreground mb-1">Thời gian</p>
              <p className="text-xl font-bold text-foreground">{timeLimit} phút</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-sm text-muted-foreground mb-1">Số câu hỏi</p>
              <p className="text-xl font-bold text-foreground">{totalQuestions} câu</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-sm text-muted-foreground mb-1">Điểm tối đa</p>
              <p className="text-xl font-bold text-foreground">{maxPoints} điểm</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-sm text-muted-foreground mb-1">Độ khó</p>
              <div className="flex items-center gap-1 mt-1">
                {getDifficultyStars(difficulty)}
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              onClick={onStart}
              className="bg-[#1a365d] hover:bg-[#1a365d]/90 text-white px-8 py-6 text-base font-semibold rounded-xl"
            >
              Bắt đầu làm bài
            </Button>
            <Button
              variant="outline"
              onClick={onBack}
              className="px-8 py-6 text-base font-semibold rounded-xl border-2"
            >
              Thoát
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
