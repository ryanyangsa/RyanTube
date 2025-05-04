import { YouTubeVideo } from '@/services/youtube';
import Image from 'next/image';

interface VideoGridProps {
  videos: YouTubeVideo[];
  onVideoSelect: (video: YouTubeVideo) => void;
  error?: string | null;
}

export default function VideoGrid({ videos, onVideoSelect, error }: VideoGridProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-semibold mb-2">검색 오류</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        검색 결과가 없습니다.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {videos.map((video) => (
        <div
          key={video.id}
          className="cursor-pointer hover:scale-105 transition-transform duration-200"
        >
          <div className="relative aspect-video mb-2">
            <Image
              src={video.thumbnail}
              alt={video.title}
              fill
              className="object-cover rounded-lg"
              onClick={() => onVideoSelect(video)}
            />
          </div>
          <h3 className="font-semibold text-gray-800 line-clamp-2 mb-1">
            {video.title}
          </h3>
          <button
            onClick={() => onVideoSelect(video)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            시청하기
          </button>
        </div>
      ))}
    </div>
  );
}
