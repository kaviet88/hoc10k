import { Progress } from "@/components/ui/progress";

interface ExamProgressHeaderProps {
  currentQuestion: number;
  totalQuestions: number;
  answeredCount: number;
  timeRemaining: number;
  totalTime: number;
}

const getMotivationalMessage = (percent: number) => {
  if (percent < 30) return { emoji: "💪", message: "Bắt đầu tốt lắm! Cố gắng lên!" };
  if (percent < 50) return { emoji: "🎯", message: "Đang tiến bộ! Bạn làm rất tốt!" };
  if (percent < 80) return { emoji: "🔥", message: "Gần hoàn thành rồi! Cố gắng lên!" };
  return { emoji: "🎉", message: "Xuất sắc! Sắp hoàn thành!" };
};

export const ExamProgressHeader = ({
  currentQuestion,
  totalQuestions,
  answeredCount,
  timeRemaining,
  totalTime,
}: ExamProgressHeaderProps) => {
  const completionPercent = Math.round((answeredCount / totalQuestions) * 100);
  const timePercent = Math.round((timeRemaining / totalTime) * 100);
  const remaining = totalQuestions - answeredCount;
  const motivational = getMotivationalMessage(completionPercent);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-card rounded-xl p-4 shadow-card mb-6">
      {/* Top row with progress bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Câu hỏi: {currentQuestion + 1} / {totalQuestions}</span>
          <span>({answeredCount} đã trả lời)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Hoàn thành: {completionPercent}%</span>
          <Progress value={completionPercent} className="w-24 h-2" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Thời gian: {formatTime(timeRemaining)}</span>
          <Progress value={timePercent} className="w-24 h-2" />
        </div>
      </div>

      {/* Multi-color progress bar */}
      <div className="h-2 rounded-full overflow-hidden flex mb-4">
        <div 
          className="bg-success transition-all duration-300" 
          style={{ width: `${completionPercent}%` }} 
        />
        <div 
          className="bg-muted transition-all duration-300" 
          style={{ width: `${100 - completionPercent}%` }} 
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-sm text-muted-foreground">Đã trả lời</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
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
        
        <div className="flex items-center gap-6 text-center">
          <div>
            <p className="text-xl font-bold text-success">{currentQuestion + 1}</p>
            <p className="text-xs text-muted-foreground">Câu hiện tại</p>
          </div>
          <div>
            <p className="text-xl font-bold text-success">{answeredCount}</p>
            <p className="text-xs text-muted-foreground">Đã trả lời</p>
          </div>
          <div>
            <p className="text-xl font-bold text-muted-foreground">{remaining}</p>
            <p className="text-xs text-muted-foreground">Còn lại</p>
          </div>
          <div>
            <p className="text-xl font-bold text-success">{completionPercent}%</p>
            <p className="text-xs text-muted-foreground">Hoàn thành</p>
          </div>
        </div>
      </div>

      {/* Motivational message */}
      <div className="text-center mt-4 pt-4 border-t">
        <span className="text-sm">
          <span className="mr-2">{motivational.emoji}</span>
          <span className="text-success font-medium">{motivational.message}</span>
        </span>
      </div>
    </div>
  );
};
