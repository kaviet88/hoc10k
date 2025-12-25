import { Filter, Share2, X, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface FilterSectionProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  programType: string;
  onProgramTypeChange: (value: string) => void;
  subject: string;
  onSubjectChange: (value: string) => void;
  totalPrograms: number;
  displayedPrograms: number;
}

export const FilterSection = ({
  searchQuery,
  onSearchChange,
  programType,
  onProgramTypeChange,
  subject,
  onSubjectChange,
  totalPrograms,
  displayedPrograms,
}: FilterSectionProps) => {
  const shareUrl = window.location.href;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Đã sao chép!",
      description: "Link đã được sao chép vào clipboard",
    });
  };

  const clearFilters = () => {
    onSearchChange("");
    onProgramTypeChange("all");
    onSubjectChange("all");
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 text-foreground">
          <Filter className="w-5 h-5" />
          <span className="font-semibold">Bộ lọc</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyLink}>
            <Share2 className="w-4 h-4 mr-2" />
            Chia sẻ
          </Button>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="w-4 h-4 mr-2" />
            Xóa bộ lọc
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            Tìm kiếm theo tiêu đề
          </label>
          <Input
            placeholder="Nhập từ khóa..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            Loại chương trình
          </label>
          <Select value={programType} onValueChange={onProgramTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Tất cả loại" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại</SelectItem>
              <SelectItem value="Bài học">Bài học</SelectItem>
              <SelectItem value="Combo">Combo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            Môn học
          </label>
          <Select value={subject} onValueChange={onSubjectChange}>
            <SelectTrigger>
              <SelectValue placeholder="Tất cả môn học" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả môn học</SelectItem>
              <SelectItem value="english">Tiếng Anh</SelectItem>
              <SelectItem value="math">Toán</SelectItem>
              <SelectItem value="vietnamese">Tiếng Việt</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Hiển thị{" "}
          <span className="text-accent font-semibold">{displayedPrograms}</span>{" "}
          trong tổng số{" "}
          <span className="font-semibold">{totalPrograms}</span> chương trình
        </p>
        <p className="text-sm text-muted-foreground">Bộ lọc đang áp dụng:</p>
      </div>

      <div className="mt-4 p-4 bg-muted rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              Link chia sẻ:
            </p>
            <p className="text-sm text-muted-foreground truncate max-w-md">
              {shareUrl}
            </p>
          </div>
          <Button variant="outline" onClick={copyLink}>
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
        </div>
      </div>
    </div>
  );
};
