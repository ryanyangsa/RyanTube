'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { generateVideoSummary } from '@/services/openai';
import { getVideoDetails } from '@/services/youtube';
import { getAvailableCaptions, getCaptionContent, combineCaptionText } from '@/services/captions';
import { strings } from '@/constants/strings';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  thumbnail: string;
  videoId: string;
}

interface Summary {
  summary: string;
  keyPoints: string[];
  tags: string[];
}

export default function SummaryModal({
  isOpen,
  onClose,
  title,
  thumbnail,
  videoId,
}: SummaryModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    if (isOpen) {
      generateSummary();
    }
  }, [isOpen]);

  const generateSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. 비디오 정보 가져오기
      const videoDetails = await getVideoDetails(videoId);
      if (!videoDetails) {
        throw new Error(strings.services.youtube.videoDetailsError);
      }

      // 2. 자막 정보 가져오기
      const captionsResponse = await getAvailableCaptions(videoId);
      let captionText = '';

      if (captionsResponse.error) {
        throw new Error(captionsResponse.error);
      }

      if (captionsResponse.tracks.length > 0) {
        // 한국어 자막 우선, 없으면 첫 번째 자막 사용
        const track = captionsResponse.tracks.find(t => t.languageCode === 'ko') || captionsResponse.tracks[0];
        const captionContent = await getCaptionContent(track.trackId);
        
        if (captionContent.error) {
          throw new Error(captionContent.error);
        }

        captionText = combineCaptionText(captionContent.captions);
      }

      // 3. 요약 생성
      const content = {
        title: videoDetails.snippet.title,
        description: videoDetails.snippet.description,
        captions: captionText,
      };

      const summaryResponse = await generateVideoSummary(content);
      setSummary(summaryResponse);
      setError(null);

    } catch (error) {
      console.error('Summary generation error:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(strings.services.youtube.apiError);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[3px] flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">{strings.summary.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <div className="relative aspect-video mb-4">
            <Image
              src={thumbnail}
              alt={title}
              fill
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <h3 className="text-lg font-semibold mb-2">{title}</h3>

          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 mb-4 flex items-center justify-center gap-2 w-full transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            {strings.summary.watchOnYoutube}
          </a>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2">{strings.summary.generating}</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={generateSummary}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {strings.common.retry}
            </button>
          </div>
        ) : summary && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">{strings.summary.summary}</h3>
              <p className="text-gray-700">{summary.summary}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">{strings.summary.keyPoints}</h3>
              <ul className="list-disc pl-5 text-gray-700">
                {summary.keyPoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">{strings.summary.tags}</h3>
              <div className="flex flex-wrap gap-2">
                {summary.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
