import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronDown, 
  ChevronRight, 
  Play, 
  Image, 
  Mic, 
  FileText, 
  Brain, 
  Clock, 
  Eye, 
  Calendar,
  ArrowLeft,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

const lessonDays = [
  { day: 51, duration: "30 phút", contents: 5 },
  { day: 52, duration: "30 phút", contents: 7 },
  { day: 53, duration: "30 phút", contents: 7, active: true },
  { day: 54, duration: "30 phút", contents: 7 },
];

const lessonContents = [
  { id: 1, title: "Farm animals", type: "video", icon: Play, completed: true },
  { id: 2, title: "Countable and Uncountable ...", type: "video", icon: Play, completed: true },
  { id: 3, title: "Grammar", type: "image", icon: Image, active: true },
  { id: 4, title: "Speaking", type: "exercise", icon: Mic },
  { id: 5, title: "Mind map", type: "audio", icon: Brain },
  { id: 6, title: "Mind map text", type: "audio", icon: FileText },
  { id: 7, title: "Quiz", type: "exercise", icon: FileText },
];

const LessonDetail = () => {
  const [currentPage, setCurrentPage] = useState(3);
  const totalPages = 7;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        {/* Course Header */}
        <div className="bg-card rounded-xl p-6 shadow-card mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Tiếng Anh Movers 360 ngày</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>0 phút</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>6276 lượt xem</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>62 ngày học</span>
                </div>
                <Badge variant="secondary" className="bg-accent/20 text-accent">
                  Tiếng Anh Cơ Bản
                </Badge>
              </div>
            </div>
            <div className="w-16 h-16 rounded-xl overflow-hidden shadow-card">
              <img 
                src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=100" 
                alt="Course"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Lesson List */}
          <aside className="w-full lg:w-80 shrink-0">
            <div className="bg-card rounded-xl shadow-card overflow-hidden">
              <div className="p-4 border-b border-border">
                <h2 className="font-bold text-foreground">Nội dung khóa học</h2>
              </div>
              
              <div className="divide-y divide-border">
                {lessonDays.map((lesson) => (
                  <div key={lesson.day} className={`${lesson.active ? 'bg-primary/5' : ''}`}>
                    <button className={`w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors ${lesson.active ? 'text-primary' : 'text-foreground'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${lesson.active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                          {lesson.day}
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">Ngày {lesson.day}</p>
                          <p className="text-xs text-muted-foreground">{lesson.duration}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{lesson.contents} nội dung</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${lesson.active ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    
                    {lesson.active && (
                      <div className="px-4 pb-4 space-y-1 animate-fade-in">
                        {lessonContents.map((content, index) => (
                          <button 
                            key={content.id}
                            className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                              content.active 
                                ? 'bg-primary/10 text-primary' 
                                : content.completed 
                                  ? 'text-success' 
                                  : 'text-foreground hover:bg-muted/50'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                              content.active 
                                ? 'bg-primary text-primary-foreground' 
                                : content.completed
                                  ? 'bg-success/20 text-success'
                                  : 'bg-muted text-muted-foreground'
                            }`}>
                              {content.completed ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate text-sm">{content.title}</p>
                              <p className="text-xs text-muted-foreground capitalize">{content.type}</p>
                            </div>
                            <content.icon className="w-4 h-4 shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-card rounded-xl shadow-card overflow-hidden">
              {/* Lesson Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">53</span>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Ngày 53</p>
                    <p className="text-xs text-muted-foreground">30 phút</p>
                  </div>
                </div>
              </div>

              {/* Lesson Content */}
              <div className="p-6">
                <h2 className="text-xl font-bold text-foreground mb-6">Grammar</h2>
                
                {/* Content Image */}
                <div className="rounded-xl overflow-hidden bg-gradient-to-br from-accent/10 to-success/10 p-4 mb-6">
                  <div className="bg-card rounded-lg p-6 shadow-card">
                    <h3 className="text-center text-lg font-bold text-primary mb-4">
                      DANH TỪ ĐẾM ĐƯỢC & KHÔNG ĐẾM ĐƯỢC
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-accent/10 rounded-lg p-4">
                        <h4 className="font-bold text-accent mb-3 text-center">Danh từ ĐẾM ĐƯỢC</h4>
                        <div className="flex justify-center gap-4 mb-3">
                          <div className="text-center">
                            <span className="text-2xl">🍎</span>
                            <p className="text-xs text-muted-foreground">1 apple</p>
                          </div>
                          <div className="text-center">
                            <span className="text-2xl">📚</span>
                            <p className="text-xs text-muted-foreground">2 books</p>
                          </div>
                          <div className="text-center">
                            <span className="text-2xl">🐱</span>
                            <p className="text-xs text-muted-foreground">3 cats</p>
                          </div>
                        </div>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Đếm được bằng số</li>
                          <li>• Có số ít - số nhiều</li>
                          <li>• Dùng a / an</li>
                        </ul>
                      </div>
                      <div className="bg-success/10 rounded-lg p-4">
                        <h4 className="font-bold text-success mb-3 text-center">Danh từ KHÔNG ĐẾM ĐƯỢC</h4>
                        <div className="flex justify-center gap-4 mb-3">
                          <div className="text-center">
                            <span className="text-2xl">💧</span>
                            <p className="text-xs text-muted-foreground">water</p>
                          </div>
                          <div className="text-center">
                            <span className="text-2xl">🥛</span>
                            <p className="text-xs text-muted-foreground">milk</p>
                          </div>
                          <div className="text-center">
                            <span className="text-2xl">🍚</span>
                            <p className="text-xs text-muted-foreground">rice</p>
                          </div>
                        </div>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Không đếm trực tiếp</li>
                          <li>• Không có số nhiều</li>
                          <li>• Không dùng a / an</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-sm text-muted-foreground">Đang học</span>
                  <Progress value={40} className="w-32 h-2" />
                </div>

                {/* Action Button */}
                <div className="flex justify-center mb-6">
                  <Button variant="gradient" size="lg">
                    Đánh dấu hoàn thành
                  </Button>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <Button variant="outline" size="sm" className="gap-1">
                    <ArrowLeft className="w-4 h-4" />
                    Phần trước
                  </Button>
                  
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span>{currentPage}</span>
                    <span>/</span>
                    <span>{totalPages}</span>
                  </div>
                  
                  <Button variant="default" size="sm" className="gap-1">
                    Phần tiếp theo
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LessonDetail;
