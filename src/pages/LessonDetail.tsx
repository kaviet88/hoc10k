import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { LessonMindMap } from "@/components/lessons/LessonMindMap";
import { LessonQuiz } from "@/components/lessons/LessonQuiz";
import { 
  ChevronDown, 
  Play, 
  Pause,
  Image, 
  Mic, 
  FileText, 
  Brain, 
  Clock, 
  Eye, 
  Calendar,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  Video,
  HelpCircle
} from "lucide-react";

interface Lesson {
  id: string;
  lesson_id: string;
  lesson_title: string;
  lesson_order: number;
  day_number: number | null;
  duration_minutes: number;
  completed: boolean;
  video_url: string | null;
  thumbnail_url: string | null;
}

interface GroupedLessons {
  day: number;
  lessons: Lesson[];
}

const iconMap: Record<number, React.ComponentType<{ className?: string }>> = {
  1: Play,
  2: Play,
  3: Image,
  4: Mic,
  5: Brain,
  6: FileText,
  7: FileText,
};

const LessonDetail = () => {
  const { id: programId } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [marking, setMarking] = useState(false);
  
  // Video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useState<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (programId) {
      fetchLessons();
    }
  }, [programId, user]);

  const fetchLessons = async () => {
    const currentProgramId = programId || "1";

    // Fetch all lessons for this program
    const { data: lessonData, error: lessonError } = await supabase
      .from("program_lessons")
      .select("*")
      .eq("program_id", currentProgramId)
      .order("lesson_order");

    if (lessonError || !lessonData) {
      setLoading(false);
      return;
    }

    // Fetch user's progress if logged in
    let completedIds = new Set<string>();
    if (user) {
      const { data: progressData } = await supabase
        .from("user_lesson_progress")
        .select("lesson_id")
        .eq("user_id", user.id)
        .eq("program_id", currentProgramId)
        .eq("completed", true);

      if (progressData) {
        completedIds = new Set(progressData.map((p) => p.lesson_id));
      }
    }

    setCompletedLessonIds(completedIds);

    const enrichedLessons = lessonData.map((lesson) => ({
      id: lesson.id,
      lesson_id: lesson.lesson_id,
      lesson_title: lesson.lesson_title,
      lesson_order: lesson.lesson_order,
      day_number: lesson.day_number,
      duration_minutes: lesson.duration_minutes,
      completed: completedIds.has(lesson.lesson_id),
      video_url: lesson.video_url,
      thumbnail_url: lesson.thumbnail_url,
    }));

    setLessons(enrichedLessons);

    // Set active day and lesson
    if (enrichedLessons.length > 0) {
      const firstIncomplete = enrichedLessons.find((l) => !l.completed);
      const targetLesson = firstIncomplete || enrichedLessons[0];
      setActiveDay(targetLesson.day_number);
      setActiveLesson(targetLesson);
    }

    setLoading(false);
  };

  const handleMarkComplete = async () => {
    if (!user || !activeLesson || !programId) {
      toast({
        title: "Vui lòng đăng nhập",
        description: "Bạn cần đăng nhập để lưu tiến độ học tập",
        variant: "destructive",
      });
      return;
    }

    setMarking(true);

    const { error } = await supabase
      .from("user_lesson_progress")
      .upsert({
        user_id: user.id,
        program_id: programId,
        lesson_id: activeLesson.lesson_id,
        completed: true,
        completed_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,program_id,lesson_id",
      });

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể lưu tiến độ. Vui lòng thử lại.",
        variant: "destructive",
      });
      setMarking(false);
      return;
    }

    // Update local state
    setCompletedLessonIds((prev) => new Set([...prev, activeLesson.lesson_id]));
    setLessons((prev) =>
      prev.map((l) =>
        l.lesson_id === activeLesson.lesson_id ? { ...l, completed: true } : l
      )
    );
    setActiveLesson((prev) => (prev ? { ...prev, completed: true } : prev));

    toast({
      title: "Hoàn thành! 🎉",
      description: "Bạn đã hoàn thành bài học này",
    });

    setMarking(false);
  };

  const handleSelectLesson = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setActiveDay(lesson.day_number);
  };

  const handlePrevious = () => {
    if (!activeLesson) return;
    const currentIndex = lessons.findIndex((l) => l.lesson_id === activeLesson.lesson_id);
    if (currentIndex > 0) {
      const prevLesson = lessons[currentIndex - 1];
      setActiveLesson(prevLesson);
      setActiveDay(prevLesson.day_number);
    }
  };

  const handleNext = () => {
    if (!activeLesson) return;
    const currentIndex = lessons.findIndex((l) => l.lesson_id === activeLesson.lesson_id);
    if (currentIndex < lessons.length - 1) {
      const nextLesson = lessons[currentIndex + 1];
      setActiveLesson(nextLesson);
      setActiveDay(nextLesson.day_number);
    }
  };

  // Group lessons by day
  const groupedLessons = lessons.reduce((acc, lesson) => {
    const day = lesson.day_number || 1;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(lesson);
    return acc;
  }, {} as Record<number, Lesson[]>);

  const completedCount = lessons.filter((l) => l.completed).length;
  const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
  const currentIndex = activeLesson ? lessons.findIndex((l) => l.lesson_id === activeLesson.lesson_id) + 1 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

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
                  <span>{lessons.reduce((acc, l) => acc + l.duration_minutes, 0)} phút</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>6276 lượt xem</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{Object.keys(groupedLessons).length} ngày học</span>
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
                <p className="text-sm text-muted-foreground mt-1">
                  {completedCount}/{lessons.length} bài học hoàn thành
                </p>
              </div>
              
              <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
                {Object.entries(groupedLessons).map(([day, dayLessons]) => {
                  const dayNum = parseInt(day);
                  const isActive = activeDay === dayNum;
                  const dayCompleted = dayLessons.every((l) => l.completed);
                  const dayDuration = dayLessons.reduce((acc, l) => acc + l.duration_minutes, 0);

                  return (
                    <div key={day} className={`${isActive ? 'bg-primary/5' : ''}`}>
                      <button 
                        className={`w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors ${isActive ? 'text-primary' : 'text-foreground'}`}
                        onClick={() => setActiveDay(isActive ? null : dayNum)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            dayCompleted 
                              ? 'bg-success text-success-foreground' 
                              : isActive 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted text-muted-foreground'
                          }`}>
                            {dayCompleted ? <CheckCircle2 className="w-4 h-4" /> : dayNum}
                          </div>
                          <div className="text-left">
                            <p className="font-semibold">Ngày {dayNum}</p>
                            <p className="text-xs text-muted-foreground">{dayDuration} phút</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{dayLessons.length} nội dung</span>
                          <ChevronDown className={`w-4 h-4 transition-transform ${isActive ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                      
                      {isActive && (
                        <div className="px-4 pb-4 space-y-1 animate-fade-in">
                          {dayLessons.map((lesson, index) => {
                            const isLessonActive = activeLesson?.lesson_id === lesson.lesson_id;
                            const IconComponent = iconMap[(index % 7) + 1] || FileText;

                            return (
                              <button 
                                key={lesson.lesson_id}
                                onClick={() => handleSelectLesson(lesson)}
                                className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                                  isLessonActive 
                                    ? 'bg-primary/10 text-primary' 
                                    : lesson.completed 
                                      ? 'text-success' 
                                      : 'text-foreground hover:bg-muted/50'
                                }`}
                              >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                  isLessonActive 
                                    ? 'bg-primary text-primary-foreground' 
                                    : lesson.completed
                                      ? 'bg-success/20 text-success'
                                      : 'bg-muted text-muted-foreground'
                                }`}>
                                  {lesson.completed ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate text-sm">{lesson.lesson_title}</p>
                                  <p className="text-xs text-muted-foreground">{lesson.duration_minutes} phút</p>
                                </div>
                                <IconComponent className="w-4 h-4 shrink-0" />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
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
                    <span className="text-primary-foreground font-bold text-sm">{activeLesson?.day_number || 1}</span>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Ngày {activeLesson?.day_number || 1}</p>
                    <p className="text-xs text-muted-foreground">{activeLesson?.duration_minutes || 0} phút</p>
                  </div>
                </div>
                {activeLesson?.completed && (
                  <Badge className="bg-success text-success-foreground gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Hoàn thành
                  </Badge>
                )}
              </div>

              {/* Lesson Content */}
              <div className="p-6">
                <h2 className="text-xl font-bold text-foreground mb-6">{activeLesson?.lesson_title || "Bài học"}</h2>
                
                {/* Lesson Tabs */}
                <Tabs defaultValue="video" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="video" className="gap-2">
                      <Video className="w-4 h-4" />
                      Video
                    </TabsTrigger>
                    <TabsTrigger value="mindmap" className="gap-2">
                      <Brain className="w-4 h-4" />
                      Sơ đồ tư duy
                    </TabsTrigger>
                    <TabsTrigger value="quiz" className="gap-2">
                      <HelpCircle className="w-4 h-4" />
                      Quiz
                    </TabsTrigger>
                  </TabsList>

                  {/* Video Tab */}
                  <TabsContent value="video" className="mt-0">
                    {/* Video Player */}
                    <div className="rounded-xl overflow-hidden bg-foreground mb-6 relative group">
                      <div className="aspect-video relative">
                        <video
                          className="w-full h-full object-cover"
                          poster={activeLesson?.thumbnail_url || "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800&auto=format&fit=crop"}
                        >
                          <source src={activeLesson?.video_url || "https://www.w3schools.com/html/mov_bbb.mp4"} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                        
                        {/* Play button overlay */}
                        {!isPlaying && (
                          <button 
                            onClick={() => setIsPlaying(true)}
                            className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity group-hover:bg-black/40"
                          >
                            <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                              <Play className="w-8 h-8 text-foreground ml-1" fill="currentColor" />
                            </div>
                          </button>
                        )}
                      </div>
                      
                      {/* Video Controls */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Progress bar */}
                        <div className="w-full h-1 bg-white/30 rounded-full mb-3 cursor-pointer">
                          <div className="h-full bg-primary rounded-full w-1/3 relative">
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow" />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => setIsPlaying(!isPlaying)}
                              className="text-white hover:text-primary transition-colors"
                            >
                              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            </button>
                            <button 
                              onClick={() => setIsMuted(!isMuted)}
                              className="text-white hover:text-primary transition-colors"
                            >
                              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                            </button>
                            <span className="text-white text-sm">2:15 / 6:49</span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <button className="text-white hover:text-primary transition-colors">
                              <Settings className="w-5 h-5" />
                            </button>
                            <button className="text-white hover:text-primary transition-colors">
                              <Maximize className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Lesson Content Card */}
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
                  </TabsContent>

                  {/* Mind Map Tab */}
                  <TabsContent value="mindmap" className="mt-0">
                    <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border border-border">
                      <LessonMindMap 
                        lessonId={activeLesson?.lesson_id || "lesson-1"} 
                        programId={programId || "1"}
                        lessonTitle={activeLesson?.lesson_title || "Bài học"} 
                      />
                    </div>
                  </TabsContent>

                  {/* Quiz Tab */}
                  <TabsContent value="quiz" className="mt-0">
                    <div className="bg-gradient-to-br from-success/5 to-primary/5 rounded-xl border border-border">
                      <LessonQuiz 
                        lessonId={activeLesson?.lesson_id || "lesson-1"} 
                        programId={programId || "1"}
                        lessonTitle={activeLesson?.lesson_title || "Bài học"} 
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Progress Indicator */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-sm text-muted-foreground">Tiến độ khóa học</span>
                  <Progress value={progressPercent} className="w-32 h-2" />
                  <span className="text-sm font-medium text-primary">{progressPercent}%</span>
                </div>

                {/* Action Button */}
                <div className="flex justify-center mb-6">
                  <Button 
                    variant="gradient" 
                    size="lg"
                    onClick={handleMarkComplete}
                    disabled={marking || activeLesson?.completed}
                  >
                    {marking && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {activeLesson?.completed ? "Đã hoàn thành ✓" : "Đánh dấu hoàn thành"}
                  </Button>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1"
                    onClick={handlePrevious}
                    disabled={currentIndex <= 1}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Phần trước
                  </Button>
                  
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span>{currentIndex}</span>
                    <span>/</span>
                    <span>{lessons.length}</span>
                  </div>
                  
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="gap-1"
                    onClick={handleNext}
                    disabled={currentIndex >= lessons.length}
                  >
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
