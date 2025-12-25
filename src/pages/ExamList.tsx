import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  Search,
  Clock,
  FileText,
  Users,
  Star,
  Filter,
  Play,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

// Grade and subject data
const gradeData: Record<string, { name: string; color: string }> = {
  "1": { name: "Lớp 1", color: "bg-emerald-500" },
  "2": { name: "Lớp 2", color: "bg-sky-500" },
  "3": { name: "Lớp 3", color: "bg-amber-500" },
  "4": { name: "Lớp 4", color: "bg-purple-500" },
  "5": { name: "Lớp 5", color: "bg-rose-500" },
};

const subjectData: Record<string, { name: string; icon: string }> = {
  math: { name: "Toán học", icon: "📐" },
  vietnamese: { name: "Tiếng Việt", icon: "📖" },
  english: { name: "Tiếng Anh", icon: "🌍" },
};

// Sample exam data
const generateExams = (gradeId: string, subjectId: string) => {
  const examTypes = [
    { type: "timo", name: "TIMO", badge: "Quốc tế" },
    { type: "vioedu", name: "VioEdu", badge: "Phổ biến" },
    { type: "hkimo", name: "HKIMO", badge: "Nâng cao" },
    { type: "school", name: "Đề trường", badge: null },
  ];

  const difficulties = ["Dễ", "Trung bình", "Khó"];
  
  return Array.from({ length: 15 }, (_, i) => {
    const examType = examTypes[i % examTypes.length];
    const difficulty = difficulties[i % difficulties.length];
    const isCompleted = Math.random() > 0.7;
    const isPremium = i > 10;
    
    return {
      id: `exam-${gradeId}-${subjectId}-${i + 1}`,
      title: `${examType.name} ${subjectData[subjectId]?.name || "Toán"} ${gradeData[gradeId]?.name || "Lớp 1"} - Đề ${i + 1}`,
      type: examType.type,
      typeName: examType.name,
      badge: examType.badge,
      difficulty,
      questionCount: 20 + Math.floor(Math.random() * 20),
      duration: 30 + Math.floor(Math.random() * 30),
      participants: Math.floor(Math.random() * 5000) + 500,
      rating: (4 + Math.random()).toFixed(1),
      isCompleted,
      completedScore: isCompleted ? Math.floor(Math.random() * 40) + 60 : null,
      isPremium,
    };
  });
};

const ExamList = () => {
  const navigate = useNavigate();
  const { gradeId = "1", subjectId = "math" } = useParams();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const grade = gradeData[gradeId] || gradeData["1"];
  const subject = subjectData[subjectId] || subjectData["math"];
  
  const allExams = useMemo(() => generateExams(gradeId, subjectId), [gradeId, subjectId]);

  const filteredExams = useMemo(() => {
    return allExams.filter((exam) => {
      const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDifficulty = difficultyFilter === "all" || exam.difficulty === difficultyFilter;
      const matchesType = typeFilter === "all" || exam.type === typeFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "completed" && exam.isCompleted) ||
        (statusFilter === "incomplete" && !exam.isCompleted);
      
      return matchesSearch && matchesDifficulty && matchesType && matchesStatus;
    });
  }, [allExams, searchQuery, difficultyFilter, typeFilter, statusFilter]);

  const completedCount = allExams.filter((e) => e.isCompleted).length;
  const progressPercent = Math.round((completedCount / allExams.length) * 100);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Dễ":
        return "bg-success/10 text-success border-success/30";
      case "Trung bình":
        return "bg-amber-500/10 text-amber-600 border-amber-500/30";
      case "Khó":
        return "bg-destructive/10 text-destructive border-destructive/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Breadcrumb & Back */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/exams")}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="hover:text-primary cursor-pointer" onClick={() => navigate("/exams")}>
              Luyện thi
            </span>
            <span>/</span>
            <span className="hover:text-primary cursor-pointer">{grade.name}</span>
            <span>/</span>
            <span className="text-foreground font-medium">{subject.name}</span>
          </div>
        </div>

        {/* Page Header */}
        <div className="bg-card rounded-xl shadow-card p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-xl ${grade.color} flex items-center justify-center text-3xl text-white shadow-lg`}>
                {subject.icon}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {subject.name} - {grade.name}
                </h1>
                <p className="text-muted-foreground">
                  {allExams.length} bộ đề thi • {completedCount} đã hoàn thành
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Tiến độ</p>
                <p className="text-lg font-bold text-primary">{progressPercent}%</p>
              </div>
              <div className="w-32">
                <Progress value={progressPercent} className="h-3" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl shadow-card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm đề thi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter by difficulty */}
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Độ khó" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả độ khó</SelectItem>
                <SelectItem value="Dễ">Dễ</SelectItem>
                <SelectItem value="Trung bình">Trung bình</SelectItem>
                <SelectItem value="Khó">Khó</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter by type */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Loại đề" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="timo">TIMO</SelectItem>
                <SelectItem value="vioedu">VioEdu</SelectItem>
                <SelectItem value="hkimo">HKIMO</SelectItem>
                <SelectItem value="school">Đề trường</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter by status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="completed">Đã làm</SelectItem>
                <SelectItem value="incomplete">Chưa làm</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active filters */}
          {(difficultyFilter !== "all" || typeFilter !== "all" || statusFilter !== "all" || searchQuery) && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Đang lọc:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  "{searchQuery}"
                </Badge>
              )}
              {difficultyFilter !== "all" && (
                <Badge variant="secondary">{difficultyFilter}</Badge>
              )}
              {typeFilter !== "all" && (
                <Badge variant="secondary">{typeFilter.toUpperCase()}</Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="secondary">
                  {statusFilter === "completed" ? "Đã làm" : "Chưa làm"}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setDifficultyFilter("all");
                  setTypeFilter("all");
                  setStatusFilter("all");
                }}
              >
                Xóa bộ lọc
              </Button>
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-muted-foreground">
            Hiển thị <span className="font-medium text-foreground">{filteredExams.length}</span> đề thi
          </p>
        </div>

        {/* Exam List */}
        <div className="space-y-4">
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              className={`bg-card rounded-xl shadow-card p-4 hover:shadow-card-hover transition-all duration-300 ${
                exam.isPremium ? "border-2 border-secondary/30" : ""
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Exam info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {exam.isCompleted && (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    )}
                    <h3 className="font-semibold text-foreground">{exam.title}</h3>
                    {exam.isPremium && (
                      <Badge className="bg-secondary text-secondary-foreground">
                        <Lock className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <Badge variant="outline" className={getDifficultyColor(exam.difficulty)}>
                      {exam.difficulty}
                    </Badge>
                    {exam.badge && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                        {exam.badge}
                      </Badge>
                    )}
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {exam.questionCount} câu
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {exam.duration} phút
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {exam.participants.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      {exam.rating}
                    </span>
                  </div>

                  {exam.isCompleted && exam.completedScore !== null && (
                    <div className="mt-2">
                      <span className="text-sm text-success font-medium">
                        Điểm cao nhất: {exam.completedScore}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Action button */}
                <div className="flex items-center gap-3">
                  {exam.isCompleted && (
                    <Button variant="outline" onClick={() => navigate("/practice")}>
                      Xem lại
                    </Button>
                  )}
                  <Button
                    variant={exam.isPremium ? "secondary" : "gradient"}
                    className="gap-2"
                    onClick={() => navigate("/practice")}
                  >
                    {exam.isPremium ? (
                      <>
                        <Lock className="w-4 h-4" />
                        Mở khóa
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        {exam.isCompleted ? "Làm lại" : "Bắt đầu"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filteredExams.length === 0 && (
          <div className="bg-card rounded-xl shadow-card p-12 text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Không tìm thấy đề thi
            </h3>
            <p className="text-muted-foreground mb-4">
              Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setDifficultyFilter("all");
                setTypeFilter("all");
                setStatusFilter("all");
              }}
            >
              Xóa bộ lọc
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ExamList;
