import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Video, Loader2, Check, AlertCircle, Link, StopCircle, Clock, FileVideo } from 'lucide-react';
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
  onDurationDetected?: (duration: string) => void;
  onThumbnailGenerated?: (thumbnailUrl: string) => void;
  disabled?: boolean;
  className?: string;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export function VideoUploader({
  value,
  onChange,
  onUploadStart,
  onUploadEnd,
  onDurationDetected,
  onThumbnailGenerated,
  disabled = false,
  className,
}: VideoUploaderProps) {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(value ? 'url' : 'upload');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileSize, setUploadedFileSize] = useState<number>(0);
  const [detectedDuration, setDetectedDuration] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
  const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

  // Format bytes to human readable
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format seconds to readable duration
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours} giờ ${minutes} phút`;
    } else if (minutes > 0) {
      return `${minutes} phút ${secs} giây`;
    } else {
      return `${secs} giây`;
    }
  };

  // Extract video metadata (duration)
  const extractVideoMetadata = (file: File): Promise<{ duration: number }> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve({ duration: video.duration });
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Could not read video metadata'));
      };

      video.src = URL.createObjectURL(file);
    });
  };

  // Generate thumbnail from video
  const generateThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      video.onloadeddata = () => {
        // Seek to 10% of the video or 1 second, whichever is smaller
        video.currentTime = Math.min(video.duration * 0.1, 1);
      };

      video.onseeked = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (blob) {
            // Upload thumbnail to storage
            uploadThumbnail(blob).then(resolve).catch(reject);
          } else {
            reject(new Error('Could not generate thumbnail'));
          }
          URL.revokeObjectURL(video.src);
        }, 'image/jpeg', 0.8);
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Could not load video for thumbnail'));
      };

      video.src = URL.createObjectURL(file);
    });
  };

  // Upload thumbnail to storage
  const uploadThumbnail = async (blob: Blob): Promise<string> => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileName = `thumbnails/${timestamp}-${randomString}.jpg`;

    const { data, error } = await supabase.storage
      .from('videos')
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/jpeg',
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('videos')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

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
    setUploadedFileName(file.name);
    setUploadedFileSize(file.size);
    onUploadStart?.();

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      // Extract video metadata first
      let videoDuration: number | null = null;
      try {
        const metadata = await extractVideoMetadata(file);
        videoDuration = metadata.duration;
        const durationStr = formatDuration(metadata.duration);
        setDetectedDuration(durationStr);
        onDurationDetected?.(durationStr);
      } catch (metadataError) {
        console.warn('Could not extract video metadata:', metadataError);
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const extension = file.name.split('.').pop() || 'mp4';
      const fileName = `videos/${timestamp}-${randomString}.${extension}`;

      // Use XMLHttpRequest for progress tracking
      const uploadPromise = new Promise<{ path: string }>((resolve, reject) => {
        const { data: { session } } = supabase.auth.getSession() as any;

        // Get the storage URL
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jxbicrhmwlxquyjhagcs.supabase.co';
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4Ymljcmhtd2x4cXV5amhhZ2NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUxMzQ2MTgsImV4cCI6MjA1MDcxMDYxOH0.G_6_tF4cYyf5qXvRVBXUAdmM8Qv1gntdPbgUQFiLzZE';

        const xhr = new XMLHttpRequest();
        const url = `${supabaseUrl}/storage/v1/object/videos/${fileName}`;

        xhr.open('POST', url);
        xhr.setRequestHeader('Authorization', `Bearer ${supabaseKey}`);
        xhr.setRequestHeader('x-upsert', 'false');

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve({ path: response.Key || fileName });
            } catch {
              resolve({ path: fileName });
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              if (error.message?.includes('Bucket not found')) {
                reject(new Error('Video storage chưa được cấu hình. Vui lòng chạy migration SQL.'));
              } else {
                reject(new Error(error.message || 'Upload failed'));
              }
            } catch {
              reject(new Error('Upload failed with status: ' + xhr.status));
            }
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error occurred'));
        };

        xhr.onabort = () => {
          reject(new Error('Upload cancelled'));
        };

        // Store xhr for potential cancellation
        (abortControllerRef.current as any).xhr = xhr;

        xhr.send(file);
      });

      const uploadResult = await uploadPromise;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(uploadResult.path);

      setUploadProgress(100);
      setUploadStatus('success');
      onChange(urlData.publicUrl);
      toast.success('Tải video lên thành công!');

      // Try to generate thumbnail in background
      try {
        const thumbnailUrl = await generateThumbnail(file);
        onThumbnailGenerated?.(thumbnailUrl);
        toast.success('Đã tạo thumbnail tự động!');
      } catch (thumbError) {
        console.warn('Could not generate thumbnail:', thumbError);
      }

    } catch (error) {
      console.error('Upload error:', error);
      const message = error instanceof Error ? error.message : 'Lỗi khi tải video lên';

      if (message !== 'Upload cancelled') {
        setErrorMessage(message);
        setUploadStatus('error');
        toast.error(message);
      } else {
        setUploadStatus('idle');
        setUploadProgress(0);
        toast.info('Đã hủy tải lên');
      }
    } finally {
      abortControllerRef.current = null;
      onUploadEnd?.();
    }
  };

  // Cancel upload
  const cancelUpload = () => {
    if (abortControllerRef.current) {
      const xhr = (abortControllerRef.current as any).xhr;
      if (xhr) {
        xhr.abort();
      }
      abortControllerRef.current.abort();
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
    setUploadedFileName('');
    setUploadedFileSize(0);
    setDetectedDuration('');
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
              <div className="space-y-4 pointer-events-auto">
                <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
                <div>
                  <p className="text-sm font-medium">Đang tải lên...</p>
                  {uploadedFileName && (
                    <div className="flex items-center justify-center gap-2 mt-1 text-xs text-muted-foreground">
                      <FileVideo className="w-3 h-3" />
                      <span className="truncate max-w-[200px]">{uploadedFileName}</span>
                      <span>({formatFileSize(uploadedFileSize)})</span>
                    </div>
                  )}
                  <Progress value={uploadProgress} className="mt-2 h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {uploadProgress}%
                  </p>
                  {detectedDuration && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" />
                      Thời lượng: {detectedDuration}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 gap-1"
                    onClick={cancelUpload}
                  >
                    <StopCircle className="w-4 h-4" />
                    Hủy tải lên
                  </Button>
                </div>
              </div>
            )}

            {uploadStatus === 'success' && (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-600">
                    Tải lên thành công!
                  </p>
                  {uploadedFileName && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {uploadedFileName} ({formatFileSize(uploadedFileSize)})
                    </p>
                  )}
                  {detectedDuration && (
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" />
                      {detectedDuration}
                    </p>
                  )}
                </div>
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

