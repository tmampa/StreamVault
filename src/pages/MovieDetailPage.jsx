import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Play, Star, Clapperboard, Check, Plus, ArrowLeft, AlertTriangle } from 'lucide-react';
import { getMovieDetails, imgUrl, backdropUrl } from '../api/tmdb';
import { useWatchlist } from '../context/WatchlistContext';
import ContentRow from '../components/ContentRow';
import TrailerModal from '../components/TrailerModal';

export default function MovieDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getMovieDetails(id);
        setMovie(data);
      } catch (err) {
        console.error('Failed to load movie:', err);
        setError('Failed to load movie details. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    load();
    window.scrollTo(0, 0);
  }, [id]);

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

  if (!movie) return null;

  const inWatchlist = isInWatchlist(movie.id, 'movie');
  const hasTrailer = movie.videos?.results?.some((v) => v.site === 'YouTube');
  const ratingColor = movie.vote_average >= 7 ? 'var(--rating-high)' : movie.vote_average >= 5 ? 'var(--rating-mid)' : 'var(--rating-low)';
  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : '';
  const year = (movie.release_date || '').slice(0, 4);
  const cast = movie.credits?.cast?.slice(0, 15) || [];
  const similar = movie.similar?.results || [];

  const toggleWatchlist = () => {
    if (inWatchlist) {
      removeFromWatchlist(movie.id, 'movie');
    } else {
      addToWatchlist({
        id: movie.id,
        media_type: 'movie',
        title: movie.title,
        poster_path: movie.poster_path,
        vote_average: movie.vote_average,
        release_date: movie.release_date,
      });
    }
  };

  return (
    <div className="detail">
      <div className="detail__backdrop-wrapper">
        <div
          className="detail__backdrop"
          style={{
            backgroundImage: movie.backdrop_path
              ? `url(${backdropUrl(movie.backdrop_path)})`
              : 'none',
          }}
        />
      </div>

      <div className="detail__content">
        <div className="detail__top">
          <div className="detail__poster-wrapper">
            {movie.poster_path ? (
              <img
                className="detail__poster"
                src={imgUrl(movie.poster_path, 'w500')}
                alt={movie.title}
              />
            ) : (
              <div className="detail__poster no-poster">No Poster</div>
            )}
          </div>

          <div className="detail__info">
            <h1 className="detail__title">{movie.title}</h1>
            <div className="detail__meta">
              <span
                className="detail__rating-badge"
                style={{ color: ratingColor, border: `1px solid ${ratingColor}` }}
              >
                <Star size={14} fill="currentColor" /> {movie.vote_average?.toFixed(1)}
              </span>
              {year && <span>{year}</span>}
              {runtime && <span>{runtime}</span>}
              {movie.original_language && (
                <span style={{ textTransform: 'uppercase' }}>{movie.original_language}</span>
              )}
            </div>

            <div className="detail__genres">
              {movie.genres?.map((g) => (
                <Link key={g.id} to={`/genre/${g.id}?type=movie`} className="detail__genre-tag">
                  {g.name}
                </Link>
              ))}
            </div>

            <p className="detail__overview">{movie.overview}</p>

            <div className="detail__actions">
              <button
                className="btn btn--primary"
                onClick={() => navigate(`/watch/movie/${movie.id}`)}
              >
                <Play size={16} fill="currentColor" /> Watch Now
              </button>
              {hasTrailer && (
                <button className="btn btn--secondary" onClick={() => setShowTrailer(true)}>
                  <Clapperboard size={16} /> Trailer
                </button>
              )}
              <button
                className={`btn btn--secondary ${inWatchlist ? 'watchlist-active' : ''}`}
                onClick={toggleWatchlist}
              >
                {inWatchlist ? <><Check size={16} /> In Watchlist</> : <><Plus size={16} /> Watchlist</>}
              </button>
              <button className="btn btn--secondary" onClick={() => navigate(-1)}>
                <ArrowLeft size={16} /> Back
              </button>
            </div>
          </div>
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
          <ContentRow title="Similar Movies" items={similar.map(s => ({ ...s, media_type: 'movie' }))} />
        )}
      </div>

      {showTrailer && (
        <TrailerModal videos={movie.videos} onClose={() => setShowTrailer(false)} />
      )}
    </div>
  );
}
