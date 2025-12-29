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
import { DocumentFileUpload } from "@/components/documents/DocumentFileUpload";
import {
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Loader2,
  Upload,
  Download,
  FileText,
  Eye,
  File
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

interface Document {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  file_url: string | null;
  badge: string | null;
  badge_color: string;
  price: number;
  view_count: number;
  download_count: number;
  is_free: boolean;
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

const defaultBadges = [
  "Toán Học",
  "Tiếng Việt",
  "Tiếng Anh",
  "Tiếng Trung",
  "Khoa Học",
  "Lịch Sử",
];

export function DocumentManager() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [badge, setBadge] = useState("");
  const [badgeColor, setBadgeColor] = useState("primary");
  const [price, setPrice] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [downloadCount, setDownloadCount] = useState(0);
  const [isFree, setIsFree] = useState(false);
  const [isPublished, setIsPublished] = useState(true);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPublished, setFilterPublished] = useState("all");
  const [filterBadge, setFilterBadge] = useState("all");

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    setLoading(true);

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Lỗi khi tải danh sách tài liệu");
      console.error(error);
    } else {
      setDocuments((data as Document[]) || []);
    }
    setLoading(false);
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setThumbnailUrl("");
    setFileUrl("");
    setBadge("");
    setBadgeColor("primary");
    setPrice(0);
    setViewCount(0);
    setDownloadCount(0);
    setIsFree(false);
    setIsPublished(true);
    setEditingDocument(null);
  }

  function openEditDialog(doc: Document) {
    setEditingDocument(doc);
    setTitle(doc.title);
    setDescription(doc.description || "");
    setThumbnailUrl(doc.thumbnail_url || "");
    setFileUrl(doc.file_url || "");
    setBadge(doc.badge || "");
    setBadgeColor(doc.badge_color);
    setPrice(doc.price || 0);
    setViewCount(doc.view_count);
    setDownloadCount(doc.download_count);
    setIsFree(doc.is_free);
    setIsPublished(doc.is_published);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề tài liệu");
      return;
    }

    setSaving(true);

    const documentData = {
      title: title.trim(),
      description: description.trim() || null,
      thumbnail_url: thumbnailUrl.trim() || null,
      file_url: fileUrl.trim() || null,
      badge: badge.trim() || null,
      badge_color: badgeColor,
      price: price,
      view_count: viewCount,
      download_count: downloadCount,
      is_free: isFree,
      is_published: isPublished,
    };

    let error;

    if (editingDocument) {
      const result = await supabase
        .from("documents")
        .update(documentData)
        .eq("id", editingDocument.id);
      error = result.error;
    } else {
      const result = await supabase
        .from("documents")
        .insert([documentData]);
      error = result.error;
    }

    if (error) {
      toast.error(`Lỗi khi ${editingDocument ? "cập nhật" : "thêm"} tài liệu`);
      console.error(error);
    } else {
      toast.success(`${editingDocument ? "Cập nhật" : "Thêm"} tài liệu thành công`);
      setDialogOpen(false);
      resetForm();
      fetchDocuments();
    }

    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc chắn muốn xóa tài liệu này?")) return;

    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Lỗi khi xóa tài liệu");
      console.error(error);
    } else {
      toast.success("Đã xóa tài liệu");
      fetchDocuments();
    }
  }

  async function handleTogglePublish(doc: Document) {
    const { error } = await supabase
      .from("documents")
      .update({ is_published: !doc.is_published })
      .eq("id", doc.id);

    if (error) {
      toast.error("Lỗi khi cập nhật trạng thái");
      console.error(error);
    } else {
      toast.success(doc.is_published ? "Đã ẩn tài liệu" : "Đã xuất bản tài liệu");
      fetchDocuments();
    }
  }

  function exportToJson() {
    const dataStr = JSON.stringify(documents, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = "documents.json";

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
        file_url?: string;
        fileUrl?: string;
        badge?: string;
        badge_color?: string;
        badgeColor?: string;
        view_count?: number;
        viewCount?: number;
        download_count?: number;
        downloadCount?: number;
        is_free?: boolean;
        isFree?: boolean;
        is_published?: boolean;
      }

      const documentsToImport = data.map((item: ImportItem) => ({
        title: item.title,
        description: item.description || null,
        thumbnail_url: item.thumbnail_url || item.thumbnailUrl || null,
        file_url: item.file_url || item.fileUrl || null,
        badge: item.badge || null,
        badge_color: item.badge_color || item.badgeColor || "primary",
        view_count: item.view_count || item.viewCount || 0,
        download_count: item.download_count || item.downloadCount || 0,
        is_free: item.is_free !== undefined ? item.is_free : (item.isFree || false),
        is_published: item.is_published !== undefined ? item.is_published : true,
      }));

      const { error } = await supabase
        .from("documents")
        .insert(documentsToImport);

      if (error) {
        toast.error("Lỗi khi import: " + error.message);
        console.error(error);
      } else {
        toast.success(`Đã import ${documentsToImport.length} tài liệu`);
        setImportDialogOpen(false);
        fetchDocuments();
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

  // Get unique badges from documents
  const uniqueBadges = [...new Set(documents.map(d => d.badge).filter(Boolean))];

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPublished = filterPublished === "all" ||
      (filterPublished === "published" && doc.is_published) ||
      (filterPublished === "draft" && !doc.is_published);
    const matchesBadge = filterBadge === "all" || doc.badge === filterBadge;
    return matchesSearch && matchesPublished && matchesBadge;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Quản lý Tài liệu ({documents.length})
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
                    <DialogTitle>Import Tài liệu từ JSON</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Chọn file JSON chứa danh sách tài liệu để import.
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
                    Thêm tài liệu
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingDocument ? "Chỉnh sửa tài liệu" : "Thêm tài liệu mới"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Tiêu đề *</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Nhập tiêu đề tài liệu"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="description">Mô tả</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Nhập mô tả tài liệu"
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

                    <DocumentFileUpload
                      bucketName="document-thumbnails"
                      currentUrl={thumbnailUrl}
                      onUploadComplete={setThumbnailUrl}
                      accept="image/*"
                      label="Hoặc tải lên hình thumbnail"
                      maxSizeMB={5}
                    />

                    <div className="grid gap-2">
                      <Label htmlFor="fileUrl">URL File tài liệu</Label>
                      <Input
                        id="fileUrl"
                        value={fileUrl}
                        onChange={(e) => setFileUrl(e.target.value)}
                        placeholder="https://... (link file PDF, DOC, ...)"
                      />
                    </div>

                    <DocumentFileUpload
                      bucketName="documents"
                      currentUrl={fileUrl}
                      onUploadComplete={setFileUrl}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                      label="Hoặc tải lên file tài liệu"
                      maxSizeMB={50}
                    />

                    <div className="grid gap-2">
                      <Label htmlFor="price">Giá (VNĐ)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        placeholder="0 = Miễn phí"
                        min={0}
                      />
                      <p className="text-xs text-muted-foreground">
                        Nhập 0 và đánh dấu "Miễn phí" nếu tài liệu miễn phí
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="badge">Nhãn (Badge)</Label>
                        <Select value={badge} onValueChange={setBadge}>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn hoặc nhập nhãn" />
                          </SelectTrigger>
                          <SelectContent>
                            {defaultBadges.map((b) => (
                              <SelectItem key={b} value={b}>
                                {b}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={badge}
                          onChange={(e) => setBadge(e.target.value)}
                          placeholder="Hoặc nhập nhãn tùy chỉnh"
                          className="mt-1"
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
                        <Label htmlFor="downloadCount">Lượt tải</Label>
                        <Input
                          id="downloadCount"
                          type="number"
                          value={downloadCount}
                          onChange={(e) => setDownloadCount(Number(e.target.value))}
                          min={0}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Switch
                          id="isFree"
                          checked={isFree}
                          onCheckedChange={setIsFree}
                        />
                        <Label htmlFor="isFree">Miễn phí</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="published"
                          checked={isPublished}
                          onCheckedChange={setIsPublished}
                        />
                        <Label htmlFor="published">Xuất bản</Label>
                      </div>
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
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {editingDocument ? "Cập nhật" : "Thêm mới"}
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
                placeholder="Tìm kiếm tài liệu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterBadge} onValueChange={setFilterBadge}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {uniqueBadges.map((b) => (
                  <SelectItem key={b} value={b!}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

      {/* Documents Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có tài liệu nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[350px]">Tài liệu</TableHead>
                    <TableHead>Danh mục</TableHead>
                    <TableHead>Thống kê</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-start gap-3">
                          {doc.thumbnail_url ? (
                            <img
                              src={doc.thumbnail_url}
                              alt={doc.title}
                              className="w-16 h-20 object-cover rounded"
                              onError={(e) => (e.currentTarget.style.display = "none")}
                            />
                          ) : (
                            <div className="w-16 h-20 bg-muted rounded flex items-center justify-center">
                              <File className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium line-clamp-2">{doc.title}</p>
                            {doc.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {doc.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {doc.badge && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              badgeColors.find((c) => c.value === doc.badge_color)?.class
                            }`}
                          >
                            {doc.badge}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {doc.view_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            {doc.download_count}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {doc.is_free ? (
                          <Badge className="bg-green-100 text-green-700">Miễn phí</Badge>
                        ) : (
                          <Badge variant="secondary">Trả phí</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={doc.is_published ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => handleTogglePublish(doc)}
                        >
                          {doc.is_published ? "Đã xuất bản" : "Bản nháp"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(doc)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(doc.id)}
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

