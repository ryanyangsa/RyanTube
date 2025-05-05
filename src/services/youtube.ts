import { strings } from '@/constants/strings';

interface YouTubeApiResponse<T> {
  items: T[];
  nextPageToken?: string;
  error?: string;
}

interface YouTubeVideoSnippet {
  title: string;
  description: string;
  thumbnails: {
    medium: {
      url: string;
    };
  };
}

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: YouTubeVideoSnippet;
}

interface YouTubeVideoItem {
  id: string;
  snippet: YouTubeVideoSnippet;
}

interface YouTubeCaptionItem {
  snippet: {
    language: string;
    name: string;
    trackKind: string;
  };
}

interface YouTubeCaptionsResponse {
  tracks: {
    languageCode: string;
    languageName: string;
    kind: string;
  }[];
  error?: string;
}

interface YouTubeCaptionContentResponse {
  captions: {
    text: string;
    start: number;
    duration: number;
  }[];
  error?: string;
}

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
}

/**
 * YouTube API 응답에서 할당량 초과 여부를 확인합니다.
 */
function checkQuotaExceeded(status: number, error?: string): string | null {
  if (status === 403 || status === 429) {
    const errorText = error?.toLowerCase() || '';
    if (errorText.includes('quota') || errorText.includes('limit')) {
      return strings.services.youtube.quotaExceeded;
    }
  }
  return null;
}

/**
 * YouTube API 에러를 처리합니다.
 */
function handleYouTubeError(error: unknown, defaultError: string): string {
  console.error('YouTube API error:', error instanceof Error ? error.message : error);
  return error instanceof Error ? error.message : defaultError;
}

/**
 * 유튜브 API를 통해 동영상을 검색합니다.
 */
export async function searchVideos(
  query: string,
  pageToken?: string
): Promise<YouTubeApiResponse<YouTubeSearchItem>> {
  try {
    const params = new URLSearchParams({
      q: query,
      type: 'search',
      ...(pageToken && { pageToken }),
    });

    const response = await fetch(`/api/youtube?${params}`);
    const data = await response.json();

    if (!response.ok) {
      const quotaError = checkQuotaExceeded(response.status, data.error);
      if (quotaError) {
        return { items: [], error: quotaError };
      }
      return { items: [], error: data.error || strings.services.youtube.apiError };
    }

    return {
      items: data.items,
      nextPageToken: data.nextPageToken,
    };
  } catch (error) {
    return {
      items: [],
      error: handleYouTubeError(error, strings.services.youtube.searchError),
    };
  }
}

/**
 * 특정 동영상의 상세 정보를 조회합니다.
 */
export async function getVideoDetails(
  videoId: string,
  options?: { signal?: AbortSignal }
): Promise<YouTubeVideo | null> {
  try {
    const response = await fetch(
      `/api/youtube?videoId=${videoId}&type=details`,
      { signal: options?.signal }
    );
    const data: YouTubeApiResponse<YouTubeVideoItem> = await response.json();

    if (!response.ok) {
      const quotaError = checkQuotaExceeded(response.status, data.error);
      if (quotaError) {
        throw new Error(quotaError);
      }
      throw new Error(data.error || strings.services.youtube.apiError);
    }

    if (!data.items || data.items.length === 0) {
      return null;
    }

    const item = data.items[0];
    return {
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium.url,
    };
  } catch (error) {
    throw new Error(handleYouTubeError(error, strings.services.youtube.videoDetailsError));
  }
}

/**
 * 특정 동영상의 자막을 조회합니다.
 */
export async function getAvailableCaptions(
  videoId: string,
  options?: { signal?: AbortSignal }
): Promise<YouTubeCaptionsResponse> {
  try {
    const response = await fetch(
      `/api/youtube?videoId=${videoId}&type=captions`,
      { signal: options?.signal }
    );
    const data: YouTubeApiResponse<YouTubeCaptionItem> = await response.json();

    if (!response.ok) {
      const quotaError = checkQuotaExceeded(response.status, data.error);
      if (quotaError) {
        return { tracks: [], error: quotaError };
      }
      return { tracks: [], error: data.error || strings.services.youtube.captionsError };
    }

    return {
      tracks: data.items?.map(item => ({
        languageCode: item.snippet.language,
        languageName: item.snippet.name,
        kind: item.snippet.trackKind,
      })) || [],
    };
  } catch (error) {
    return {
      tracks: [],
      error: handleYouTubeError(error, strings.services.youtube.captionsError),
    };
  }
}

/**
 * 특정 동영상의 자막 내용을 조회합니다.
 */
export async function getCaptionContent(
  videoId: string,
  options?: { signal?: AbortSignal }
): Promise<YouTubeCaptionContentResponse> {
  try {
    const response = await fetch(
      `/api/youtube?videoId=${videoId}&type=caption_content`,
      { signal: options?.signal }
    );
    
    if (!response.ok) {
      const quotaError = checkQuotaExceeded(response.status);
      if (quotaError) {
        return {
          captions: [],
          error: quotaError,
        };
      }
      const errorData = await response.json().catch(() => null);
      return {
        captions: [],
        error: errorData?.error || strings.services.youtube.captionContentError,
      };
    }

    const content = await response.text();
    const captions = content.split('\n\n')
      .filter(block => block.trim())
      .map(block => {
        const lines = block.split('\n');
        if (lines.length < 3) return null;
        
        const timeRange = lines[0].split(' --> ');
        const startTime = timeToSeconds(timeRange[0]);
        const endTime = timeToSeconds(timeRange[1]);
        
        return {
          text: lines.slice(1).join('\n'),
          start: startTime,
          duration: endTime - startTime,
        };
      })
      .filter((caption): caption is NonNullable<typeof caption> => caption !== null);

    return { captions };
  } catch (error) {
    return {
      captions: [],
      error: handleYouTubeError(error, strings.services.youtube.captionContentError),
    };
  }
}

function timeToSeconds(timeStr: string): number {
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}
