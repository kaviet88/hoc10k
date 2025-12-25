import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Save, X, Loader2, Upload, FileJson, FileSpreadsheet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuizQuestion {
  id: string;
  program_id: string;
  lesson_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
  question_order: number;
}

export function QuizManager() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [programId, setProgramId] = useState("1");
  const [lessonId, setLessonId] = useState("1-1");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [explanation, setExplanation] = useState("");
  const [questionOrder, setQuestionOrder] = useState(1);

  // Filter state
  const [filterProgramId, setFilterProgramId] = useState("all");
  const [filterLessonId, setFilterLessonId] = useState("all");

  useEffect(() => {
    fetchQuestions();
  }, [filterProgramId, filterLessonId]);

  async function fetchQuestions() {
    setLoading(true);
    let query = supabase.from("lesson_quizzes").select("*").order("question_order");
    
    if (filterProgramId !== "all") {
      query = query.eq("program_id", filterProgramId);
    }
    if (filterLessonId !== "all") {
      query = query.eq("lesson_id", filterLessonId);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Lỗi khi tải câu hỏi");
      console.error(error);
    } else {
      setQuestions(data?.map(q => ({
        ...q,
        options: q.options as string[]
      })) || []);
    }
    setLoading(false);
  }

  function resetForm() {
    setProgramId("1");
    setLessonId("1-1");
    setQuestion("");
    setOptions(["", "", "", ""]);
    setCorrectAnswer(0);
    setExplanation("");
    setQuestionOrder(1);
    setEditingQuestion(null);
  }

  function openEditDialog(q: QuizQuestion) {
    setEditingQuestion(q);
    setProgramId(q.program_id);
    setLessonId(q.lesson_id);
    setQuestion(q.question);
    setOptions(q.options);
    setCorrectAnswer(q.correct_answer);
    setExplanation(q.explanation || "");
    setQuestionOrder(q.question_order);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!question.trim() || options.some(o => !o.trim())) {
      toast.error("Vui lòng điền đầy đủ câu hỏi và các lựa chọn");
      return;
    }

    setSaving(true);
    const questionData = {
      program_id: programId,
      lesson_id: lessonId,
      question,
      options,
      correct_answer: correctAnswer,
      explanation: explanation || null,
      question_order: questionOrder,
    };

    if (editingQuestion) {
      const { error } = await supabase
        .from("lesson_quizzes")
        .update(questionData)
        .eq("id", editingQuestion.id);

      if (error) {
        toast.error("Lỗi khi cập nhật câu hỏi");
        console.error(error);
      } else {
        toast.success("Đã cập nhật câu hỏi");
        setDialogOpen(false);
        resetForm();
        fetchQuestions();
      }
    } else {
      const { error } = await supabase
        .from("lesson_quizzes")
        .insert(questionData);

      if (error) {
        toast.error("Lỗi khi thêm câu hỏi");
        console.error(error);
      } else {
        toast.success("Đã thêm câu hỏi mới");
        setDialogOpen(false);
        resetForm();
        fetchQuestions();
      }
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc muốn xóa câu hỏi này?")) return;

    const { error } = await supabase.from("lesson_quizzes").delete().eq("id", id);

    if (error) {
      toast.error("Lỗi khi xóa câu hỏi");
      console.error(error);
    } else {
      toast.success("Đã xóa câu hỏi");
      fetchQuestions();
    }
  }

  function parseCSV(text: string): any[] {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const results: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const obj: any = {};
      headers.forEach((header, idx) => {
        obj[header] = values[idx] || '';
      });
      results.push(obj);
    }
    return results;
  }

  async function handleFileImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const text = await file.text();
    let data: any[] = [];

    try {
      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        data = Array.isArray(parsed) ? parsed : [parsed];
      } else if (file.name.endsWith('.csv')) {
        data = parseCSV(text);
      } else {
        toast.error("Chỉ hỗ trợ file JSON hoặc CSV");
        setImporting(false);
        return;
      }

      // Transform and validate data
      const questionsToInsert = data.map((item, idx) => ({
        program_id: item.program_id || programId,
        lesson_id: item.lesson_id || lessonId,
        question: item.question,
        options: item.options ? (typeof item.options === 'string' ? JSON.parse(item.options) : item.options) : [item.option1, item.option2, item.option3, item.option4].filter(Boolean),
        correct_answer: parseInt(item.correct_answer) || 0,
        explanation: item.explanation || null,
        question_order: parseInt(item.question_order) || idx + 1,
      })).filter(q => q.question && q.options.length > 0);

      if (questionsToInsert.length === 0) {
        toast.error("Không tìm thấy câu hỏi hợp lệ trong file");
        setImporting(false);
        return;
      }

      const { error } = await supabase.from("lesson_quizzes").insert(questionsToInsert);

      if (error) {
        toast.error("Lỗi khi import: " + error.message);
        console.error(error);
      } else {
        toast.success(`Đã import ${questionsToInsert.length} câu hỏi`);
        setImportDialogOpen(false);
        fetchQuestions();
      }
    } catch (err) {
      toast.error("Lỗi khi đọc file: " + (err as Error).message);
      console.error(err);
    }

    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="space-y-6">
      {/* Filters and Add Button */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-2">
          <Label>Chương trình</Label>
          <Select value={filterProgramId} onValueChange={setFilterProgramId}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="1">Chương trình 1</SelectItem>
              <SelectItem value="2">Chương trình 2</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Bài học</Label>
          <Input
            placeholder="VD: 1-2"
            value={filterLessonId === "all" ? "" : filterLessonId}
            onChange={(e) => setFilterLessonId(e.target.value || "all")}
            className="w-32"
          />
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Thêm câu hỏi
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingQuestion ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi mới"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Chương trình ID</Label>
                  <Input value={programId} onChange={(e) => setProgramId(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Bài học ID</Label>
                  <Input value={lessonId} onChange={(e) => setLessonId(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Thứ tự</Label>
                  <Input 
                    type="number" 
                    value={questionOrder} 
                    onChange={(e) => setQuestionOrder(parseInt(e.target.value) || 1)} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Câu hỏi</Label>
                <Textarea 
                  value={question} 
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Các lựa chọn (đánh dấu đáp án đúng)</Label>
                {options.map((opt, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={correctAnswer === idx}
                      onChange={() => setCorrectAnswer(idx)}
                      className="w-4 h-4"
                    />
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const newOptions = [...options];
                        newOptions[idx] = e.target.value;
                        setOptions(newOptions);
                      }}
                      placeholder={`Lựa chọn ${idx + 1}`}
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Giải thích (tùy chọn)</Label>
                <Textarea 
                  value={explanation} 
                  onChange={(e) => setExplanation(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Hủy
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Lưu
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Import Dialog */}
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Upload className="w-4 h-4" />
              Import
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import câu hỏi từ file</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Chương trình mặc định</Label>
                <Input value={programId} onChange={(e) => setProgramId(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Bài học mặc định</Label>
                <Input value={lessonId} onChange={(e) => setLessonId(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Chọn file (JSON hoặc CSV)</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv"
                  onChange={handleFileImport}
                  disabled={importing}
                />
              </div>
              {importing && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang import...
                </div>
              )}
              <Card className="bg-muted/50">
                <CardContent className="pt-4 text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Định dạng file:</p>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1">
                      <FileJson className="w-4 h-4" />
                      <span>JSON</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>CSV</span>
                    </div>
                  </div>
                  <p className="mt-2">Các trường: question, options (mảng hoặc option1-4), correct_answer (0-3), explanation, program_id, lesson_id</p>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : questions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Chưa có câu hỏi nào. Hãy thêm câu hỏi mới!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <Card key={q.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">
                    <span className="text-muted-foreground mr-2">#{idx + 1}</span>
                    {q.question}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(q)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(q.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm text-muted-foreground mb-2">
                  Chương trình: {q.program_id} | Bài học: {q.lesson_id}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map((opt, optIdx) => (
                    <div 
                      key={optIdx}
                      className={`p-2 rounded text-sm ${
                        optIdx === q.correct_answer 
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-700" 
                          : "bg-muted"
                      }`}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
                {q.explanation && (
                  <p className="mt-2 text-sm text-muted-foreground italic">
                    Giải thích: {q.explanation}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
