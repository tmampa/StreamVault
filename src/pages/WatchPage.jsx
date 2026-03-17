import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';
import { getMovieDetails, getTvDetails, getTvSeasonDetails } from '../api/tmdb';
import { useContinueWatching } from '../context/ContinueWatchingContext';

export default function WatchPage() {
  const params = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [episodeInfo, setEpisodeInfo] = useState(null);
  const [totalEpisodes, setTotalEpisodes] = useState(0);
  const { addToHistory } = useContinueWatching();

  const isMovie = !params.season;
  const tmdbId = params.id;
  const season = parseInt(params.season) || 1;
  const episode = parseInt(params.episode) || 1;

  useEffect(() => {
    async function load() {
      try {
        if (isMovie) {
          const data = await getMovieDetails(tmdbId);
          setDetails(data);
          addToHistory({
            id: parseInt(tmdbId),
            media_type: 'movie',
            title: data.title,
            poster_path: data.poster_path,
            vote_average: data.vote_average,
            release_date: data.release_date,
          });
        } else {
          const [showData, seasonData] = await Promise.all([
            getTvDetails(tmdbId),
            getTvSeasonDetails(tmdbId, season),
          ]);
          setDetails(showData);
          setTotalEpisodes(seasonData.episodes?.length || 0);
          const ep = seasonData.episodes?.find((e) => e.episode_number === episode);
          setEpisodeInfo(ep || null);
          addToHistory({
            id: parseInt(tmdbId),
            media_type: 'tv',
            name: showData.name,
            poster_path: showData.poster_path,
            vote_average: showData.vote_average,
            first_air_date: showData.first_air_date,
            season,
            episode,
          });
        }
      } catch (err) {
        console.error('Failed to load watch data:', err);
      }
    }
    load();
    window.scrollTo(0, 0);
  }, [tmdbId, season, episode, isMovie]);

  const title = details?.title || details?.name || 'Loading...';

  const handlePrevEpisode = () => {
    if (episode > 1) {
      navigate(`/watch/tv/${tmdbId}/${season}/${episode - 1}`);
    }
  };

  const handleNextEpisode = () => {
    if (episode < totalEpisodes) {
      navigate(`/watch/tv/${tmdbId}/${season}/${episode + 1}`);
    }
  };

  return (
    <div className="watch">
      <VideoPlayer
        tmdbId={tmdbId}
        mediaType={isMovie ? 'movie' : 'tv'}
        season={season}
        episode={episode}
      />

      <div className="watch__info">
        <button
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
            <div className="watch__episode-nav">
              <button
                className="btn btn--secondary btn--sm"
                disabled={episode <= 1}
                onClick={handlePrevEpisode}
              >
                <ChevronLeft size={16} /> Previous Episode
              </button>
              <button
                className="btn btn--primary btn--sm"
                disabled={episode >= totalEpisodes}
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
