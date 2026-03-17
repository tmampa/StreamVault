import { useEffect, useRef } from 'react';
import { getMovieEmbedUrl, getTvEmbedUrl, PLAYER_COLOR } from '../api/vidking';

export default function VideoPlayer({ tmdbId, mediaType, season, episode }) {
  const iframeRef = useRef(null);

  const embedUrl =
    mediaType === 'movie'
      ? getMovieEmbedUrl(tmdbId, { color: PLAYER_COLOR, autoplay: true })
      : getTvEmbedUrl(tmdbId, season, episode, {
          color: PLAYER_COLOR,
          autoplay: true,
          episodeSelector: true,
          nextEpisodeBtn: true,
        });

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== 'https://www.vidking.net') return;
      // Handle progress updates from VidKing
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.type === 'timeupdate' || data.type === 'progress') {
          // Could save progress to localStorage here
          console.log('VidKing progress:', data);
        }
      } catch {
        // ignore non-JSON messages
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="watch__player-container">
      <iframe
        ref={iframeRef}
        src={embedUrl}
        allowFullScreen
        allow="autoplay; fullscreen; picture-in-picture"
        title="Video Player"
      />
    </div>
  );
}
