import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Upload, Image as ImageIcon, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Exam {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  grade: number | null;
  difficulty: string | null;
  exam_type: string | null;
  time_limit_minutes: number;
  total_questions: number;
  participant_count: number | null;
  is_premium: boolean | null;
  thumbnail_url: string | null;
  created_at: string;
}

const subjects = ["Toán", "Tiếng Việt", "Tiếng Anh", "TNTV"];
const grades = [1, 2, 3, 4, 5];
const difficulties = ["Dễ", "Trung bình", "Khó"];
const examTypes = ["school", "district", "province", "national", "olympiad"];

export function ExamManager() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "Toán",
    grade: 1,
    difficulty: "Trung bình",
    exam_type: "school",
    time_limit_minutes: 30,
    total_questions: 10,
    is_premium: false,
    thumbnail_url: "",
  });

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("practice_tests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Lỗi khi tải danh sách đề thi");
      console.error(error);
    } else {
      setExams(data || []);
    }
    setLoading(false);
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File ảnh không được vượt quá 5MB");
      return;
    }

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("exam-thumbnails")
      .upload(fileName, file);

    if (uploadError) {
      toast.error("Lỗi khi upload ảnh: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: publicUrl } = supabase.storage
      .from("exam-thumbnails")
      .getPublicUrl(fileName);

    setFormData({ ...formData, thumbnail_url: publicUrl.publicUrl });
    setPreviewUrl(publicUrl.publicUrl);
    setUploading(false);
    toast.success("Upload ảnh thành công");
  };

  const removeThumbnail = () => {
    setFormData({ ...formData, thumbnail_url: "" });
    setPreviewUrl(null);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      subject: "Toán",
      grade: 1,
      difficulty: "Trung bình",
      exam_type: "school",
      time_limit_minutes: 30,
      total_questions: 10,
      is_premium: false,
      thumbnail_url: "",
    });
    setPreviewUrl(null);
    setEditingExam(null);
  };

  const handleEdit = (exam: Exam) => {
    setEditingExam(exam);
    setFormData({
      title: exam.title,
      description: exam.description || "",
      subject: exam.subject,
      grade: exam.grade || 1,
      difficulty: exam.difficulty || "Trung bình",
      exam_type: exam.exam_type || "school",
      time_limit_minutes: exam.time_limit_minutes,
      total_questions: exam.total_questions,
      is_premium: exam.is_premium || false,
      thumbnail_url: exam.thumbnail_url || "",
    });
    setPreviewUrl(exam.thumbnail_url);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề đề thi");
      return;
    }

    setSaving(true);

    const examData = {
      title: formData.title,
      description: formData.description || null,
      subject: formData.subject,
      grade: formData.grade,
      difficulty: formData.difficulty,
      exam_type: formData.exam_type,
      time_limit_minutes: formData.time_limit_minutes,
      total_questions: formData.total_questions,
      is_premium: formData.is_premium,
      thumbnail_url: formData.thumbnail_url || null,
    };

    let error;
    if (editingExam) {
      ({ error } = await supabase
        .from("practice_tests")
        .update(examData)
        .eq("id", editingExam.id));
    } else {
      ({ error } = await supabase.from("practice_tests").insert(examData));
    }

    if (error) {
      toast.error("Lỗi khi lưu đề thi: " + error.message);
    } else {
      toast.success(editingExam ? "Cập nhật đề thi thành công" : "Thêm đề thi thành công");
      setDialogOpen(false);
      resetForm();
      fetchExams();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa đề thi này?")) return;

    const { error } = await supabase.from("practice_tests").delete().eq("id", id);

    if (error) {
      toast.error("Lỗi khi xóa đề thi: " + error.message);
    } else {
      toast.success("Xóa đề thi thành công");
      fetchExams();
    }
  };

  const getExamTypeName = (type: string) => {
    const types: Record<string, string> = {
      school: "Cấp trường",
      district: "Cấp huyện",
      province: "Cấp tỉnh",
      national: "Cấp quốc gia",
      olympiad: "Olympic",
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quản lý đề thi</h2>
          <p className="text-muted-foreground">Thêm, sửa, xóa các đề thi luyện tập</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Thêm đề thi
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingExam ? "Sửa đề thi" : "Thêm đề thi mới"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Thumbnail Upload */}
              <div className="space-y-2">
                <Label>Ảnh thumbnail</Label>
                <div className="flex items-start gap-4">
                  {previewUrl ? (
                    <div className="relative">
                      <img
                        src={previewUrl}
                        alt="Thumbnail preview"
                        className="w-32 h-24 object-cover rounded-lg border"
                      />
                      <button
                        onClick={removeThumbnail}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Label htmlFor="thumbnail-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors w-fit">
                        {uploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        <span>{uploading ? "Đang upload..." : "Chọn ảnh"}</span>
                      </div>
                    </Label>
                    <Input
                      id="thumbnail-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, WEBP. Tối đa 5MB.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nhập tiêu đề đề thi"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả đề thi"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Môn học</Label>
                  <Select
                    value={formData.subject}
                    onValueChange={(value) => setFormData({ ...formData, subject: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Khối lớp</Label>
                  <Select
                    value={String(formData.grade)}
                    onValueChange={(value) => setFormData({ ...formData, grade: Number(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map((g) => (
                        <SelectItem key={g} value={String(g)}>
                          Lớp {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Độ khó</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {difficulties.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Loại đề</Label>
                  <Select
                    value={formData.exam_type}
                    onValueChange={(value) => setFormData({ ...formData, exam_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {examTypes.map((t) => (
                        <SelectItem key={t} value={t}>
                          {getExamTypeName(t)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="time">Thời gian (phút)</Label>
                  <Input
                    id="time"
                    type="number"
                    min={1}
                    value={formData.time_limit_minutes}
                    onChange={(e) =>
                      setFormData({ ...formData, time_limit_minutes: Number(e.target.value) })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="questions">Số câu hỏi</Label>
                  <Input
                    id="questions"
                    type="number"
                    min={1}
                    value={formData.total_questions}
                    onChange={(e) =>
                      setFormData({ ...formData, total_questions: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Đề thi Premium</Label>
                  <p className="text-sm text-muted-foreground">Yêu cầu tài khoản trả phí</p>
                </div>
                <Switch
                  checked={formData.is_premium}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_premium: checked })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleSubmit} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingExam ? "Cập nhật" : "Thêm mới"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách đề thi ({exams.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Ảnh</TableHead>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Môn</TableHead>
                <TableHead>Lớp</TableHead>
                <TableHead>Độ khó</TableHead>
                <TableHead>Số câu</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell>
                    {exam.thumbnail_url ? (
                      <img
                        src={exam.thumbnail_url}
                        alt={exam.title}
                        className="w-12 h-9 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-9 bg-muted rounded flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {exam.title}
                  </TableCell>
                  <TableCell>{exam.subject}</TableCell>
                  <TableCell>Lớp {exam.grade}</TableCell>
                  <TableCell>{exam.difficulty}</TableCell>
                  <TableCell>{exam.total_questions}</TableCell>
                  <TableCell>{exam.time_limit_minutes} phút</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(exam)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDelete(exam.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {exams.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Chưa có đề thi nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
