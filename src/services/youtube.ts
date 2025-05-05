import { strings } from '@/constants/strings';

interface YouTubeSearchResponse {
  items: {
    id: { videoId: string };
    snippet: {
      title: string;
      description: string;
      thumbnails: {
        medium: { url: string };
      };
    };
  }[];
  nextPageToken?: string;
  error?: string;
}

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
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

/**
 * 유튜브 API를 통해 동영상을 검색합니다.
 */
export async function searchVideos(query: string, pageToken?: string): Promise<YouTubeSearchResponse> {
  try {
    const params = new URLSearchParams({
      q: query,
      type: 'search',
      ...(pageToken && { pageToken }),
    });

    const response = await fetch(`/api/youtube?${params}`);
    const data = await response.json();

    if (!response.ok) {
      // 할당량 초과 체크
      if (response.status === 403 || response.status === 429) {
        const error = data.error?.toLowerCase() || '';
        if (error.includes('quota') || error.includes('limit')) {
          return {
            items: [],
            error: strings.services.youtube.quotaExceeded,
          };
        }
      }

      return {
        items: [],
        error: data.error || strings.services.youtube.apiError,
      };
    }

    return {
      items: data.items,
      nextPageToken: data.nextPageToken,
    };
  } catch (error) {
    console.error('Search error:', error instanceof Error ? error.message : error);
    return {
      items: [],
      error: strings.services.youtube.searchError,
    };
  }
}

/**
 * 특정 동영상의 상세 정보를 조회합니다.
 */
export async function getVideoDetails(videoId: string, options?: { signal?: AbortSignal }): Promise<YouTubeVideo | null> {
  try {
    const response = await fetch(
      `/api/youtube?videoId=${videoId}&type=details`,
      { signal: options?.signal }
    );
    const data = await response.json();

    if (!response.ok) {
      // 할당량 초과 체크
      if (response.status === 403 || response.status === 429) {
        const error = data.error?.toLowerCase() || '';
        if (error.includes('quota') || error.includes('limit')) {
          throw new Error(strings.services.youtube.quotaExceeded);
        }
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
    console.error('Video details error:', error instanceof Error ? error.message : error);
    throw error;
  }
}

/**
 * 특정 동영상의 자막을 조회합니다.
 */
export async function getAvailableCaptions(videoId: string, options?: { signal?: AbortSignal }): Promise<YouTubeCaptionsResponse> {
  try {
    const response = await fetch(
      `/api/youtube?videoId=${videoId}&type=captions`,
      { signal: options?.signal }
    );
    const data = await response.json();

    if (!response.ok) {
      // 할당량 초과 체크
      if (response.status === 403 || response.status === 429) {
        const error = data.error?.toLowerCase() || '';
        if (error.includes('quota') || error.includes('limit')) {
          return {
            tracks: [],
            error: strings.services.youtube.quotaExceeded,
          };
        }
      }

      return {
        tracks: [],
        error: data.error || strings.services.youtube.captionsError,
      };
    }

    return {
      tracks: data.items?.map((item: any) => ({
        languageCode: item.snippet.language,
        languageName: item.snippet.name,
        kind: item.snippet.trackKind,
      })) || [],
    };
  } catch (error) {
    console.error('Captions error:', error instanceof Error ? error.message : error);
    return {
      tracks: [],
      error: strings.services.youtube.captionsError,
    };
  }
}

/**
 * 특정 동영상의 자막 내용을 조회합니다.
 */
export async function getCaptionContent(videoId: string, options?: { signal?: AbortSignal }): Promise<YouTubeCaptionContentResponse> {
  try {
    const response = await fetch(
      `/api/youtube?videoId=${videoId}&type=caption_content`,
      { signal: options?.signal }
    );
    
    if (!response.ok) {
      // 할당량 초과 체크
      if (response.status === 403 || response.status === 429) {
        const error = await response.text();
        if (error.toLowerCase().includes('quota')) {
          return {
            captions: [],
            error: strings.services.youtube.quotaExceeded,
          };
        }
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
    console.error('Caption content error:', error instanceof Error ? error.message : error);
    return {
      captions: [],
      error: strings.services.youtube.captionContentError,
    };
  }
}

function timeToSeconds(timeStr: string): number {
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}
