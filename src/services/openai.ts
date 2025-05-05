import { strings } from '@/constants/strings';

export interface VideoContent {
  title: string;
  description: string;
  captions?: string;
}

export interface VideoSummary {
  summary: string;
  keyPoints: string[];
  topicTags: string[];
}

/**
 * 영상의 설명과 자막을 기반으로 요약을 생성합니다.
 */
export async function generateVideoSummary(
  content: VideoContent,
  options?: { signal?: AbortSignal }
): Promise<VideoSummary> {
  if (!content.description) {
    throw new Error(strings.services.openai.error);
  }

  try {
    const response = await fetch('/api/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(content),
      signal: options?.signal
    });

    if (!response.ok) {
      throw new Error(strings.services.openai.error);
    }

    const data = await response.json();
    return {
      summary: data.summary || strings.services.openai.error,
      keyPoints: Array.isArray(data.keyPoints) ? data.keyPoints : [],
      topicTags: Array.isArray(data.topicTags) ? data.topicTags : [],
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error(strings.services.openai.error);
  }
}
