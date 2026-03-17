import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Play, Plus, Check, ThumbsUp, Star, Clock, Calendar } from 'lucide-react';
import { backdropUrl, imgUrl, getMovieDetails, getTvDetails } from '../api/tmdb';
import { useWatchlist } from '../context/WatchlistContext';
import { useGenres } from '../context/GenreContext';

export default function PreviewModal({ item, onClose }) {
  const navigate = useNavigate();
  const genreMap = useGenres();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
  const title = item.title || item.name;
  const inWatchlist = isInWatchlist(item.id, mediaType);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    async function loadDetails() {
      try {
        const data = mediaType === 'movie'
          ? await getMovieDetails(item.id)
          : await getTvDetails(item.id);
        setDetails(data);
      } catch {
        // Use basic item data as fallback
      } finally {
        setLoading(false);
      }
    }
    loadDetails();
  }, [item.id, mediaType]);

  const handleClose = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleClose);
    return () => window.removeEventListener('keydown', handleClose);
  }, [handleClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handlePlay = () => {
    onClose();
    if (mediaType === 'movie') {
      navigate(`/watch/movie/${item.id}`);
    } else {
      navigate(`/watch/tv/${item.id}/1/1`);
    }
  };

  const handleWatchlist = () => {
    if (inWatchlist) {
      removeFromWatchlist(item.id, mediaType);
    } else {
      addToWatchlist({ ...item, media_type: mediaType });
    }
  };

  const handleMoreInfo = () => {
    onClose();
    navigate(`/${mediaType}/${item.id}`);
  };

  const d = details || item;
  const backdrop = backdropUrl(d.backdrop_path) || imgUrl(d.poster_path);
  const matchPct = d.vote_average ? Math.round(d.vote_average * 10) : null;
  const year = (d.release_date || d.first_air_date || '').slice(0, 4);
  const runtime = d.runtime ? `${Math.floor(d.runtime / 60)}h ${d.runtime % 60}m` : null;
  const seasons = d.number_of_seasons;
  const overview = d.overview || item.overview || '';
  const genres = d.genres
    ? d.genres.map((g) => g.name)
    : (item.genre_ids || []).map((id) => genreMap[id]).filter(Boolean);
  const cast = d.credits?.cast?.slice(0, 6) || [];
  const similar = d.similar?.results?.slice(0, 6) || [];

  return createPortal(
    <div className="preview-modal__backdrop" onClick={handleBackdropClick}>
      <div className="preview-modal" role="dialog" aria-label={title}>
        {/* Close button */}
        <button className="preview-modal__close" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Hero area */}
        <div className="preview-modal__hero">
          {backdrop && <img src={backdrop} alt={title} className="preview-modal__hero-img" />}
          <div className="preview-modal__hero-gradient" />
          <div className="preview-modal__hero-content">
            <h2 className="preview-modal__title">{title}</h2>
            <div className="preview-modal__hero-actions">
              <button className="btn btn--primary" onClick={handlePlay}>
                <Play size={18} fill="currentColor" /> Play
              </button>
              <button className={`btn btn--icon btn--secondary ${inWatchlist ? 'watchlist-active' : ''}`} onClick={handleWatchlist} title={inWatchlist ? 'Remove from list' : 'Add to list'}>
                {inWatchlist ? <Check size={20} /> : <Plus size={20} />}
              </button>
              <button className="btn btn--icon btn--secondary" title="Like">
                <ThumbsUp size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="preview-modal__body">
          {loading ? (
            <div className="preview-modal__loading">
              <div className="spinner" />
            </div>
          ) : (
            <>
              <div className="preview-modal__meta-row">
                {matchPct && <span className="preview-modal__match">{matchPct}% Match</span>}
                {year && <span className="preview-modal__year"><Calendar size={14} /> {year}</span>}
                {runtime && <span className="preview-modal__runtime"><Clock size={14} /> {runtime}</span>}
                {seasons && <span className="preview-modal__seasons">{seasons} Season{seasons > 1 ? 's' : ''}</span>}
                {d.vote_average > 0 && (
                  <span className="preview-modal__rating">
                    <Star size={14} fill="currentColor" /> {d.vote_average.toFixed(1)}
                  </span>
                )}
              </div>

              {overview && (
                <p className="preview-modal__overview">{overview}</p>
              )}

              {genres.length > 0 && (
                <div className="preview-modal__genres">
                  {genres.map((g, i) => (
                    <span key={i} className="preview-modal__genre-tag">{g}</span>
                  ))}
                </div>
              )}

              {cast.length > 0 && (
                <div className="preview-modal__section">
                  <h3 className="preview-modal__section-title">Cast</h3>
                  <div className="preview-modal__cast">
                    {cast.map((c) => (
                      <span key={c.id} className="preview-modal__cast-name">{c.name}</span>
                    ))}
                  </div>
                </div>
              )}

              {similar.length > 0 && (
                <div className="preview-modal__section">
                  <h3 className="preview-modal__section-title">More Like This</h3>
                  <div className="preview-modal__similar-grid">
                    {similar.map((s) => {
                      const sPoster = imgUrl(s.poster_path, 'w342');
                      const sType = s.media_type || mediaType;
                      return (
                        <div
                          key={s.id}
                          className="preview-modal__similar-card"
                          onClick={() => { onClose(); navigate(`/${sType}/${s.id}`); }}
                        >
                          <div className="preview-modal__similar-poster">
                            {sPoster ? <img src={sPoster} alt={s.title || s.name} /> : <div className="no-poster">No Image</div>}
                          </div>
                          <div className="preview-modal__similar-info">
                            <div className="preview-modal__similar-title">{s.title || s.name}</div>
                            {s.vote_average > 0 && (
                              <span className="preview-modal__similar-rating">
                                <Star size={10} fill="currentColor" /> {s.vote_average.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button className="preview-modal__more-info" onClick={handleMoreInfo}>
                Full Details
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
