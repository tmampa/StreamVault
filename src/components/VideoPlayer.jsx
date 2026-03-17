import { memo, useMemo } from 'react';
import { getMovieEmbedUrl, getTvEmbedUrl, PLAYER_COLOR } from '../api/vidking';

const VideoPlayer = memo(function VideoPlayer({ tmdbId, mediaType, season, episode }) {
  const embedUrl = useMemo(
    () =>
      mediaType === 'movie'
        ? getMovieEmbedUrl(tmdbId, { color: PLAYER_COLOR, autoplay: true })
        : getTvEmbedUrl(tmdbId, season, episode, {
            color: PLAYER_COLOR,
            autoplay: true,
            episodeSelector: true,
            nextEpisodeBtn: true,
          }),
    [tmdbId, mediaType, season, episode]
  );

  return (
    <div className="watch__player-container">
      <iframe
        src={embedUrl}
        allowFullScreen
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        referrerPolicy="origin"
        title="Video Player"
      />
    </div>
  );
});

export default VideoPlayer;
