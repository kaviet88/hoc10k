import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Loader2, Upload, Download } from "lucide-react";

interface PracticeTest {
  id: string;
  title: string;
  subject: string;
}

interface ExamQuestion {
  id: string;
  test_id: string;
  question_number: number;
  question_type: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  audio_url: string | null;
  listening_blanks: { id: string; label: string; placeholder: string }[] | null;
  explanation: string | null;
}

export function ExamQuestionManager() {
  const [tests, setTests] = useState<PracticeTest[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>("");
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  // Form state
  const [questionNumber, setQuestionNumber] = useState(1);
  const [questionType, setQuestionType] = useState("multiple_choice");
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [listeningBlanks, setListeningBlanks] = useState<{ id: string; label: string; placeholder: string }[]>([]);
  const [explanation, setExplanation] = useState("");

  useEffect(() => {
    fetchTests();
  }, []);

  useEffect(() => {
    if (selectedTestId) {
      fetchQuestions();
    }
  }, [selectedTestId]);

  const fetchTests = async () => {
    const { data, error } = await supabase
      .from("practice_tests")
      .select("id, title, subject")
      .order("title");

    if (!error && data) {
      setTests(data);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("practice_test_questions")
      .select("*")
      .eq("test_id", selectedTestId)
      .order("question_number");

    if (!error && data) {
      setQuestions(data.map(q => ({
        ...q,
        options: Array.isArray(q.options) ? (q.options as unknown as string[]) : [],
        listening_blanks: q.listening_blanks as { id: string; label: string; placeholder: string }[] | null
      })));
    }
    setLoading(false);
  };

  const resetForm = () => {
    setQuestionNumber(questions.length + 1);
    setQuestionType("multiple_choice");
    setQuestionText("");
    setOptions(["", "", "", ""]);
    setCorrectAnswer("");
    setAudioUrl("");
    setListeningBlanks([]);
    setExplanation("");
    setEditingQuestion(null);
  };

  const openEditDialog = (q: ExamQuestion) => {
    setEditingQuestion(q);
    setQuestionNumber(q.question_number);
    setQuestionType(q.question_type);
    setQuestionText(q.question_text);
    setOptions(q.options.length > 0 ? q.options : ["", "", "", ""]);
    setCorrectAnswer(q.correct_answer);
    setAudioUrl(q.audio_url || "");
    setListeningBlanks(q.listening_blanks || []);
    setExplanation(q.explanation || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedTestId || !questionText || !correctAnswer) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const questionData = {
      test_id: selectedTestId,
      question_number: questionNumber,
      question_type: questionType,
      question_text: questionText,
      options: questionType === "multiple_choice" ? options.filter(o => o.trim()) : [],
      correct_answer: correctAnswer,
      audio_url: audioUrl || null,
      listening_blanks: questionType === "listening" && listeningBlanks.length > 0 ? listeningBlanks : null,
      explanation: explanation || null,
    };

    let error;
    if (editingQuestion) {
      ({ error } = await supabase
        .from("practice_test_questions")
        .update(questionData)
        .eq("id", editingQuestion.id));
    } else {
      ({ error } = await supabase
        .from("practice_test_questions")
        .insert(questionData));
    }

    if (error) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Thành công",
        description: editingQuestion ? "Đã cập nhật câu hỏi" : "Đã thêm câu hỏi mới",
      });
      setDialogOpen(false);
      resetForm();
      fetchQuestions();
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa câu hỏi này?")) return;

    const { error } = await supabase
      .from("practice_test_questions")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Đã xóa câu hỏi" });
      fetchQuestions();
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedTestId) return;

    setImporting(true);

    try {
      const text = await file.text();
      let questionsToImport: Omit<ExamQuestion, "id">[];

      if (file.name.endsWith(".json")) {
        questionsToImport = JSON.parse(text);
      } else if (file.name.endsWith(".csv")) {
        const lines = text.split("\n").filter(l => l.trim());
        const headers = lines[0].split(",").map(h => h.trim());
        questionsToImport = lines.slice(1).map((line, idx) => {
          const values = line.split(",").map(v => v.trim());
          const obj: Record<string, unknown> = {};
          headers.forEach((h, i) => {
            if (h === "options") {
              obj[h] = values[i] ? values[i].split("|") : [];
            } else if (h === "listening_blanks") {
              obj[h] = values[i] ? JSON.parse(values[i]) : null;
            } else {
              obj[h] = values[i] || "";
            }
          });
          return {
            test_id: selectedTestId,
            question_number: obj.question_number ? Number(obj.question_number) : idx + 1,
            question_type: (obj.question_type as string) || "multiple_choice",
            question_text: (obj.question_text as string) || "",
            options: (obj.options as string[]) || [],
            correct_answer: (obj.correct_answer as string) || "",
            audio_url: (obj.audio_url as string) || null,
            listening_blanks: obj.listening_blanks as { id: string; label: string; placeholder: string }[] | null,
            explanation: (obj.explanation as string) || null,
          };
        });
      } else {
        throw new Error("Chỉ hỗ trợ file JSON hoặc CSV");
      }

      const dataToInsert = questionsToImport.map(q => ({
        ...q,
        test_id: selectedTestId,
      }));

      const { error } = await supabase
        .from("practice_test_questions")
        .insert(dataToInsert);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: `Đã import ${dataToInsert.length} câu hỏi`,
      });
      setImportDialogOpen(false);
      fetchQuestions();
    } catch (err) {
      toast({
        title: "Lỗi import",
        description: err instanceof Error ? err.message : "Có lỗi xảy ra",
        variant: "destructive",
      });
    }

    setImporting(false);
    event.target.value = "";
  };

  const addListeningBlank = () => {
    setListeningBlanks([
      ...listeningBlanks,
      { id: `blank_${Date.now()}`, label: `Ô ${listeningBlanks.length + 1}`, placeholder: "..." },
    ]);
  };

  const updateListeningBlank = (index: number, field: keyof typeof listeningBlanks[0], value: string) => {
    const updated = [...listeningBlanks];
    updated[index] = { ...updated[index], [field]: value };
    setListeningBlanks(updated);
  };

  const removeListeningBlank = (index: number) => {
    setListeningBlanks(listeningBlanks.filter((_, i) => i !== index));
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "multiple_choice": return "Trắc nghiệm";
      case "fill_blank": return "Điền vào chỗ trống";
      case "dropdown": return "Chọn từ dropdown";
      case "listening": return "Nghe";
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Test Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Chọn bài kiểm tra</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedTestId} onValueChange={setSelectedTestId}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Chọn bài kiểm tra..." />
            </SelectTrigger>
            <SelectContent>
              {tests.map((test) => (
                <SelectItem key={test.id} value={test.id}>
                  {test.title} ({test.subject})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedTestId && (
        <>
          {/* Actions */}
          <div className="flex gap-2">
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
                    {editingQuestion ? "Sửa câu hỏi" : "Thêm câu hỏi mới"}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Số thứ tự câu hỏi</Label>
                      <Input
                        type="number"
                        value={questionNumber}
                        onChange={(e) => setQuestionNumber(parseInt(e.target.value))}
                        min={1}
                      />
                    </div>
                    <div>
                      <Label>Loại câu hỏi</Label>
                      <Select value={questionType} onValueChange={setQuestionType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multiple_choice">Trắc nghiệm</SelectItem>
                          <SelectItem value="fill_blank">Điền vào chỗ trống</SelectItem>
                          <SelectItem value="dropdown">Chọn từ dropdown</SelectItem>
                          <SelectItem value="listening">Nghe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Nội dung câu hỏi *</Label>
                    <Textarea
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      placeholder="Nhập nội dung câu hỏi..."
                      rows={3}
                    />
                  </div>

                  {questionType === "multiple_choice" && (
                    <div>
                      <Label>Các đáp án (mỗi dòng 1 đáp án)</Label>
                      <div className="space-y-2">
                        {options.map((opt, idx) => (
                          <Input
                            key={idx}
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...options];
                              newOpts[idx] = e.target.value;
                              setOptions(newOpts);
                            }}
                            placeholder={`Đáp án ${idx + 1}`}
                          />
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOptions([...options, ""])}
                        >
                          + Thêm đáp án
                        </Button>
                      </div>
                    </div>
                  )}

                  {(questionType === "listening") && (
                    <>
                      <div>
                        <Label>URL Audio</Label>
                        <Input
                          value={audioUrl}
                          onChange={(e) => setAudioUrl(e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <Label>Các ô điền (cho câu hỏi nghe nhiều ô trống)</Label>
                        <div className="space-y-2">
                          {listeningBlanks.map((blank, idx) => (
                            <div key={blank.id} className="flex gap-2 items-center">
                              <Input
                                value={blank.label}
                                onChange={(e) => updateListeningBlank(idx, "label", e.target.value)}
                                placeholder="Nhãn"
                                className="flex-1"
                              />
                              <Input
                                value={blank.placeholder}
                                onChange={(e) => updateListeningBlank(idx, "placeholder", e.target.value)}
                                placeholder="Placeholder"
                                className="flex-1"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeListeningBlank(idx)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" onClick={addListeningBlank}>
                            + Thêm ô điền
                          </Button>
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <Label>Đáp án đúng *</Label>
                    <Input
                      value={correctAnswer}
                      onChange={(e) => setCorrectAnswer(e.target.value)}
                      placeholder={questionType === "multiple_choice" ? "Nhập index (0, 1, 2...)" : "Nhập đáp án..."}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {questionType === "multiple_choice" 
                        ? "Nhập số thứ tự đáp án đúng (bắt đầu từ 0)"
                        : questionType === "listening" && listeningBlanks.length > 0
                        ? "Nhập các đáp án cách nhau bởi dấu phẩy"
                        : "Nhập đáp án đúng"}
                    </p>
                  </div>

                  <div>
                    <Label>Giải thích (tùy chọn)</Label>
                    <Textarea
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                      placeholder="Giải thích đáp án..."
                      rows={2}
                    />
                  </div>

                  <Button onClick={handleSave} disabled={saving} className="w-full">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {editingQuestion ? "Cập nhật" : "Thêm câu hỏi"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Upload className="w-4 h-4" />
                  Import
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import câu hỏi</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Upload file JSON hoặc CSV chứa danh sách câu hỏi
                  </p>
                  <Input
                    type="file"
                    accept=".json,.csv"
                    onChange={handleFileImport}
                    disabled={importing}
                  />
                  {importing && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang import...
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Tải template:</p>
                    <div className="flex gap-2">
                      <a
                        href="data:application/json,%5B%7B%22question_number%22%3A1%2C%22question_type%22%3A%22multiple_choice%22%2C%22question_text%22%3A%22Sample%20question%3F%22%2C%22options%22%3A%5B%22A%22%2C%22B%22%2C%22C%22%2C%22D%22%5D%2C%22correct_answer%22%3A%220%22%2C%22explanation%22%3A%22Explanation%20here%22%7D%5D"
                        download="template_questions.json"
                        className="text-primary underline flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        JSON
                      </a>
                      <a
                        href="data:text/csv,question_number%2Cquestion_type%2Cquestion_text%2Coptions%2Ccorrect_answer%2Cexplanation%0A1%2Cmultiple_choice%2CSample%20question%3F%2CA%7CB%7CC%7CD%2C0%2CExplanation%20here"
                        download="template_questions.csv"
                        className="text-primary underline flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        CSV
                      </a>
                    </div>
                  </div>
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
                Chưa có câu hỏi nào. Hãy thêm câu hỏi mới hoặc import từ file.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {questions.map((q) => (
                <Card key={q.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Câu {q.question_number}</Badge>
                          <Badge variant="secondary">{getQuestionTypeLabel(q.question_type)}</Badge>
                          {q.audio_url && <Badge variant="outline">🔊 Audio</Badge>}
                        </div>
                        <p className="text-sm text-foreground line-clamp-2 whitespace-pre-wrap">
                          {q.question_text}
                        </p>
                        {q.options && q.options.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {q.options.map((opt, idx) => (
                              <Badge
                                key={idx}
                                variant={q.correct_answer === String(idx) ? "default" : "outline"}
                                className="text-xs"
                              >
                                {opt}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(q)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(q.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
