import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  Edit,
  Save,
  X,
  BookOpen,
  FileText,
  Eye,
  EyeOff,
  Search,
  Code,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProgramLesson {
  id: string;
  lesson_id: string;
  lesson_title: string;
  lesson_order: number;
  day_number: number | null;
  duration_minutes: number;
  program_id: string;
  video_url: string | null;
  thumbnail_url: string | null;
  content: string | null;
  created_at: string;
}

export function ProgramLessonManager() {
  const [lessons, setLessons] = useState<ProgramLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<ProgramLesson | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonOrder, setLessonOrder] = useState(1);
  const [dayNumber, setDayNumber] = useState<number | null>(1);
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [content, setContent] = useState("");
  const [previewMode, setPreviewMode] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProgramId, setFilterProgramId] = useState("all");

  useEffect(() => {
    fetchLessons();
  }, []);

  async function fetchLessons() {
    setLoading(true);

    const { data, error } = await supabase
      .from("program_lessons")
      .select("*")
      .order("program_id")
      .order("lesson_order");

    if (error) {
      toast.error("Lỗi khi tải danh sách bài học");
      console.error(error);
    } else {
      setLessons((data as ProgramLesson[]) || []);
    }
    setLoading(false);
  }

  function resetForm() {
    setLessonTitle("");
    setLessonOrder(1);
    setDayNumber(1);
    setDurationMinutes(10);
    setVideoUrl("");
    setThumbnailUrl("");
    setContent("");
    setPreviewMode(false);
    setEditingLesson(null);
  }

  function openEditDialog(lesson: ProgramLesson) {
    setEditingLesson(lesson);
    setLessonTitle(lesson.lesson_title);
    setLessonOrder(lesson.lesson_order);
    setDayNumber(lesson.day_number);
    setDurationMinutes(lesson.duration_minutes);
    setVideoUrl(lesson.video_url || "");
    setThumbnailUrl(lesson.thumbnail_url || "");
    setContent(lesson.content || "");
    setPreviewMode(false);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!editingLesson) return;

    setSaving(true);

    const { error } = await supabase
      .from("program_lessons")
      .update({
        lesson_title: lessonTitle.trim(),
        lesson_order: lessonOrder,
        day_number: dayNumber,
        duration_minutes: durationMinutes,
        video_url: videoUrl.trim() || null,
        thumbnail_url: thumbnailUrl.trim() || null,
        content: content.trim() || null,
      })
      .eq("id", editingLesson.id);

    if (error) {
      toast.error("Lỗi khi cập nhật bài học: " + error.message);
      console.error("Save error:", error);
    } else {
      toast.success("Cập nhật bài học thành công");
      setDialogOpen(false);
      resetForm();
      fetchLessons();
    }

    setSaving(false);
  }

  // Get unique program IDs for filter
  const programIds = [...new Set(lessons.map((l) => l.program_id))].sort();

  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch =
      lesson.lesson_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.lesson_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProgram =
      filterProgramId === "all" || lesson.program_id === filterProgramId;
    return matchesSearch && matchesProgram;
  });

  const insertTemplate = (template: string) => {
    setContent((prev) => prev + template);
  };

  const contentTemplates = [
    {
      name: "Tiêu đề",
      code: '<h3 class="text-center text-lg font-bold text-primary mb-4">TIÊU ĐỀ</h3>',
    },
    {
      name: "2 Cột",
      code: `<div class="grid md:grid-cols-2 gap-4">
  <div class="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
    <h4 class="font-bold text-blue-600 mb-3 text-center">Cột 1</h4>
    <ul class="text-sm space-y-1"><li>• Nội dung</li></ul>
  </div>
  <div class="bg-green-50 dark:bg-green-950/30 rounded-lg p-4">
    <h4 class="font-bold text-green-600 mb-3 text-center">Cột 2</h4>
    <ul class="text-sm space-y-1"><li>• Nội dung</li></ul>
  </div>
</div>`,
    },
    {
      name: "Ghi chú",
      code: '<div class="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg"><p class="text-center font-medium">💡 <strong>Ghi nhớ:</strong> Nội dung ghi chú</p></div>',
    },
    {
      name: "Emoji Grid",
      code: `<div class="flex justify-center gap-4 mb-3">
  <div class="text-center"><span class="text-2xl">🍎</span><p class="text-xs">apple</p></div>
  <div class="text-center"><span class="text-2xl">📚</span><p class="text-xs">book</p></div>
  <div class="text-center"><span class="text-2xl">🐱</span><p class="text-xs">cat</p></div>
</div>`,
    },
    {
      name: "Danh sách",
      code: `<ul class="text-sm space-y-1 text-muted-foreground">
  <li>• Mục 1</li>
  <li>• Mục 2</li>
  <li>• Mục 3</li>
</ul>`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Quản lý Nội dung Bài học ({lessons.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm bài học..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterProgramId} onValueChange={setFilterProgramId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Lọc theo khóa học" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả khóa học</SelectItem>
                {programIds.map((id) => (
                  <SelectItem key={id} value={id}>
                    Khóa học {id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lessons Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Lesson ID</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead className="w-[80px]">Khóa học</TableHead>
                  <TableHead className="w-[60px]">Ngày</TableHead>
                  <TableHead className="w-[80px]">Thời lượng</TableHead>
                  <TableHead className="w-[100px]">Nội dung</TableHead>
                  <TableHead className="w-[80px]">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLessons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Không tìm thấy bài học nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLessons.map((lesson) => (
                    <TableRow key={lesson.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {lesson.lesson_id}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{lesson.lesson_title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{lesson.program_id}</Badge>
                      </TableCell>
                      <TableCell>{lesson.day_number || "-"}</TableCell>
                      <TableCell>{lesson.duration_minutes} phút</TableCell>
                      <TableCell>
                        {lesson.content ? (
                          <Badge className="bg-success/20 text-success">
                            <FileText className="w-3 h-3 mr-1" />
                            Có
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Trống
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(lesson)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Chỉnh sửa nội dung bài học
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="grid gap-4 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="lessonTitle">Tiêu đề bài học</Label>
                  <Input
                    id="lessonTitle"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    placeholder="Nhập tiêu đề"
                  />
                </div>
                <div>
                  <Label htmlFor="dayNumber">Ngày</Label>
                  <Input
                    id="dayNumber"
                    type="number"
                    value={dayNumber || ""}
                    onChange={(e) =>
                      setDayNumber(e.target.value ? Number(e.target.value) : null)
                    }
                    min={1}
                  />
                </div>
                <div>
                  <Label htmlFor="durationMinutes">Thời lượng (phút)</Label>
                  <Input
                    id="durationMinutes"
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    min={1}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="videoUrl">URL Video</Label>
                  <Input
                    id="videoUrl"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label htmlFor="thumbnailUrl">URL Thumbnail</Label>
                  <Input
                    id="thumbnailUrl"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Content Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Nội dung bài học (HTML)</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewMode(!previewMode)}
                  >
                    {previewMode ? (
                      <>
                        <Code className="w-4 h-4 mr-2" />
                        Mã nguồn
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Xem trước
                      </>
                    )}
                  </Button>
                </div>

                {/* Template buttons */}
                <div className="flex flex-wrap gap-2">
                  {contentTemplates.map((template) => (
                    <Button
                      key={template.name}
                      variant="outline"
                      size="sm"
                      onClick={() => insertTemplate(template.code)}
                      className="text-xs"
                    >
                      + {template.name}
                    </Button>
                  ))}
                </div>

                <Tabs value={previewMode ? "preview" : "code"} className="w-full">
                  <TabsContent value="code" className="mt-0">
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Nhập nội dung HTML cho bài học..."
                      className="font-mono text-sm min-h-[300px]"
                    />
                  </TabsContent>
                  <TabsContent value="preview" className="mt-0">
                    <ScrollArea className="h-[300px] border rounded-md p-4 bg-card">
                      {content ? (
                        <div
                          className="prose prose-sm max-w-none dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: content }}
                        />
                      ) : (
                        <p className="text-muted-foreground text-center py-8">
                          Chưa có nội dung để xem trước
                        </p>
                      )}
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Lưu thay đổi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
