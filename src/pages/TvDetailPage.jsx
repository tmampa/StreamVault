import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Play, Star, Clapperboard, Check, Plus, ArrowLeft, AlertTriangle } from 'lucide-react';
import { getTvDetails, getTvSeasonDetails, imgUrl, backdropUrl } from '../api/tmdb';
import { useWatchlist } from '../context/WatchlistContext';
import ContentRow from '../components/ContentRow';
import TrailerModal from '../components/TrailerModal';

export default function TvDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getTvDetails(id);
        setShow(data);
        const firstSeason = data.seasons?.find((s) => s.season_number >= 1);
        if (firstSeason) setSelectedSeason(firstSeason.season_number);
      } catch (err) {
        console.error('Failed to load TV show:', err);
        setError('Failed to load TV show details. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    load();
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (!show) return;
    async function loadEpisodes() {
      setEpisodesLoading(true);
      try {
        const data = await getTvSeasonDetails(id, selectedSeason);
        setEpisodes(data.episodes || []);
      } catch (err) {
        console.error('Failed to load episodes:', err);
        setEpisodes([]);
      } finally {
        setEpisodesLoading(false);
      }
    }
    loadEpisodes();
  }, [id, show, selectedSeason]);

  if (loading) {
    return (
      <div className="loading-container" style={{ marginTop: 'var(--nav-height)' }}>
        <div className="spinner" />
        <span className="loading-text">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-container" style={{ marginTop: 'var(--nav-height)' }}>
        <div className="error-message">
          <span className="error-message__icon"><AlertTriangle size={20} /></span>
          <span>{error}</span>
        </div>
        <button className="btn btn--secondary" style={{ marginTop: 16 }} onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>
    );
  }

  if (!show) return null;

  const inWatchlist = isInWatchlist(show.id, 'tv');
  const hasTrailer = show.videos?.results?.some((v) => v.site === 'YouTube');
  const ratingColor =
    show.vote_average >= 7
      ? 'var(--rating-high)'
      : show.vote_average >= 5
      ? 'var(--rating-mid)'
      : 'var(--rating-low)';
  const year = (show.first_air_date || '').slice(0, 4);
  const endYear = show.status === 'Ended' ? (show.last_air_date || '').slice(0, 4) : 'Present';
  const cast = show.credits?.cast?.slice(0, 15) || [];
  const similar = show.similar?.results || [];
  const seasons = show.seasons?.filter((s) => s.season_number >= 1) || [];

  return (
    <div className="detail">
      <div className="detail__backdrop-wrapper">
        <div
          className="detail__backdrop"
          style={{
            backgroundImage: show.backdrop_path
              ? `url(${backdropUrl(show.backdrop_path)})`
              : 'none',
          }}
        />
      </div>

      <div className="detail__content">
        <div className="detail__top">
          <div className="detail__poster-wrapper">
            {show.poster_path ? (
              <img
                className="detail__poster"
                src={imgUrl(show.poster_path, 'w500')}
                alt={show.name}
              />
            ) : (
              <div className="detail__poster no-poster">No Poster</div>
            )}
          </div>

          <div className="detail__info">
            <h1 className="detail__title">{show.name}</h1>
            <div className="detail__meta">
              <span
                className="detail__rating-badge"
                style={{ color: ratingColor, border: `1px solid ${ratingColor}` }}
              >
                <Star size={14} fill="currentColor" /> {show.vote_average?.toFixed(1)}
              </span>
              {year && (
                <span>
                  {year}–{endYear}
                </span>
              )}
              <span>{show.number_of_seasons} Season{show.number_of_seasons !== 1 ? 's' : ''}</span>
              <span>{show.status}</span>
            </div>

            <div className="detail__genres">
              {show.genres?.map((g) => (
                <Link key={g.id} to={`/genre/${g.id}?type=tv`} className="detail__genre-tag">
                  {g.name}
                </Link>
              ))}
            </div>

            <p className="detail__overview">{show.overview}</p>

            <div className="detail__actions">
              <button
                className="btn btn--primary"
                onClick={() =>
                  navigate(`/watch/tv/${show.id}/${selectedSeason}/1`)
                }
              >
                <Play size={16} fill="currentColor" /> Watch S{selectedSeason}E1
              </button>
              {hasTrailer && (
                <button className="btn btn--secondary" onClick={() => setShowTrailer(true)}>
                  <Clapperboard size={16} /> Trailer
                </button>
              )}
              <button
                className={`btn btn--secondary ${inWatchlist ? 'watchlist-active' : ''}`}
                onClick={() => {
                  if (inWatchlist) {
                    removeFromWatchlist(show.id, 'tv');
                  } else {
                    addToWatchlist({
                      id: show.id,
                      media_type: 'tv',
                      name: show.name,
                      poster_path: show.poster_path,
                      vote_average: show.vote_average,
                      first_air_date: show.first_air_date,
                    });
                  }
                }}
              >
                {inWatchlist ? <><Check size={16} /> In Watchlist</> : <><Plus size={16} /> Watchlist</>}
              </button>
              <button className="btn btn--secondary" onClick={() => navigate(-1)}>
                <ArrowLeft size={16} /> Back
              </button>
            </div>
          </div>
        </div>

        {/* Seasons & Episodes */}
        <div className="seasons-section">
          <h3 className="seasons-section__title">Episodes</h3>
          <div className="season-selector">
            {seasons.map((s) => (
              <button
                key={s.season_number}
                className={`season-btn ${selectedSeason === s.season_number ? 'active' : ''}`}
                onClick={() => setSelectedSeason(s.season_number)}
              >
                Season {s.season_number}
              </button>
            ))}
          </div>

          {episodesLoading ? (
            <div className="loading-container" style={{ minHeight: '200px' }}>
              <div className="spinner" />
            </div>
          ) : (
            <div className="episode-grid">
              {episodes.map((ep) => (
                <div
                  key={ep.episode_number}
                  className="episode-card"
                  onClick={() =>
                    navigate(`/watch/tv/${id}/${selectedSeason}/${ep.episode_number}`)
                  }
                >
                  <img
                    className="episode-card__still"
                    src={
                      ep.still_path
                        ? imgUrl(ep.still_path, 'w300')
                        : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 170"><rect fill="%2312121a" width="300" height="170"/><text x="150" y="90" text-anchor="middle" fill="%235a5a72" font-size="16">No Preview</text></svg>'
                    }
                    alt={ep.name}
                    loading="lazy"
                  />
                  <div className="episode-card__info">
                    <div className="episode-card__number">
                      Episode {ep.episode_number}
                    </div>
                    <div className="episode-card__name">{ep.name}</div>
                    <div className="episode-card__overview">
                      {ep.overview || 'No description available.'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cast.length > 0 && (
          <div className="cast-section">
            <h3 className="cast-section__title">Cast</h3>
            <div className="cast-row">
              {cast.map((person) => (
                <div key={person.id} className="cast-card">
                  <img
                    className="cast-card__photo"
                    src={
                      person.profile_path
                        ? imgUrl(person.profile_path, 'w185')
                        : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%2316162a" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%235a5a72" font-size="14">No Photo</text></svg>'
                    }
                    alt={person.name}
                    loading="lazy"
                  />
                  <div className="cast-card__name">{person.name}</div>
                  <div className="cast-card__character">{person.character}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {similar.length > 0 && (
          <ContentRow
            title="Similar Shows"
            items={similar.map((s) => ({ ...s, media_type: 'tv' }))}
          />
        )}
      </div>

      {showTrailer && (
        <TrailerModal videos={show.videos} onClose={() => setShowTrailer(false)} />
      )}
    </div>
  );
}
