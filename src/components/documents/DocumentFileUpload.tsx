import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, X, FileText, Image, Loader2, Check } from "lucide-react";

interface DocumentFileUploadProps {
  bucketName: "documents" | "document-thumbnails";
  currentUrl?: string;
  onUploadComplete: (url: string) => void;
  accept?: string;
  label: string;
  maxSizeMB?: number;
}

export function DocumentFileUpload({
  bucketName,
  currentUrl,
  onUploadComplete,
  accept = "*/*",
  label,
  maxSizeMB = 50,
}: DocumentFileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(currentUrl || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File quá lớn. Tối đa ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Generate unique file name
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload file to Supabase storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        toast.error("Lỗi khi tải file. Vui lòng thử lại.");
        setProgress(0);
        setUploading(false);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      const publicUrl = urlData.publicUrl;
      setPreviewUrl(publicUrl);
      onUploadComplete(publicUrl);
      setProgress(100);

      toast.success("Tải file thành công!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Lỗi khi tải file. Vui lòng thử lại.");
      setProgress(0);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    setPreviewUrl("");
    onUploadComplete("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isImage = previewUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(previewUrl);
  const isPdf = previewUrl && /\.pdf$/i.test(previewUrl);

  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      {/* Current file preview */}
      {previewUrl && (
        <div className="relative rounded-lg border bg-muted/50 p-3">
          <div className="flex items-center gap-3">
            {isImage ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-16 h-16 object-cover rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : isPdf ? (
              <div className="w-16 h-16 bg-red-100 rounded flex items-center justify-center">
                <FileText className="w-8 h-8 text-red-500" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-blue-100 rounded flex items-center justify-center">
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {previewUrl.split("/").pop()}
              </p>
              <div className="flex items-center gap-1 text-xs text-green-600">
                <Check className="w-3 h-3" />
                Đã tải lên
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={handleRemove}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Upload area */}
      {!previewUrl && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            uploading
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          {uploading ? (
            <div className="space-y-3">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Đang tải lên...</p>
              <Progress value={progress} className="w-full max-w-xs mx-auto" />
            </div>
          ) : (
            <div className="space-y-2">
              {bucketName === "document-thumbnails" ? (
                <Image className="w-8 h-8 mx-auto text-muted-foreground" />
              ) : (
                <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">Kéo thả hoặc click để chọn file</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tối đa {maxSizeMB}MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Or enter URL manually */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">hoặc</span>
        <Input
          type="url"
          placeholder="Nhập URL file..."
          value={previewUrl}
          onChange={(e) => {
            setPreviewUrl(e.target.value);
            onUploadComplete(e.target.value);
          }}
          className="flex-1"
        />
      </div>
    </div>
  );
}

