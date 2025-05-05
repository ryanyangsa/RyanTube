import { Dialog } from '@headlessui/react';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import { generateVideoSummary } from '@/services/openai';
import { getVideoDetails } from '@/services/youtube';
import { getAvailableCaptions, getCaptionContent } from '@/services/captions';
import { strings } from '@/constants/strings';

interface Summary {
  summary: string;
  keyPoints: string[];
  topicTags: string[];
}

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  thumbnail: string;
  videoId: string;
}

export default function SummaryModal({
  isOpen,
  onClose,
  title,
  thumbnail,
  videoId,
}: SummaryModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const isGeneratingSummary = useRef(false);

  const generateSummary = useCallback(async () => {
    if (!videoId || isGeneratingSummary.current) return;
    
    try {
      isGeneratingSummary.current = true;
      setLoading(true);
      setError(null);

      // 1. 비디오 정보 가져오기
      const videoDetails = await getVideoDetails(videoId);
      if (!videoDetails) {
        throw new Error(strings.services.youtube.videoDetailsError);
      }

      // 2. 자막 정보 가져오기
      const captionsResponse = await getAvailableCaptions(videoId);

      let captionText = '';
      if (!captionsResponse.error) {
        // 한국어 자막 우선, 없으면 영어 자막 사용
        const koreanTrack = captionsResponse.tracks.find(track => track.languageCode === 'ko');
        const englishTrack = captionsResponse.tracks.find(track => track.languageCode === 'en');
        const selectedTrack = koreanTrack || englishTrack;

        if (selectedTrack) {
          const captionContent = await getCaptionContent(videoId);
          if (!captionContent.error && captionContent.captions.length > 0) {
            captionText = captionContent.captions
              .map(caption => caption.text)
              .join(' ');
          }
        }
      }

      // 3. 요약 생성
      const summaryResponse = await generateVideoSummary({
        title: videoDetails.title,
        description: videoDetails.description,
        captions: captionText,
      });

      setSummary(summaryResponse);
    } catch (error) {
      console.error('Summary generation error:', error);
      setError(error instanceof Error ? error.message : strings.services.youtube.apiError);
    } finally {
      setLoading(false);
      isGeneratingSummary.current = false;
    }
  }, [videoId]);

  useEffect(() => {
    if (isOpen && !summary && !loading && !error && !isGeneratingSummary.current) {
      generateSummary();
    }
  }, [isOpen, summary, loading, error, generateSummary]);

  const handleClose = useCallback(() => {
    onClose();
    // 모달이 완전히 닫힌 후에 상태 초기화
    setTimeout(() => {
      setSummary(null);
      setError(null);
    }, 300);
  }, [onClose]);

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl bg-white rounded-lg shadow-xl">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <Dialog.Title className="text-xl font-semibold pr-8">
                {title}
              </Dialog.Title>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="relative w-full aspect-video mb-4">
              <Image
                src={thumbnail}
                alt={title}
                fill
                className="object-cover rounded"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                <span className="ml-3">{strings.summary.loading}</span>
              </div>
            ) : error ? (
              <div className="text-red-500 py-4">{error}</div>
            ) : summary ? (
              <div>
                <p className="text-gray-700 whitespace-pre-wrap mb-4">
                  {summary.summary}
                </p>
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">주요 내용</h3>
                  <ul className="list-disc pl-5">
                    {summary.keyPoints.map((point, index) => (
                      <li key={index} className="text-gray-700">{point}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {summary.topicTags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <a
                    href={`https://www.youtube.com/watch?v=${videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    YouTube에서 시청하기
                  </a>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    닫기
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
