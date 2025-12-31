# Video Hosting and CDN Configuration Guide

This guide explains how to set up video hosting and CDN for the hoc10k application.

## Overview

The application supports multiple video hosting options:
1. **Supabase Storage** - Direct file storage (limited bandwidth)
2. **Cloudflare Stream** - Dedicated video streaming with adaptive bitrate
3. **Bunny.net CDN** - Cost-effective CDN with video transcoding
4. **YouTube/Vimeo** - Embed third-party videos
5. **Custom CDN** - Any CDN provider (AWS CloudFront, Cloudflare, etc.)

## Quick Start

### Option 1: Supabase Storage (Simple, for testing)

1. Create a storage bucket for videos:
```sql
-- Run in Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true);
```

2. Upload videos via Supabase Dashboard or API.

3. Video URLs will be: `https://<project>.supabase.co/storage/v1/object/public/videos/<filename>`

### Option 2: Cloudflare Stream (Recommended for Production)

1. Sign up at https://dash.cloudflare.com
2. Enable Cloudflare Stream
3. Get your Account ID and API Token
4. Set environment variables (see below)

### Option 3: Bunny.net (Cost-effective)

1. Sign up at https://bunny.net
2. Create a Video Library or Pull Zone
3. Get your API Key and Library ID
4. Set environment variables (see below)

## Environment Variables

Add these to your Supabase secrets:

```bash
# Cloudflare Stream
supabase secrets set CLOUDFLARE_ACCOUNT_ID="your-account-id"
supabase secrets set CLOUDFLARE_API_TOKEN="your-api-token"
supabase secrets set CLOUDFLARE_STREAM_SUBDOMAIN="customer-xxxxx.cloudflarestream.com"

# Bunny.net
supabase secrets set BUNNY_API_KEY="your-api-key"
supabase secrets set BUNNY_LIBRARY_ID="your-library-id"
supabase secrets set BUNNY_CDN_HOSTNAME="your-pullzone.b-cdn.net"

# Generic CDN
supabase secrets set VIDEO_CDN_BASE_URL="https://your-cdn.example.com/videos"
```

## Frontend Configuration

Add to your `.env` file:

```env
# Video CDN Configuration
VITE_VIDEO_CDN_PROVIDER="cloudflare"  # Options: supabase, cloudflare, bunny, youtube, custom
VITE_VIDEO_CDN_BASE_URL="https://customer-xxxxx.cloudflarestream.com"
```

## Code Integration

The `videoConfig.ts` utility handles video URL generation based on your configuration.

### Usage Examples:

```typescript
import { getVideoUrl, getVideoEmbedUrl } from '@/lib/videoConfig';

// Get streaming URL
const videoUrl = getVideoUrl('video-id-or-path');

// Get embed URL for iframe
const embedUrl = getVideoEmbedUrl('video-id');

// Check if video is external (YouTube, Vimeo)
const isExternal = isExternalVideo(url);
```

## Supported Video Formats

| Provider | Supported Formats | Adaptive Bitrate | DRM |
|----------|------------------|------------------|-----|
| Supabase Storage | MP4, WebM | ❌ | ❌ |
| Cloudflare Stream | All (transcoded) | ✅ | ✅ |
| Bunny.net | All (transcoded) | ✅ | ✅ |
| YouTube | - | ✅ | - |
| Vimeo | - | ✅ | ✅ |

## Database Schema

Videos are stored in the `program_lessons` table:

```sql
video_url TEXT  -- URL to video file or video ID
```

For CDN providers, store the video ID (not full URL):
- Cloudflare: `abc123def456`
- Bunny: `12345678-abcd-1234`
- YouTube: `dQw4w9WgXcQ`

## Upload Workflow

### For Cloudflare Stream:

1. Create a Supabase Edge Function for upload:
```bash
supabase functions deploy video-upload
```

2. Use the upload function from your admin panel.

### For Bunny.net:

1. Upload to Bunny via their API or dashboard
2. Store the video ID in your database
3. Videos are automatically transcoded

## Security Considerations

1. **Signed URLs**: For paid content, use signed URLs with expiration
2. **Access Control**: Check user purchases before serving video
3. **Hotlink Protection**: Enable on your CDN to prevent embedding elsewhere
4. **Geographic Restrictions**: Configure if needed for licensing

## Performance Tips

1. Use adaptive bitrate streaming (HLS/DASH) for better UX
2. Enable lazy loading for video thumbnails
3. Preload video metadata only, not full video
4. Consider using video placeholder images
5. Implement bandwidth detection for quality selection

## Cost Comparison (Approximate)

| Provider | Storage | Bandwidth | Notes |
|----------|---------|-----------|-------|
| Supabase | $0.021/GB | $0.09/GB | Limited for video |
| Cloudflare Stream | $5/1000 min | $1/1000 min | Best quality |
| Bunny.net | $0.01/GB | $0.01/GB | Very affordable |
| AWS CloudFront | $0.023/GB | $0.085/GB | Enterprise-grade |

## Troubleshooting

### Videos not playing:
- Check CORS settings on your CDN
- Verify video format is supported
- Check browser console for errors

### Slow loading:
- Ensure CDN is configured with proper caching
- Use lower resolution for previews
- Check CDN geographic coverage

### 403 Forbidden:
- Check signed URL expiration
- Verify access control settings
- Check referer/hotlink protection

