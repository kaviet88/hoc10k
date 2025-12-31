import { useState, useRef, useCallback } from 'react';
import { Upload, X, Video, Loader2, Check, AlertCircle, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VideoUploaderProps {
  value: string;
  onChange: (url: string) => void;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
  disabled?: boolean;
  className?: string;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export function VideoUploader({
  value,
  onChange,
  onUploadStart,
  onUploadEnd,
  disabled = false,
  className,
}: VideoUploaderProps) {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(value ? 'url' : 'upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
  const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Định dạng không hỗ trợ. Vui lòng sử dụng MP4, WebM, hoặc OGG.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File quá lớn. Kích thước tối đa là ${MAX_FILE_SIZE / (1024 * 1024)}MB.`;
    }
    return null;
  };

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      setUploadStatus('error');
      toast.error(validationError);
      return;
    }

    setUploadStatus('uploading');
    setUploadProgress(0);
    setErrorMessage(null);
    onUploadStart?.();

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const extension = file.name.split('.').pop() || 'mp4';
      const fileName = `videos/${timestamp}-${randomString}.${extension}`;

      // Simulate progress for better UX (Supabase doesn't provide upload progress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('videos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      clearInterval(progressInterval);

      if (error) {
        // Check if bucket doesn't exist
        if (error.message.includes('Bucket not found')) {
          throw new Error('Video storage chưa được cấu hình. Vui lòng liên hệ admin.');
        }
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(data.path);

      setUploadProgress(100);
      setUploadStatus('success');
      onChange(urlData.publicUrl);
      toast.success('Tải video lên thành công!');
    } catch (error) {
      console.error('Upload error:', error);
      const message = error instanceof Error ? error.message : 'Lỗi khi tải video lên';
      setErrorMessage(message);
      setUploadStatus('error');
      toast.error(message);
    } finally {
      onUploadEnd?.();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || uploadStatus === 'uploading') return;

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      uploadFile(file);
    } else {
      toast.error('Vui lòng kéo thả file video');
    }
  }, [disabled, uploadStatus]);

  const handleUrlChange = (url: string) => {
    onChange(url);
    if (url) {
      setUploadStatus('idle');
      setErrorMessage(null);
    }
  };

  const handleRemove = () => {
    onChange('');
    setUploadStatus('idle');
    setUploadProgress(0);
    setErrorMessage(null);
  };

  const isValidVideoUrl = (url: string): boolean => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="w-4 h-4" />
            Tải lên
          </TabsTrigger>
          <TabsTrigger value="url" className="gap-2">
            <Link className="w-4 h-4" />
            URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-4">
          {/* Drag & Drop Zone */}
          <div
            className={cn(
              'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors',
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50',
              disabled && 'opacity-50 cursor-not-allowed',
              uploadStatus === 'uploading' && 'pointer-events-none'
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              disabled={disabled || uploadStatus === 'uploading'}
              className="hidden"
            />

            {uploadStatus === 'idle' && (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                  <Video className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Kéo thả video vào đây hoặc{' '}
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={disabled}
                    >
                      chọn file
                    </button>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    MP4, WebM, OGG (Tối đa 500MB)
                  </p>
                </div>
              </div>
            )}

            {uploadStatus === 'uploading' && (
              <div className="space-y-4">
                <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
                <div>
                  <p className="text-sm font-medium">Đang tải lên...</p>
                  <Progress value={uploadProgress} className="mt-2 h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {uploadProgress}%
                  </p>
                </div>
              </div>
            )}

            {uploadStatus === 'success' && (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-sm font-medium text-green-600">
                  Tải lên thành công!
                </p>
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-600">Lỗi tải lên</p>
                  {errorMessage && (
                    <p className="text-xs text-red-500 mt-1">{errorMessage}</p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setUploadStatus('idle');
                      setErrorMessage(null);
                    }}
                  >
                    Thử lại
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="url" className="mt-4">
          <div className="space-y-2">
            <Label htmlFor="video-url">URL Video</Label>
            <Input
              id="video-url"
              value={value}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://example.com/video.mp4"
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              Hỗ trợ: MP4, WebM, YouTube, Vimeo, Cloudflare Stream, Bunny.net
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Video Preview */}
      {value && isValidVideoUrl(value) && (
        <div className="relative rounded-lg overflow-hidden bg-black">
          <video
            src={value}
            controls
            className="w-full max-h-64 object-contain"
            onError={(e) => {
              console.log('Video preview error:', e);
            }}
          >
            <source src={value} type="video/mp4" />
            Trình duyệt không hỗ trợ video.
          </video>
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Current value display */}
      {value && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
          <Video className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="truncate flex-1 text-muted-foreground">{value}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default VideoUploader;

