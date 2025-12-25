import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Info, FileText, Pencil, List, Play, Pause, Volume2, Headphones } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export interface Question {
  id: number;
  type: "multiple_choice" | "fill_blank" | "dropdown_select" | "listening";
  question: string;
  image?: string;
  audioUrl?: string;
  options?: string[];
  correctAnswer: string | number;
  points: number;
  blanks?: { id: string; options: string[] }[];
}

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer: string | number | undefined;
  dropdownAnswers?: Record<string, string>;
  onAnswerChange: (value: string | number) => void;
  onDropdownChange?: (blankId: string, value: string) => void;
}

// Audio Player Component
const AudioPlayer = ({ audioUrl }: { audioUrl: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-muted/50 rounded-xl p-4 mb-6">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-card border-2 border-border flex items-center justify-center hover:bg-muted transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-foreground" />
          ) : (
            <Play className="w-5 h-5 text-foreground ml-0.5" />
          )}
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground min-w-[45px]">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground min-w-[45px]">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        <Volume2 className="w-5 h-5 text-muted-foreground" />
        
        <div className="w-10 h-10 rounded-full bg-destructive flex items-center justify-center">
          <Play className="w-4 h-4 text-white" />
        </div>
      </div>
    </div>
  );
};

const getQuestionTypeLabel = (type: string) => {
  switch (type) {
    case "multiple_choice":
      return { label: "Trắc nghiệm", icon: List, color: "bg-primary/10 text-primary" };
    case "fill_blank":
      return { label: "Điền vào chỗ trống", icon: Pencil, color: "bg-amber-500/10 text-amber-600" };
    case "dropdown_select":
      return { label: "Chọn từ danh sách", icon: FileText, color: "bg-emerald-500/10 text-emerald-600" };
    case "listening":
      return { label: "Âm thanh", icon: Headphones, color: "bg-rose-500/10 text-rose-600" };
    default:
      return { label: "Câu hỏi", icon: FileText, color: "bg-muted text-muted-foreground" };
  }
};

export const QuestionCard = ({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  dropdownAnswers = {},
  onAnswerChange,
  onDropdownChange,
}: QuestionCardProps) => {
  const typeInfo = getQuestionTypeLabel(question.type);
  const TypeIcon = typeInfo.icon;

  const renderQuestionContent = () => {
    switch (question.type) {
      case "multiple_choice":
        return (
          <RadioGroup
            value={selectedAnswer?.toString()}
            onValueChange={(value) => onAnswerChange(parseInt(value))}
            className="space-y-3 mt-6"
          >
            {question.options?.map((option, index) => {
              const isSelected = selectedAnswer === index;
              return (
                <label
                  key={index}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? "border-success bg-success/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/30"
                  }`}
                >
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <span className="font-medium text-muted-foreground w-8">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <span className="text-foreground">{option}</span>
                </label>
              );
            })}
          </RadioGroup>
        );

      case "fill_blank":
        return (
          <div className="mt-6">
            <Input
              type="text"
              placeholder="Nhập câu trả lời..."
              value={selectedAnswer?.toString() || ""}
              onChange={(e) => onAnswerChange(e.target.value)}
              className="text-lg py-6 text-center"
            />
          </div>
        );

      case "dropdown_select":
        if (!question.blanks) return null;
        
        // Parse the question text to find blanks
        const parts = question.question.split(/(\[BLANK:\d+\])/g);
        
        return (
          <div className="mt-6 space-y-4">
            {parts.map((part, index) => {
              const blankMatch = part.match(/\[BLANK:(\d+)\]/);
              if (blankMatch) {
                const blankIndex = parseInt(blankMatch[1]);
                const blank = question.blanks?.[blankIndex];
                if (!blank) return null;
                
                return (
                  <span key={index} className="inline-block mx-2">
                    <Select
                      value={dropdownAnswers[blank.id] || ""}
                      onValueChange={(value) => onDropdownChange?.(blank.id, value)}
                    >
                      <SelectTrigger className="w-[140px] border-success bg-success/5">
                        <SelectValue placeholder="Chọn..." />
                      </SelectTrigger>
                      <SelectContent className="bg-card border shadow-lg z-50">
                        {blank.options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </span>
                );
              }
              return <span key={index} className="text-foreground">{part}</span>;
            })}
          </div>
        );

      case "listening":
        return (
          <div className="mt-6">
            <Input
              type="text"
              placeholder="Nhập câu trả lời..."
              value={selectedAnswer?.toString() || ""}
              onChange={(e) => onAnswerChange(e.target.value)}
              className="text-lg py-6 text-center"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-card rounded-xl p-6 shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-primary/10 text-primary font-semibold px-3 py-1">
            Câu {questionNumber} / {totalQuestions}
          </Badge>
          <Badge variant="secondary" className={`${typeInfo.color} gap-1 px-3 py-1`}>
            <TypeIcon className="w-3 h-3" />
            {typeInfo.label}
          </Badge>
        </div>
        <Badge variant="outline" className="font-medium">
          {question.points} điểm
        </Badge>
      </div>

      {/* Audio player for listening questions */}
      {question.audioUrl && <AudioPlayer audioUrl={question.audioUrl} />}

      {/* Question text */}
      <div className="text-lg text-foreground leading-relaxed whitespace-pre-wrap">
        {question.type === "dropdown_select" ? null : question.question}
      </div>

      {/* Question image if any */}
      {question.image && question.image !== "polygon" && question.image !== "diagram" && (
        <div className="mt-4 flex justify-center">
          <img src={question.image} alt="Question" className="max-h-64 rounded-lg" />
        </div>
      )}

      {/* Answer options */}
      {renderQuestionContent()}

      {/* Hint section */}
      <div className="mt-6 pt-4 border-t">
        <button className="flex items-center gap-2 text-sm text-primary hover:underline">
          <Info className="w-4 h-4" />
          Hướng dẫn
        </button>
      </div>
    </div>
  );
};
