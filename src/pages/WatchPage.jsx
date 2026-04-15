import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';
import { getMovieDetails, getTvDetails, getTvSeasonDetails } from '../api/tmdb';
import { useContinueWatching } from '../context/ContinueWatchingContext';
import { createProgressSnapshot, getContinueWatchingKey } from '../context/continueWatching';

const AUTO_NEXT_STORAGE_KEY = 'tm_auto_next_enabled';
const AUTO_NEXT_DELAY_SECONDS = 6;
const MIN_PROGRESS_SECONDS = 5;
const PROGRESS_CHECKPOINT_SECONDS = 15;
const RESUME_COMPLETION_PERCENT = 95;
const RESUME_BUFFER_SECONDS = 60;

function loadAutoNextPreference() {
  try {
    const savedValue = localStorage.getItem(AUTO_NEXT_STORAGE_KEY);
    return savedValue === null ? true : savedValue === 'true';
  } catch {
    return true;
  }
}

export default function WatchPage() {
  const params = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [episodeInfo, setEpisodeInfo] = useState(null);
  const [seasonEpisodes, setSeasonEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);
  const [autoNextEnabled, setAutoNextEnabled] = useState(loadAutoNextPreference);
  const [countdownRemaining, setCountdownRemaining] = useState(null);
  const lastSavedCheckpointRef = useRef(-1);
  const lastSavedProgressRef = useRef(0);
  const { items, addToHistory, updateProgress, removeFromHistory } = useContinueWatching();

  const isMovie = !params.season;
  const tmdbId = params.id;
  const season = parseInt(params.season, 10) || 1;
  const episode = parseInt(params.episode, 10) || 1;
  const totalEpisodes = seasonEpisodes.length;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setDetails(null);
      setEpisodeInfo(null);
      setSeasonEpisodes([]);
      try {
        if (isMovie) {
          const data = await getMovieDetails(tmdbId);
          if (cancelled) return;
          setDetails(data);
        } else {
          const [showData, seasonData] = await Promise.all([
            getTvDetails(tmdbId),
            getTvSeasonDetails(tmdbId, season),
          ]);
          if (cancelled) return;
          const episodes = seasonData.episodes || [];
          setDetails(showData);
          setSeasonEpisodes(episodes);
          const ep = episodes.find((e) => e.episode_number === episode);
          setEpisodeInfo(ep || null);
        }
      } catch (err) {
        console.error('Failed to load watch data:', err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load details. Please try again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    window.scrollTo(0, 0);
    return () => {
      cancelled = true;
    };
  }, [tmdbId, season, episode, isMovie, retryKey]);

  useEffect(() => {
    try {
      localStorage.setItem(AUTO_NEXT_STORAGE_KEY, String(autoNextEnabled));
    } catch {
      // Ignore localStorage failures and fall back to the in-memory toggle state.
    }
  }, [autoNextEnabled]);

  useEffect(() => {
    setCountdownRemaining(null);
  }, [tmdbId, season, episode]);

  const title = details?.title || details?.name || 'Loading...';

  const historyEntry = useMemo(() => {
    if (!details) {
      return null;
    }

    return isMovie
      ? {
          id: parseInt(tmdbId, 10),
          media_type: 'movie',
          title: details.title,
          poster_path: details.poster_path,
          vote_average: details.vote_average,
          release_date: details.release_date,
        }
      : {
          id: parseInt(tmdbId, 10),
          media_type: 'tv',
          name: details.name,
          poster_path: details.poster_path,
          vote_average: details.vote_average,
          first_air_date: details.first_air_date,
          season,
          episode,
        };
  }, [details, episode, isMovie, season, tmdbId]);

  const historyLookupKey = useMemo(
    () => getContinueWatchingKey({ id: parseInt(tmdbId, 10), media_type: isMovie ? 'movie' : 'tv' }),
    [isMovie, tmdbId],
  );

  const currentHistoryItem = useMemo(
    () => items.find((item) => getContinueWatchingKey(item) === historyLookupKey) || null,
    [historyLookupKey, items],
  );

  const resumeStartTime = useMemo(() => {
    if (!currentHistoryItem) {
      return 0;
    }

    if (!isMovie && (currentHistoryItem.season !== season || currentHistoryItem.episode !== episode)) {
      return 0;
    }

    const progressSeconds = Number(currentHistoryItem.progressSeconds) || 0;
    const durationSeconds = Number(currentHistoryItem.durationSeconds) || 0;
    const progressPercent = Number(currentHistoryItem.progressPercent) || 0;

    if (progressSeconds < MIN_PROGRESS_SECONDS) {
      return 0;
    }

    if (progressPercent >= RESUME_COMPLETION_PERCENT) {
      return 0;
    }

    if (durationSeconds > 0 && durationSeconds - progressSeconds <= RESUME_BUFFER_SECONDS) {
      return 0;
    }

    return progressSeconds;
  }, [currentHistoryItem, isMovie, season, episode]);

  const routePlaybackKey = `${isMovie ? 'movie' : 'tv'}-${tmdbId}-${season}-${episode}`;
  const [playerResumeState, setPlayerResumeState] = useState(() => ({
    routePlaybackKey,
    startTime: resumeStartTime,
  }));

  const nextEpisodeTarget = useMemo(() => {
    if (isMovie || !details) {
      return null;
    }

    if (episode < totalEpisodes) {
      return { season, episode: episode + 1 };
    }

    const upcomingSeason = details.seasons?.find(
      (seasonInfo) => seasonInfo.season_number > season && seasonInfo.season_number >= 1 && seasonInfo.episode_count > 0
    );

    if (!upcomingSeason) {
      return null;
    }

    return { season: upcomingSeason.season_number, episode: 1 };
  }, [details, episode, isMovie, season, totalEpisodes]);

  const nextEpisodeInfo = useMemo(() => {
    if (!nextEpisodeTarget || nextEpisodeTarget.season !== season) {
      return null;
    }

    return seasonEpisodes.find((item) => item.episode_number === nextEpisodeTarget.episode) || null;
  }, [nextEpisodeTarget, season, seasonEpisodes]);

  const upNextLabel = nextEpisodeTarget
    ? `Season ${nextEpisodeTarget.season}, Episode ${nextEpisodeTarget.episode}${nextEpisodeInfo?.name ? ` — ${nextEpisodeInfo.name}` : ''}`
    : 'You are on the latest available episode.';

  const nextHistoryEntry = useMemo(() => {
    if (!historyEntry || !nextEpisodeTarget || isMovie) {
      return null;
    }

    return {
      ...historyEntry,
      season: nextEpisodeTarget.season,
      episode: nextEpisodeTarget.episode,
    };
  }, [historyEntry, isMovie, nextEpisodeTarget]);

  useEffect(() => {
    if (!autoNextEnabled || !nextEpisodeTarget) {
      setCountdownRemaining(null);
    }
  }, [autoNextEnabled, nextEpisodeTarget]);

  useEffect(() => {
    setPlayerResumeState((currentValue) => (
      currentValue.routePlaybackKey === routePlaybackKey
        ? currentValue
        : { routePlaybackKey, startTime: resumeStartTime }
    ));
  }, [resumeStartTime, routePlaybackKey]);

  useEffect(() => {
    lastSavedCheckpointRef.current = Math.floor(resumeStartTime / PROGRESS_CHECKPOINT_SECONDS);
    lastSavedProgressRef.current = resumeStartTime;
  }, [resumeStartTime, tmdbId, season, episode]);

  const navigateToEpisode = useCallback(
    (target, options = {}) => {
      if (!target) {
        return;
      }

      navigate(`/watch/tv/${tmdbId}/${target.season}/${target.episode}`, {
        replace: options.replace === true,
      });
    },
    [navigate, tmdbId]
  );

  const handlePrevEpisode = useCallback(() => {
    if (episode > 1) {
      navigate(`/watch/tv/${tmdbId}/${season}/${episode - 1}`);
    }
  }, [episode, navigate, season, tmdbId]);

  const handleNextEpisode = useCallback((options) => {
    setCountdownRemaining(null);
    if (nextHistoryEntry) {
      addToHistory(nextHistoryEntry);
    }
    navigateToEpisode(nextEpisodeTarget, options);
  }, [addToHistory, navigateToEpisode, nextEpisodeTarget, nextHistoryEntry]);

  const handleAutoNextToggle = useCallback(() => {
    setAutoNextEnabled((currentValue) => {
      const nextValue = !currentValue;
      if (!nextValue) {
        setCountdownRemaining(null);
      }
      return nextValue;
    });
  }, []);

  const handlePlayerEvent = useCallback(
    (playerEvent) => {
      if (String(playerEvent.id) !== String(tmdbId)) {
        return;
      }

      if (playerEvent.mediaType !== (isMovie ? 'movie' : 'tv')) {
        return;
      }

      if (!isMovie) {
        if (Number(playerEvent.season) !== season || Number(playerEvent.episode) !== episode) {
          return;
        }
      }

      if (!historyEntry) {
        return;
      }

      const progressSnapshot = createProgressSnapshot(playerEvent);

      const persistProgress = (force = false) => {
        if (progressSnapshot.progressSeconds < MIN_PROGRESS_SECONDS && progressSnapshot.progressPercent < 1) {
          return;
        }

        if (!force) {
          const checkpoint = Math.floor(progressSnapshot.progressSeconds / PROGRESS_CHECKPOINT_SECONDS);
          if (checkpoint <= lastSavedCheckpointRef.current) {
            return;
          }
          lastSavedCheckpointRef.current = checkpoint;
        } else if (Math.abs(progressSnapshot.progressSeconds - lastSavedProgressRef.current) < 3) {
          return;
        }

        lastSavedProgressRef.current = progressSnapshot.progressSeconds;
        updateProgress(historyEntry, progressSnapshot);
      };

      if (playerEvent.event === 'play') {
        setCountdownRemaining(null);
        addToHistory(historyEntry);
        return;
      }

      if (playerEvent.event === 'ended') {
        lastSavedCheckpointRef.current = -1;
        lastSavedProgressRef.current = 0;

        if (isMovie || !nextHistoryEntry) {
          removeFromHistory(historyEntry);
          setCountdownRemaining(null);
          return;
        }

        addToHistory(nextHistoryEntry);
        if (autoNextEnabled && nextEpisodeTarget) {
          setCountdownRemaining(AUTO_NEXT_DELAY_SECONDS);
        } else {
          setCountdownRemaining(null);
        }
        return;
      }

      if (playerEvent.event === 'seeked') {
        setCountdownRemaining(null);
        persistProgress(true);
        return;
      }

      if (playerEvent.event === 'pause') {
        persistProgress(true);
        return;
      }

      if (playerEvent.event === 'timeupdate') {
        persistProgress(false);
      }
    },
    [addToHistory, autoNextEnabled, episode, historyEntry, isMovie, nextEpisodeTarget, nextHistoryEntry, removeFromHistory, season, tmdbId, updateProgress]
  );

  useEffect(() => {
    if (countdownRemaining == null) {
      return undefined;
    }

    if (countdownRemaining <= 0) {
      handleNextEpisode({ replace: true });
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setCountdownRemaining((currentValue) => (currentValue == null ? null : currentValue - 1));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [countdownRemaining, handleNextEpisode]);

  if (loading) {
    return (
      <div className="loading-container" style={{ marginTop: 'var(--nav-height)' }}>
        <Helmet>
          <title>Watch — TM</title>
        </Helmet>
        <div className="spinner" />
        <span className="loading-text">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-container" style={{ marginTop: 'var(--nav-height)' }}>
        <Helmet>
          <title>Error — TM</title>
        </Helmet>
        <div className="error-message">
          <span className="error-message__icon">
            <AlertTriangle size={20} />
          </span>
          <span>{error}</span>
        </div>
        <button type="button" className="btn btn--primary" style={{ marginTop: 16 }} onClick={() => setRetryKey((k) => k + 1)}>
          Try again
        </button>
        <button type="button" className="btn btn--secondary" style={{ marginTop: 12 }} onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Go back
        </button>
      </div>
    );
  }

  if (!details) return null;

  return (
    <div className="watch">
      <Helmet>
        <title>{`${title} — Watch — TM`}</title>
        <meta
          name="description"
          content={
            isMovie
              ? `Watch ${details.title || 'this title'} on TM.`
              : `Watch ${details.name || 'this show'} S${season}E${episode} on TM.`
          }
        />
      </Helmet>
      <VideoPlayer
        tmdbId={tmdbId}
        mediaType={isMovie ? 'movie' : 'tv'}
        season={season}
        episode={episode}
        startTime={playerResumeState.startTime}
        onPlayerEvent={handlePlayerEvent}
      >
        {!isMovie && countdownRemaining != null && nextEpisodeTarget && (
          <div className="watch__auto-next-banner" role="status" aria-live="polite">
            <div className="watch__auto-next-copy">
              <span className="watch__auto-next-kicker">Up Next</span>
              <strong>{upNextLabel}</strong>
              <span className="watch__auto-next-countdown">Starting in {countdownRemaining}s</span>
            </div>
            <div className="watch__auto-next-actions">
              <button type="button" className="btn btn--secondary btn--sm" onClick={() => setCountdownRemaining(null)}>
                Stay here
              </button>
              <button type="button" className="btn btn--primary btn--sm" onClick={handleNextEpisode}>
                Play now
              </button>
            </div>
          </div>
        )}
      </VideoPlayer>

      <div className="watch__info">
        <button
          type="button"
          className="watch__back-btn"
          onClick={() => navigate(isMovie ? `/movie/${tmdbId}` : `/tv/${tmdbId}`)}
        >
          <ArrowLeft size={16} /> Back to details
        </button>

        <h1 className="watch__title">{title}</h1>

        {isMovie ? (
          <p className="watch__meta">
            {(details?.release_date || '').slice(0, 4)}
            {details?.runtime ? ` • ${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m` : ''}
          </p>
        ) : (
          <>
            <p className="watch__meta">
              Season {season}, Episode {episode}
              {episodeInfo ? ` — ${episodeInfo.name}` : ''}
            </p>
            {episodeInfo?.overview && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px', maxWidth: '700px' }}>
                {episodeInfo.overview}
              </p>
            )}
            <div className="watch__auto-next-controls">
              <button
                type="button"
                className={`watch__auto-next-toggle ${autoNextEnabled ? 'is-active' : ''}`}
                aria-pressed={autoNextEnabled}
                onClick={handleAutoNextToggle}
              >
                <span className="watch__auto-next-switch" aria-hidden="true">
                  <span className="watch__auto-next-switch-thumb" />
                </span>
                Auto-play next episode
              </button>
              <span className="watch__auto-next-hint">{upNextLabel}</span>
            </div>
            <div className="watch__episode-nav">
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                disabled={episode <= 1}
                onClick={handlePrevEpisode}
              >
                <ChevronLeft size={16} /> Previous Episode
              </button>
              <button
                type="button"
                className="btn btn--primary btn--sm"
                disabled={!nextEpisodeTarget}
                onClick={handleNextEpisode}
              >
                Next Episode <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
