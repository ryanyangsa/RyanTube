import { strings } from '@/constants/strings';

interface CaptionTrack {
  trackId: string;
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
    const tracks = data.items?.map((item: any) => ({
      trackId: item.id,
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
export async function getCaptionContent(trackId: string): Promise<CaptionContentResponse> {
  try {
    const params = new URLSearchParams({
      trackId,
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

      return {
        captions: [],
        error: strings.services.youtube.captionContentError,
      };
    }

    const xmlText = await response.text();
    const captions = parseXMLCaptions(xmlText);

    return { captions };
  } catch (error) {
    console.error('Caption content error:', error instanceof Error ? error.message : error);
    return {
      captions: [],
      error: strings.services.youtube.captionContentError,
    };
  }
}

/**
 * XML 형식의 자막을 파싱합니다.
 */
function parseXMLCaptions(xmlText: string): Caption[] {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const textNodes = xmlDoc.getElementsByTagName('text');
    
    return Array.from(textNodes).map(node => ({
      text: node.textContent || '',
      start: parseFloat(node.getAttribute('start') || '0'),
      duration: parseFloat(node.getAttribute('dur') || '0'),
    }));
  } catch (error) {
    console.error('Caption parse error:', error instanceof Error ? error.message : error);
    return [];
  }
}

/**
 * 자막 텍스트를 결합합니다.
 */
export function combineCaptionText(captions: Caption[]): string {
  return captions
    .map(caption => caption.text.trim())
    .filter(text => text.length > 0)
    .join(' ');
}
