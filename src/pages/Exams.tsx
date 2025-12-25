import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, BookOpen, FileText, Trophy, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import examThumb1 from "@/assets/exam-thumb-1.jpg";
import examThumb2 from "@/assets/exam-thumb-2.jpg";
import examThumb3 from "@/assets/exam-thumb-3.jpg";
import examThumb4 from "@/assets/exam-thumb-4.jpg";

// Grade data with colors
const grades = [
  { id: 1, name: "Lớp 1", englishName: "Grade 1", color: "bg-emerald-500" },
  { id: 2, name: "Lớp 2", englishName: "Grade 2", color: "bg-sky-500" },
  { id: 3, name: "Lớp 3", englishName: "Grade 3", color: "bg-amber-500" },
  { id: 4, name: "Lớp 4", englishName: "Grade 4", color: "bg-purple-500" },
  { id: 5, name: "Lớp 5", englishName: "Grade 5", color: "bg-rose-500" },
];

// Subjects for each grade
const subjects = [
  { id: "math", name: "Toán học", englishName: "Mathematics" },
  { id: "vietnamese", name: "Tiếng Việt", englishName: "Vietnamese" },
  { id: "english", name: "Tiếng Anh", englishName: "English" },
];

// Exam types/categories
const examTypes = [
  {
    id: "timo",
    name: "Timo - Toán Quốc tế",
    description: "Đề thi Toán quốc tế Timo cho học sinh tiểu học",
    thumbnail: examThumb1,
    examCount: 45,
  },
  {
    id: "trang-nguyen",
    name: "Trạng Nguyên Tiếng Việt",
    description: "Cuộc thi Trạng Nguyên Tiếng Việt các cấp",
    thumbnail: examThumb2,
    examCount: 38,
  },
  {
    id: "vioedu",
    name: "VioEdu",
    description: "Bộ đề thi VioEdu cho các môn học",
    thumbnail: examThumb3,
    examCount: 120,
  },
  {
    id: "hkimo",
    name: "HKIMO",
    description: "Kỳ thi Toán học quốc tế Hồng Kông",
    thumbnail: examThumb4,
    examCount: 32,
  },
];

const Exams = () => {
  const navigate = useNavigate();
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const handleSubjectClick = (gradeId: number, subjectId: string) => {
    setSelectedGrade(gradeId);
    setSelectedSubject(subjectId);
    // Navigate to practice or exam list
    navigate("/practice");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-background">
      <Header />

      {/* Hero Section */}
      <section className="relative py-12 md:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-4">
              LUYỆN THI TRỰC TUYẾN TRÊN WEB HỌC 10K
            </h1>
            <p className="text-lg md:text-xl text-primary/80 mb-8">
              (LỚP 1 ĐẾN LỚP 5)
            </p>

            {/* Feature cards */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <div className="bg-card rounded-2xl shadow-lg p-6 flex items-center gap-4 hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">Đề thi đa dạng</p>
                  <p className="text-sm text-muted-foreground">Nhiều dạng bài phong phú</p>
                </div>
              </div>
              <div className="bg-card rounded-2xl shadow-lg p-6 flex items-center gap-4 hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-secondary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">Thi thử miễn phí</p>
                  <p className="text-sm text-muted-foreground">Luyện tập không giới hạn</p>
                </div>
              </div>
            </div>

            <Button size="lg" variant="gradient" className="gap-2">
              Xem tất cả bộ đề thi
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Highlighted Features */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-2">
            Tính năng nổi bật
          </h2>
          <div className="w-16 h-1 bg-primary mx-auto rounded-full mb-8" />
        </div>
      </section>

      {/* Grade and Subject Selection */}
      <section className="py-8 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">
              Chọn Lớp và Môn Học
            </h2>
            <p className="text-muted-foreground">
              Chọn lớp và môn học bạn luyện thi
            </p>
          </div>

          {/* Grade Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {grades.map((grade) => (
              <div
                key={grade.id}
                className="bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {/* Grade Header */}
                <div className={`${grade.color} text-white p-4 text-center`}>
                  <h3 className="text-xl font-bold">{grade.name}</h3>
                  <p className="text-sm opacity-90">{grade.englishName}</p>
                </div>

                {/* Subject List */}
                <div className="divide-y divide-border">
                  {subjects.map((subject) => (
                    <button
                      key={subject.id}
                      onClick={() => handleSubjectClick(grade.id, subject.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors group"
                    >
                      <div className="text-left">
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {subject.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {subject.englishName}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exam Types Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Các dạng đề thi ôn luyện
            </h2>
            <p className="text-muted-foreground">
              Lựa chọn bộ đề thi phù hợp với mục tiêu của bạn
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {examTypes.map((exam) => (
              <div
                key={exam.id}
                onClick={() => navigate("/practice")}
                className="bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-1"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={exam.thumbnail}
                    alt={exam.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {exam.name}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <FileText className="w-4 h-4" />
                    {exam.examCount} đề thi
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer spacing */}
      <div className="h-16" />
    </div>
  );
};

export default Exams;
