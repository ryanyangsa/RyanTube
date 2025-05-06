'use client';

import { useState, useCallback } from 'react';
import { searchVideos } from '@/services/youtube';
import SearchBar from '@/components/SearchBar';
import VideoCard from '@/components/VideoCard';
import SummaryModal from '@/components/SummaryModal';
import InfiniteScroll from 'react-infinite-scroll-component';
import { strings } from '@/constants/strings';

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

export default function Home() {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const searchHandler = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const response = await searchVideos(searchQuery);
      if (response.error) {
        setError(response.error);
        setVideos([]);
      } else {
        setVideos(response.items);
        setNextPageToken(response.nextPageToken);
      }
    } catch {
      setError(strings.search.error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!query || loading) return;

    try {
      const response = await searchVideos(query, nextPageToken);
      if (response.error) {
        setError(response.error);
      } else {
        setVideos(prev => [...prev, ...response.items]);
        setNextPageToken(response.nextPageToken);
      }
    } catch {
      setError(strings.search.error);
    }
  }, [query, nextPageToken, loading]);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    searchHandler(searchQuery);
  };

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedVideo(null);
  };

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-center mb-8">{strings.common.appName}</h1>
          <SearchBar onSearch={handleSearch} />

          {error && (
            <div className="text-center my-4 p-4 bg-red-50 text-red-600 rounded">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center my-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2">{strings.common.loading}</p>
            </div>
          ) : videos.length > 0 ? (
            <InfiniteScroll
              dataLength={videos.length}
              next={loadMore}
              hasMore={!!nextPageToken}
              loader={
                <div className="text-center my-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                </div>
              }
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-8"
            >
              {videos.map((video, index) => (
                <VideoCard
                  key={`${video.id.videoId}-${index}`}
                  video={video}
                  onSelect={() => handleVideoSelect(video)}
                />
              ))}
            </InfiniteScroll>
          ) : !loading && query && (
            <div className="text-center my-4">
              {strings.search.noResults}
            </div>
          )}

          {selectedVideo && (
            <SummaryModal
              isOpen={modalOpen}
              onClose={handleCloseModal}
              title={selectedVideo.snippet.title}
              thumbnail={selectedVideo.snippet.thumbnails.medium.url}
              videoId={selectedVideo.id.videoId}
            />
          )}
        </div>
      </div>
      <footer className="w-full py-4 text-center text-gray-600 bg-gray-50">
        <p>{strings.common.copyright}</p>
      </footer>
    </main>
  );
}
