/**
 * Video Hosting and CDN Configuration
 *
 * Supports multiple video providers:
 * - supabase: Supabase Storage
 * - cloudflare: Cloudflare Stream
 * - bunny: Bunny.net CDN
 * - youtube: YouTube embedded videos
 * - vimeo: Vimeo embedded videos
 * - custom: Custom CDN URL
 */

export type VideoProvider = 'supabase' | 'cloudflare' | 'bunny' | 'youtube' | 'vimeo' | 'custom';

interface VideoConfig {
  provider: VideoProvider;
  baseUrl: string;
  supabaseUrl?: string;
}

// Get configuration from environment variables
const getVideoConfig = (): VideoConfig => {
  const provider = (import.meta.env.VITE_VIDEO_CDN_PROVIDER as VideoProvider) || 'supabase';
  const baseUrl = import.meta.env.VITE_VIDEO_CDN_BASE_URL || '';
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';

  return { provider, baseUrl, supabaseUrl };
};

/**
 * Check if a URL is from an external video provider (YouTube, Vimeo)
 */
export const isExternalVideo = (url: string): boolean => {
  if (!url) return false;
  return (
    url.includes('youtube.com') ||
    url.includes('youtu.be') ||
    url.includes('vimeo.com') ||
    url.includes('player.vimeo.com')
  );
};

/**
 * Check if URL is a YouTube video
 */
export const isYouTubeVideo = (url: string): boolean => {
  if (!url) return false;
  return url.includes('youtube.com') || url.includes('youtu.be');
};

/**
 * Check if URL is a Vimeo video
 */
export const isVimeoVideo = (url: string): boolean => {
  if (!url) return false;
  return url.includes('vimeo.com');
};

/**
 * Extract YouTube video ID from URL
 */
export const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;

  // Handle youtu.be short URLs
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return shortMatch[1];

  // Handle youtube.com URLs
  const longMatch = url.match(/[?&]v=([^?&]+)/);
  if (longMatch) return longMatch[1];

  // Handle embed URLs
  const embedMatch = url.match(/embed\/([^?&]+)/);
  if (embedMatch) return embedMatch[1];

  return null;
};

/**
 * Extract Vimeo video ID from URL
 */
export const getVimeoVideoId = (url: string): string | null => {
  if (!url) return null;

  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
};

/**
 * Get the video streaming URL based on provider configuration
 *
 * @param videoIdOrUrl - Video ID or full URL
 * @returns Full video URL for streaming
 */
export const getVideoUrl = (videoIdOrUrl: string): string => {
  if (!videoIdOrUrl) return '';

  // If it's already a full URL, return as-is
  if (videoIdOrUrl.startsWith('http://') || videoIdOrUrl.startsWith('https://')) {
    return videoIdOrUrl;
  }

  const config = getVideoConfig();

  switch (config.provider) {
    case 'supabase':
      return `${config.supabaseUrl}/storage/v1/object/public/videos/${videoIdOrUrl}`;

    case 'cloudflare':
      // Cloudflare Stream format: https://customer-xxx.cloudflarestream.com/{video-id}/manifest/video.m3u8
      return `${config.baseUrl}/${videoIdOrUrl}/manifest/video.m3u8`;

    case 'bunny':
      // Bunny.net format: https://xxx.b-cdn.net/{video-id}/playlist.m3u8
      return `${config.baseUrl}/${videoIdOrUrl}/playlist.m3u8`;

    case 'youtube':
      return `https://www.youtube.com/watch?v=${videoIdOrUrl}`;

    case 'vimeo':
      return `https://vimeo.com/${videoIdOrUrl}`;

    case 'custom':
    default:
      return config.baseUrl ? `${config.baseUrl}/${videoIdOrUrl}` : videoIdOrUrl;
  }
};

/**
 * Get embed URL for iframe embedding
 *
 * @param videoIdOrUrl - Video ID or full URL
 * @returns Embed URL for iframe
 */
export const getVideoEmbedUrl = (videoIdOrUrl: string): string => {
  if (!videoIdOrUrl) return '';

  // Check if it's a YouTube video
  if (isYouTubeVideo(videoIdOrUrl)) {
    const videoId = getYouTubeVideoId(videoIdOrUrl) || videoIdOrUrl;
    return `https://www.youtube.com/embed/${videoId}`;
  }

  // Check if it's a Vimeo video
  if (isVimeoVideo(videoIdOrUrl)) {
    const videoId = getVimeoVideoId(videoIdOrUrl) || videoIdOrUrl;
    return `https://player.vimeo.com/video/${videoId}`;
  }

  const config = getVideoConfig();

  switch (config.provider) {
    case 'cloudflare':
      // Cloudflare Stream iframe embed
      const cfVideoId = videoIdOrUrl.includes('/') ? videoIdOrUrl.split('/')[0] : videoIdOrUrl;
      return `${config.baseUrl}/${cfVideoId}/iframe`;

    case 'bunny':
      // Bunny.net iframe embed
      return `${config.baseUrl}/embed/${videoIdOrUrl}`;

    default:
      // For direct MP4 files, return the URL directly
      return getVideoUrl(videoIdOrUrl);
  }
};

/**
 * Get video thumbnail URL
 *
 * @param videoIdOrUrl - Video ID or full URL
 * @param time - Thumbnail time position (for supported providers)
 * @returns Thumbnail URL
 */
export const getVideoThumbnailUrl = (videoIdOrUrl: string, time: number = 0): string => {
  if (!videoIdOrUrl) return '/placeholder.svg';

  // YouTube thumbnail
  if (isYouTubeVideo(videoIdOrUrl)) {
    const videoId = getYouTubeVideoId(videoIdOrUrl);
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
  }

  // Vimeo thumbnail requires API call, return placeholder
  if (isVimeoVideo(videoIdOrUrl)) {
    return '/placeholder.svg';
  }

  const config = getVideoConfig();

  switch (config.provider) {
    case 'cloudflare':
      // Cloudflare Stream thumbnails
      const cfVideoId = videoIdOrUrl.includes('/') ? videoIdOrUrl.split('/')[0] : videoIdOrUrl;
      return `${config.baseUrl}/${cfVideoId}/thumbnails/thumbnail.jpg?time=${time}s`;

    case 'bunny':
      // Bunny.net thumbnails
      return `${config.baseUrl}/${videoIdOrUrl}/thumbnail.jpg`;

    default:
      return '/placeholder.svg';
  }
};

/**
 * Determine the best video player type based on URL
 */
export type VideoPlayerType = 'html5' | 'hls' | 'youtube' | 'vimeo' | 'iframe';

export const getVideoPlayerType = (videoUrl: string): VideoPlayerType => {
  if (!videoUrl) return 'html5';

  if (isYouTubeVideo(videoUrl)) return 'youtube';
  if (isVimeoVideo(videoUrl)) return 'vimeo';

  // Check for HLS streams
  if (videoUrl.includes('.m3u8')) return 'hls';

  // Check for iframe embed URLs
  if (videoUrl.includes('/iframe') || videoUrl.includes('/embed')) return 'iframe';

  return 'html5';
};

/**
 * Video configuration for current provider
 */
export const videoConfig = {
  getVideoUrl,
  getVideoEmbedUrl,
  getVideoThumbnailUrl,
  getVideoPlayerType,
  isExternalVideo,
  isYouTubeVideo,
  isVimeoVideo,
  getYouTubeVideoId,
  getVimeoVideoId,
};

export default videoConfig;

