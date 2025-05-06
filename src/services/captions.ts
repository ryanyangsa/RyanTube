import { strings } from '@/constants/strings';

interface CaptionTrack {
  languageCode: string;
  languageName: string;
  kind: string;
}

interface CaptionsResponse {
  tracks: CaptionTrack[];
  error?: string;
}

interface Caption {
  text: string;
  start: number;
  duration: number;
}

interface CaptionContentResponse {
  captions: Caption[];
  error?: string;
}

/**
 * 자막 목록을 가져옵니다.
 */
export async function getAvailableCaptions(videoId: string): Promise<CaptionsResponse> {
  try {
    const params = new URLSearchParams({
      videoId,
      type: 'captions',
    });

    const response = await fetch(`/api/youtube?${params}`);
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

    // 자막 목록 변환
    const tracks = data.items?.map((item: { snippet: { language: string; name: string; trackKind: string } }) => ({
      languageCode: item.snippet.language,
      languageName: item.snippet.name,
      kind: item.snippet.trackKind,
    })) || [];

    return { tracks };
  } catch (error) {
    console.error('Captions error:', error instanceof Error ? error.message : error);
    return {
      tracks: [],
      error: strings.services.youtube.captionsError,
    };
  }
}

/**
 * 자막 내용을 가져옵니다.
 */
export async function getCaptionContent(videoId: string): Promise<CaptionContentResponse> {
  try {
    const params = new URLSearchParams({
      videoId,
      type: 'caption',
    });

    const response = await fetch(`/api/youtube?${params}`);
    
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
    
    // 자막 텍스트를 줄 단위로 분리하고 빈 줄 제거
    const captions = content.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map((text, index) => ({
        text,
        start: index,  // 순서대로 인덱스 부여
        duration: 1,   // 기본 지속 시간 1초
      }));

    return { captions };
  } catch (error) {
    console.error('Caption content error:', error instanceof Error ? error.message : error);
    return {
      captions: [],
      error: strings.services.youtube.captionContentError,
    };
  }
}

export async function getCaptions(videoId: string): Promise<Caption[]> {
  try {
    const response = await getCaptionContent(videoId);
    return response.captions;
  } catch (error) {
    console.error('Error getting captions:', error);
    throw new Error('Failed to get captions');
  }
}

export async function extractCaptions(videoId: string): Promise<string> {
  try {
    const captions: Caption[] = await getCaptions(videoId);
    return captions.map((caption: Caption) => caption.text).join(' ');
  } catch (error) {
    console.error('Error extracting captions:', error);
    throw new Error('Failed to extract captions');
  }
}
