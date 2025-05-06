import { strings } from '@/constants/strings';
import { getSubtitles } from 'youtube-caption-extractor';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  try {
    if (!YOUTUBE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'YouTube API key is not configured' }),
        { status: 500 }
      );
    }

    switch (type) {
      case 'search':
        return handleSearch(searchParams);
      case 'details':
        return handleVideoDetails(searchParams);
      case 'captions':
        return handleCaptions(searchParams);
      case 'caption': {
        const videoId = searchParams.get('videoId');
        if (!videoId) {
          return new Response(
            JSON.stringify({ error: 'Video ID is required' }),
            { status: 400 }
          );
        }
        return handleCaptionContent(videoId);
      }
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid request type' }),
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      }),
      { status: 500 }
    );
  }
}

async function handleSearch(params: URLSearchParams) {
  const query = params.get('q');
  const pageToken = params.get('pageToken');

  if (!query) {
    return new Response(
      JSON.stringify({ error: 'Query parameter is required' }),
      { status: 400 }
    );
  }

  const searchParams = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    maxResults: '12',
    key: YOUTUBE_API_KEY!,
    ...(pageToken && { pageToken }),
  });

  const response = await fetch(
    `${YOUTUBE_API_BASE_URL}/search?${searchParams}`
  );
  const data = await response.json();

  if (!response.ok) {
    return new Response(
      JSON.stringify({ error: data.error?.message || strings.services.youtube.searchError }),
      { status: response.status }
    );
  }

  return new Response(JSON.stringify(data));
}

async function handleVideoDetails(params: URLSearchParams) {
  const videoId = params.get('videoId');

  if (!videoId) {
    return new Response(
      JSON.stringify({ error: 'Video ID is required' }),
      { status: 400 }
    );
  }

  const detailsParams = new URLSearchParams({
    part: 'snippet',
    id: videoId,
    key: YOUTUBE_API_KEY!,
  });

  const response = await fetch(
    `${YOUTUBE_API_BASE_URL}/videos?${detailsParams}`
  );
  const data = await response.json();

  if (!response.ok) {
    return new Response(
      JSON.stringify({ error: data.error?.message || strings.services.youtube.apiError }),
      { status: response.status }
    );
  }

  return new Response(JSON.stringify(data));
}

async function handleCaptions(params: URLSearchParams) {
  const videoId = params.get('videoId');

  if (!videoId) {
    return new Response(
      JSON.stringify({ error: 'Video ID is required' }),
      { status: 400 }
    );
  }

  const captionsParams = new URLSearchParams({
    part: 'snippet',
    videoId: videoId,
    key: YOUTUBE_API_KEY!,
  });

  const response = await fetch(
    `${YOUTUBE_API_BASE_URL}/captions?${captionsParams}`
  );
  const data = await response.json();

  if (!response.ok) {
    return new Response(
      JSON.stringify({ error: data.error?.message || strings.services.youtube.captionsError }),
      { status: response.status }
    );
  }

  return new Response(JSON.stringify(data));
}

/**
 * 자막 내용을 가져옵니다.
 */
async function handleCaptionContent(videoId: string): Promise<Response> {
  try {
    console.log('Fetching captions for videoId:', videoId);
    
    const subtitles = await getSubtitles({
      videoID: videoId,
      lang: 'ko'  // 한국어 자막 우선
    });

    if (!Array.isArray(subtitles)) {
      console.error('Unexpected subtitles format:', subtitles);
      return new Response(
        JSON.stringify({ error: 'Invalid subtitles format', details: subtitles }),
        { status: 500 }
      );
    }

    // 자막 텍스트만 추출하여 결합
    const captionText = subtitles
      .map(subtitle => subtitle.text.trim())
      .filter(text => text.length > 0)
      .join('\n');

    return new Response(captionText, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('Caption content error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', details: error }),
      { status: 500 }
    );
  }
}
