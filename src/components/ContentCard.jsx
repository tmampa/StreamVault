import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, Check, ThumbsUp, ChevronDown, Star } from 'lucide-react';
import { imgUrl, backdropUrl } from '../api/tmdb';
import { useWatchlist } from '../context/WatchlistContext';
import { useGenres } from '../context/GenreContext';

export default function ContentCard({ item, onOpenModal }) {
  const navigate = useNavigate();
  const genreMap = useGenres();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const [hovered, setHovered] = useState(false);
  const hoverTimer = useRef(null);

  const title = item.title || item.name;
  const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
  const year = (item.release_date || item.first_air_date || '').slice(0, 4);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
  const matchPct = item.vote_average ? Math.round(item.vote_average * 10) : null;
  const poster = imgUrl(item.poster_path, 'w342');
  const backdrop = backdropUrl(item.backdrop_path, 'w780') || poster;
  const linkTo = item.linkTo || `/${mediaType}/${item.id}`;
  const inWatchlist = isInWatchlist(item.id, mediaType);

  const genres = (item.genre_ids || [])
    .slice(0, 3)
    .map((id) => genreMap[id])
    .filter(Boolean);

  const handleMouseEnter = useCallback(() => {
    hoverTimer.current = setTimeout(() => setHovered(true), 400);
  }, []);

  const handleMouseLeave = useCallback(() => {
    clearTimeout(hoverTimer.current);
    setHovered(false);
  }, []);

  const handlePlay = (e) => {
    e.stopPropagation();
    if (mediaType === 'movie') {
      navigate(`/watch/movie/${item.id}`);
    } else {
      navigate(`/watch/tv/${item.id}/1/1`);
    }
  };

  const handleWatchlist = (e) => {
    e.stopPropagation();
    if (inWatchlist) {
      removeFromWatchlist(item.id, mediaType);
    } else {
      addToWatchlist({ ...item, media_type: mediaType });
    }
  };

  const handleExpand = (e) => {
    e.stopPropagation();
    if (onOpenModal) onOpenModal(item);
  };

  const handleCardClick = () => {
    navigate(linkTo);
  };

  return (
    <div
      className={`content-card ${hovered ? 'content-card--expanded' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
    >
      <div className="content-card__poster">
        {poster ? (
          <img src={poster} alt={title} loading="lazy" />
        ) : (
          <div className="no-poster">No Image</div>
        )}
        <div className="content-card__overlay">
          <div className="content-card__play-btn"><Play size={24} fill="currentColor" /></div>
        </div>
        {rating && (
          <span className={`content-card__rating content-card__rating--${rating >= 7 ? 'high' : rating >= 5 ? 'mid' : 'low'}`}>
            <Star size={12} fill="currentColor" /> {rating}
          </span>
        )}
      </div>

      {/* Hover info panel below poster */}
      {hovered && (
        <div className="content-card__hover-info">
          <div className="content-card__expand-actions">
            <button className="content-card__action-btn content-card__action-btn--play" onClick={handlePlay} title="Play">
              <Play size={14} fill="currentColor" />
            </button>
            <button className={`content-card__action-btn ${inWatchlist ? 'content-card__action-btn--active' : ''}`} onClick={handleWatchlist} title={inWatchlist ? 'Remove from list' : 'Add to list'}>
              {inWatchlist ? <Check size={14} /> : <Plus size={14} />}
            </button>
            <button className="content-card__action-btn" title="Like">
              <ThumbsUp size={14} />
            </button>
            <button className="content-card__action-btn content-card__action-btn--expand" onClick={handleExpand} title="More info">
              <ChevronDown size={14} />
            </button>
          </div>
          <div className="content-card__expand-meta">
            {matchPct && <span className="content-card__match">{matchPct}% Match</span>}
            {year && <span className="content-card__meta-year">{year}</span>}
          </div>
          {genres.length > 0 && (
            <div className="content-card__expand-genres">
              {genres.map((g, i) => (
                <span key={i}>
                  {g}
                  {i < genres.length - 1 && <span className="content-card__genre-dot">•</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {!hovered && (
        <div className="content-card__info">
          <div className="content-card__title">{title}</div>
          {year && <div className="content-card__year">{year}</div>}
        </div>
      )}
    </div>
  );
}
