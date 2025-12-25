import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ShieldAlert, Brain, HelpCircle, FileQuestion } from "lucide-react";
import { QuizManager } from "@/components/admin/QuizManager";
import { MindMapManager } from "@/components/admin/MindMapManager";
import { ExamQuestionManager } from "@/components/admin/ExamQuestionManager";

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <ShieldAlert className="w-16 h-16 text-destructive" />
          <h1 className="text-2xl font-bold text-foreground">Không có quyền truy cập</h1>
          <p className="text-muted-foreground">Bạn không có quyền quản trị viên để truy cập trang này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Quản trị nội dung</h1>
          <p className="text-muted-foreground mt-2">Quản lý câu hỏi quiz, sơ đồ tư duy và đề thi</p>
        </div>

        <Tabs defaultValue="exam" className="w-full">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="exam" className="gap-2">
              <FileQuestion className="w-4 h-4" />
              Đề thi
            </TabsTrigger>
            <TabsTrigger value="quiz" className="gap-2">
              <HelpCircle className="w-4 h-4" />
              Quiz bài học
            </TabsTrigger>
            <TabsTrigger value="mindmap" className="gap-2">
              <Brain className="w-4 h-4" />
              Sơ đồ tư duy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="exam" className="mt-6">
            <ExamQuestionManager />
          </TabsContent>

          <TabsContent value="quiz" className="mt-6">
            <QuizManager />
          </TabsContent>

          <TabsContent value="mindmap" className="mt-6">
            <MindMapManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}