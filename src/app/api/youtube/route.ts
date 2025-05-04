import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/utils/rate-limit';
import { strings } from '@/constants/strings';

const limiter = rateLimit();

// YouTube API 키 확인
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

interface YouTubeErrorResponse {
  error: {
    code: number;
    message: string;
    errors?: Array<{
      message: string;
      domain: string;
      reason: string;
    }>;
  };
}

/**
 * YouTube API 응답의 에러를 처리합니다.
 */
async function handleYouTubeResponse(response: Response) {
  const data = await response.json();
  
  if (!response.ok) {
    // YouTube API 에러 응답 구조 확인
    const error = data.error || {};
    
    // 할당량 초과 체크
    if (response.status === 403 && 
        (error.errors?.some((e: any) => 
          e.reason === 'quotaExceeded' || 
          e.reason === 'dailyLimitExceeded' ||
          e.reason === 'quotaLimitExceeded'
        ) || 
        error.message?.toLowerCase().includes('quota'))) {
      return NextResponse.json(
        { error: strings.services.youtube.quotaExceeded },
        { status: 429 }
      );
    }

    // API 에러 메시지 전달
    return NextResponse.json(
      { error: error.message || strings.services.youtube.apiError },
      { status: response.status }
    );
  }

  return NextResponse.json(data);
}

/**
 * YouTube 동영상 검색 API
 */
export async function GET(request: NextRequest) {
  try {
    // API 키 확인
    if (!YOUTUBE_API_KEY) {
      return NextResponse.json(
        { error: strings.services.youtube.validation.apiKeyMissing },
        { status: 500 }
      );
    }

    // Rate limiting 체크
    try {
      await limiter.check(request, 10);
    } catch {
      return NextResponse.json(
        { error: strings.services.youtube.errors.rateLimitExceeded },
        { status: 429 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const pageToken = searchParams.get('pageToken');
    const type = searchParams.get('type') || 'search';
    const videoId = searchParams.get('videoId');
    const trackId = searchParams.get('trackId');

    // 요청 유형별 필수 파라미터 검증
    switch (type) {
      case 'search':
        if (!query) {
          return NextResponse.json(
            { error: strings.services.youtube.validation.queryRequired },
            { status: 400 }
          );
        }
        break;
      case 'details':
      case 'captions':
        if (!videoId) {
          return NextResponse.json(
            { error: strings.services.youtube.validation.videoIdRequired },
            { status: 400 }
          );
        }
        break;
      case 'caption':
        if (!trackId) {
          return NextResponse.json(
            { error: strings.services.youtube.validation.trackIdRequired },
            { status: 400 }
          );
        }
        break;
      default:
        return NextResponse.json(
          { error: strings.services.youtube.validation.invalidType },
          { status: 400 }
        );
    }

    // API 요청 실행
    let apiResponse: Response;

    switch (type) {
      case 'search': {
        const params = new URLSearchParams({
          key: YOUTUBE_API_KEY,
          part: 'snippet',
          maxResults: '10',
          type: 'video',
          q: query!,
          ...(pageToken && { pageToken }),
        });
        apiResponse = await fetch(`${YOUTUBE_API_BASE_URL}/search?${params}`);
        break;
      }
      case 'details': {
        const params = new URLSearchParams({
          key: YOUTUBE_API_KEY,
          part: 'snippet',
          id: videoId!,
        });
        apiResponse = await fetch(`${YOUTUBE_API_BASE_URL}/videos?${params}`);
        break;
      }
      case 'captions': {
        const params = new URLSearchParams({
          key: YOUTUBE_API_KEY,
          part: 'snippet',
          videoId: videoId!,
        });
        apiResponse = await fetch(`${YOUTUBE_API_BASE_URL}/captions?${params}`);
        break;
      }
      case 'caption': {
        apiResponse = await fetch(
          `${YOUTUBE_API_BASE_URL}/captions/${trackId}?key=${YOUTUBE_API_KEY}`,
          { headers: { 'Accept': 'text/xml' } }
        );
        break;
      }
      default:
        throw new Error(strings.services.youtube.validation.invalidType);
    }

    return handleYouTubeResponse(apiResponse);

  } catch (error) {
    console.error('YouTube API Error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: strings.services.youtube.apiError },
      { status: 500 }
    );
  }
}
