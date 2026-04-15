import { memo, useEffect, useMemo, useRef } from 'react';
import { getMovieEmbedUrl, getTvEmbedUrl, parsePlayerEventMessage, PLAYER_COLOR } from '../api/vidking';

const VideoPlayer = memo(function VideoPlayer({ tmdbId, mediaType, season, episode, startTime = 0, onPlayerEvent, children }) {
  const iframeRef = useRef(null);

  const embedUrl = useMemo(
    () =>
      mediaType === 'movie'
        ? getMovieEmbedUrl(tmdbId, { color: PLAYER_COLOR, autoplay: true, progress: startTime })
        : getTvEmbedUrl(tmdbId, season, episode, {
            color: PLAYER_COLOR,
            autoplay: true,
            progress: startTime,
            episodeSelector: true,
            nextEpisodeBtn: true,
          }),
    [tmdbId, mediaType, season, episode, startTime]
  );

  useEffect(() => {
    if (!onPlayerEvent) {
      return undefined;
    }

    function handleMessage(event) {
      const playerEvent = parsePlayerEventMessage(event, iframeRef.current?.contentWindow);
      if (!playerEvent) {
        return;
      }

      onPlayerEvent(playerEvent);
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onPlayerEvent]);

  return (
    <div className="watch__player-container">
      <iframe
        ref={iframeRef}
        src={embedUrl}
        allowFullScreen
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        referrerPolicy="origin"
        title={
          mediaType === 'movie'
            ? 'Movie playback (embedded player)'
            : `TV playback — season ${season}, episode ${episode}`
        }
      />
      {children}
    </div>
  );
});

export default VideoPlayer;
