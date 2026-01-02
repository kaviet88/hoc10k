import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Loader2,
  Upload,
  Download,
  BookOpen,
  Eye,
  MessageSquare,
  Clock,
  Video
} from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VideoUploader } from "./VideoUploader";

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  price: number;
  original_price: number | null;
  duration: string;
  view_count: number;
  comment_count: number;
  badge: string | null;
  badge_color: string;
  program_id: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

const badgeColors = [
  { value: "primary", label: "Xanh dương", class: "bg-primary/10 text-primary" },
  { value: "success", label: "Xanh lá", class: "bg-green-100 text-green-700" },
  { value: "secondary", label: "Xám", class: "bg-secondary/20 text-secondary-foreground" },
  { value: "accent", label: "Cam", class: "bg-orange-100 text-orange-700" },
];

export function LessonManager() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [price, setPrice] = useState(0);
  const [originalPrice, setOriginalPrice] = useState<number | null>(null);
  const [duration, setDuration] = useState("0 phút");
  const [viewCount, setViewCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [badge, setBadge] = useState("");
  const [badgeColor, setBadgeColor] = useState("primary");
  const [programId, setProgramId] = useState("1");
  const [isPublished, setIsPublished] = useState(true);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPublished, setFilterPublished] = useState("all");

  useEffect(() => {
    fetchLessons();
  }, []);

  async function fetchLessons() {
    setLoading(true);

    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Lỗi khi tải danh sách khóa học");
      console.error(error);
    } else {
      setLessons((data as Lesson[]) || []);
    }
    setLoading(false);
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setThumbnailUrl("");
    setVideoUrl("");
    setUploadingVideo(false);
    setPrice(0);
    setOriginalPrice(null);
    setDuration("0 phút");
    setViewCount(0);
    setCommentCount(0);
    setBadge("");
    setBadgeColor("primary");
    setProgramId("1");
    setIsPublished(true);
    setEditingLesson(null);
  }

  function openEditDialog(lesson: Lesson) {
    setEditingLesson(lesson);
    setTitle(lesson.title);
    setDescription(lesson.description || "");
    setThumbnailUrl(lesson.thumbnail_url || "");
    setVideoUrl(lesson.video_url || "");
    setPrice(lesson.price);
    setOriginalPrice(lesson.original_price);
    setDuration(lesson.duration);
    setViewCount(lesson.view_count);
    setCommentCount(lesson.comment_count);
    setBadge(lesson.badge || "");
    setBadgeColor(lesson.badge_color);
    setProgramId(lesson.program_id);
    setIsPublished(lesson.is_published);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề khóa học");
      return;
    }

    setSaving(true);

    const lessonData = {
      title: title.trim(),
      description: description.trim() || null,
      thumbnail_url: thumbnailUrl.trim() || null,
      video_url: videoUrl.trim() || null,
      price,
      original_price: originalPrice,
      duration,
      view_count: viewCount,
      comment_count: commentCount,
      badge: badge.trim() || null,
      badge_color: badgeColor,
      program_id: programId,
      is_published: isPublished,
    };

    let error;

    if (editingLesson) {
      // Update
      const result = await supabase
        .from("lessons")
        .update(lessonData)
        .eq("id", editingLesson.id);
      error = result.error;
    } else {
      // Insert
      const result = await supabase
        .from("lessons")
        .insert([lessonData]);
      error = result.error;
    }

    if (error) {
      toast.error(`Lỗi khi ${editingLesson ? "cập nhật" : "thêm"} khóa học: ${error.message}`);
      console.error("Save error:", error);
    } else {
      toast.success(`${editingLesson ? "Cập nhật" : "Thêm"} khóa học thành công`);
      setDialogOpen(false);
      resetForm();
      fetchLessons();
    }

    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc chắn muốn xóa khóa học này?")) return;

    const { error } = await supabase
      .from("lessons")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Lỗi khi xóa khóa học");
      console.error(error);
    } else {
      toast.success("Đã xóa khóa học");
      fetchLessons();
    }
  }

  async function handleTogglePublish(lesson: Lesson) {
    const { error } = await supabase
      .from("lessons")
      .update({ is_published: !lesson.is_published })
      .eq("id", lesson.id);

    if (error) {
      toast.error("Lỗi khi cập nhật trạng thái");
      console.error(error);
    } else {
      toast.success(lesson.is_published ? "Đã ẩn khóa học" : "Đã xuất bản khóa học");
      fetchLessons();
    }
  }

  function exportToJson() {
    const dataStr = JSON.stringify(lessons, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = "lessons.json";

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
    toast.success("Đã xuất dữ liệu thành công");
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        toast.error("Dữ liệu không hợp lệ");
        setImporting(false);
        return;
      }

      interface ImportItem {
        title?: string;
        description?: string;
        thumbnail_url?: string;
        thumbnailUrl?: string;
        video_url?: string;
        videoUrl?: string;
        price?: number;
        original_price?: number;
        originalPrice?: number;
        duration?: string;
        view_count?: number;
        viewCount?: number;
        comment_count?: number;
        commentCount?: number;
        badge?: string;
        badge_color?: string;
        badgeColor?: string;
        program_id?: string;
        programId?: string;
        is_published?: boolean;
      }

      const lessonsToImport = data.map((item: ImportItem) => ({
        title: item.title,
        description: item.description || null,
        thumbnail_url: item.thumbnail_url || item.thumbnailUrl || null,
        video_url: item.video_url || item.videoUrl || null,
        price: item.price || 0,
        original_price: item.original_price || item.originalPrice || null,
        duration: item.duration || "0 phút",
        view_count: item.view_count || item.viewCount || 0,
        comment_count: item.comment_count || item.commentCount || 0,
        badge: item.badge || null,
        badge_color: item.badge_color || item.badgeColor || "primary",
        program_id: item.program_id || item.programId || "1",
        is_published: item.is_published !== undefined ? item.is_published : true,
      }));

      const { error } = await supabase
        .from("lessons")
        .insert(lessonsToImport);

      if (error) {
        toast.error("Lỗi khi import: " + error.message);
        console.error(error);
      } else {
        toast.success(`Đã import ${lessonsToImport.length} khóa học`);
        setImportDialogOpen(false);
        fetchLessons();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error("Lỗi khi import: " + errorMessage);
      console.error(error);
    }

    setImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + " đ";
  };

  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lesson.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPublished = filterPublished === "all" ||
      (filterPublished === "published" && lesson.is_published) ||
      (filterPublished === "draft" && !lesson.is_published);
    return matchesSearch && matchesPublished;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Quản lý Khóa học ({lessons.length})
            </CardTitle>
            <div className="flex gap-2">
              <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import Khóa học từ JSON</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Chọn file JSON chứa danh sách khóa học để import.
                    </p>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      disabled={importing}
                    />
                    {importing && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang import...
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline" size="sm" onClick={exportToJson}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>

              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm khóa học
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingLesson ? "Chỉnh sửa khóa học" : "Thêm khóa học mới"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Tiêu đề *</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Nhập tiêu đề khóa học"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="description">Mô tả</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Nhập mô tả khóa học"
                        rows={3}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="thumbnail">URL Thumbnail</Label>
                      <Input
                        id="thumbnail"
                        value={thumbnailUrl}
                        onChange={(e) => setThumbnailUrl(e.target.value)}
                        placeholder="https://..."
                      />
                      {thumbnailUrl && (
                        <img
                          src={thumbnailUrl}
                          alt="Preview"
                          className="w-32 h-20 object-cover rounded"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label className="flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        Video bài học
                      </Label>
                      <VideoUploader
                        value={videoUrl}
                        onChange={setVideoUrl}
                        onUploadStart={() => setUploadingVideo(true)}
                        onUploadEnd={() => setUploadingVideo(false)}
                        disabled={saving}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="price">Giá (VNĐ) *</Label>
                        <Input
                          id="price"
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(Number(e.target.value))}
                          min={0}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="originalPrice">Giá gốc (VNĐ)</Label>
                        <Input
                          id="originalPrice"
                          type="number"
                          value={originalPrice || ""}
                          onChange={(e) => setOriginalPrice(e.target.value ? Number(e.target.value) : null)}
                          min={0}
                          placeholder="Để trống nếu không giảm giá"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="duration">Thời lượng</Label>
                        <Input
                          id="duration"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          placeholder="VD: 365 ngày"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="programId">Program ID</Label>
                        <Input
                          id="programId"
                          value={programId}
                          onChange={(e) => setProgramId(e.target.value)}
                          placeholder="VD: 1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="viewCount">Lượt xem</Label>
                        <Input
                          id="viewCount"
                          type="number"
                          value={viewCount}
                          onChange={(e) => setViewCount(Number(e.target.value))}
                          min={0}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="commentCount">Bình luận</Label>
                        <Input
                          id="commentCount"
                          type="number"
                          value={commentCount}
                          onChange={(e) => setCommentCount(Number(e.target.value))}
                          min={0}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="badge">Nhãn (Badge)</Label>
                        <Input
                          id="badge"
                          value={badge}
                          onChange={(e) => setBadge(e.target.value)}
                          placeholder="VD: Tiếng Anh Cơ Bản"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="badgeColor">Màu nhãn</Label>
                        <Select value={badgeColor} onValueChange={setBadgeColor}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {badgeColors.map((color) => (
                              <SelectItem key={color.value} value={color.value}>
                                <div className="flex items-center gap-2">
                                  <Badge className={color.class}>{color.label}</Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        id="published"
                        checked={isPublished}
                        onCheckedChange={setIsPublished}
                      />
                      <Label htmlFor="published">Xuất bản ngay</Label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
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
                    <Button onClick={handleSave} disabled={saving || uploadingVideo}>
                      {saving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {uploadingVideo ? "Đang tải video..." : editingLesson ? "Cập nhật" : "Thêm mới"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Tìm kiếm khóa học..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterPublished} onValueChange={setFilterPublished}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="published">Đã xuất bản</SelectItem>
                <SelectItem value="draft">Bản nháp</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lessons Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredLessons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có khóa học nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Khóa học</TableHead>
                    <TableHead>Giá</TableHead>
                    <TableHead>Thời lượng</TableHead>
                    <TableHead>Thống kê</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLessons.map((lesson) => (
                    <TableRow key={lesson.id}>
                      <TableCell>
                        <div className="flex items-start gap-3">
                          {lesson.thumbnail_url && (
                            <img
                              src={lesson.thumbnail_url}
                              alt={lesson.title}
                              className="w-16 h-10 object-cover rounded"
                              onError={(e) => (e.currentTarget.style.display = "none")}
                            />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium line-clamp-1">{lesson.title}</p>
                              {lesson.video_url && (
                                <Video className="w-4 h-4 text-primary flex-shrink-0" aria-label="Có video" />
                              )}
                            </div>
                            {lesson.badge && (
                              <Badge
                                variant="outline"
                                className={`mt-1 text-xs ${
                                  badgeColors.find((c) => c.value === lesson.badge_color)?.class
                                }`}
                              >
                                {lesson.badge}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-primary">{formatPrice(lesson.price)}</p>
                          {lesson.original_price && (
                            <p className="text-xs text-muted-foreground line-through">
                              {formatPrice(lesson.original_price)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {lesson.duration}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {lesson.view_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {lesson.comment_count}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={lesson.is_published ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => handleTogglePublish(lesson)}
                        >
                          {lesson.is_published ? "Đã xuất bản" : "Bản nháp"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(lesson)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(lesson.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

