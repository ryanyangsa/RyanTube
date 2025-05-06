import Image from 'next/image';

interface Video {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      medium: { url: string };
    };
  };
}

interface VideoCardProps {
  video: Video;
  onSelect: () => void;
}

export default function VideoCard({ video, onSelect }: VideoCardProps) {
  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-transform hover:scale-105"
      onClick={onSelect}
    >
      <div className="relative w-full aspect-video">
        <Image
          src={video.snippet.thumbnails.medium.url}
          alt={video.snippet.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
          {video.snippet.title}
        </h3>
        <p className="text-gray-600 text-sm line-clamp-2">
          {video.snippet.description}
        </p>
      </div>
    </div>
  );
}
