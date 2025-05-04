import { strings } from '@/constants/strings';

interface VideoSummary {
  summary: string;
  keyPoints: string[];
  tags: string[];
}

interface VideoContent {
  description: string;
  captions?: string;
}

/**
 * 영상의 설명과 자막을 기반으로 요약을 생성합니다.
 */
export async function generateVideoSummary(
  videoContent: VideoContent
): Promise<VideoSummary> {
  if (!videoContent.description) {
    throw new Error(strings.services.openai.errors.descriptionRequired);
  }

  try {
    const response = await fetch('/api/openai/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(videoContent),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || strings.services.openai.errors.summaryGeneration);
    }

    const result = await response.json();
    return {
      summary: result.summary || strings.services.openai.errors.responseGeneration,
      keyPoints: Array.isArray(result.keyPoints) ? result.keyPoints : [],
      tags: Array.isArray(result.tags) ? result.tags : [],
    };
  } catch (error) {
    console.error(strings.services.openai.logs.apiError, error);
    throw new Error(strings.services.openai.errors.summaryGeneration);
  }
}
