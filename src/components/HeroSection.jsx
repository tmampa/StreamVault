import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Star, Play, Info } from 'lucide-react';
import { backdropUrl } from '../api/tmdb';
import PreviewModal from './PreviewModal';

export default function HeroSection({ items }) {
  const [current, setCurrent] = useState(0);
  const [modalItem, setModalItem] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!items || items.length === 0) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % Math.min(items.length, 5));
    }, 8000);
    return () => clearInterval(interval);
  }, [items]);

  if (!items || items.length === 0) return null;

  const featured = items.slice(0, 5);
  const item = featured[current];
  const title = item.title || item.name;
  const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
  const year = (item.release_date || item.first_air_date || '').slice(0, 4);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : '';

  const handleWatch = () => {
    if (mediaType === 'movie') {
      navigate(`/watch/movie/${item.id}`);
    } else {
      navigate(`/tv/${item.id}`);
    }
  };

  const handleDetails = () => {
    setModalItem(item);
  };

  return (
    <div className="hero">
      {featured.map((f, idx) => (
        <div
          key={f.id}
          className={`hero__backdrop ${idx === current ? 'active' : ''}`}
          style={{ backgroundImage: f.backdrop_path ? `url(${backdropUrl(f.backdrop_path)})` : 'none' }}
        />
      ))}
      <div className="hero__content">
        <span className="hero__badge"><Flame size={16} /> Trending Now</span>
        <h1 className="hero__title">{title}</h1>
        <div className="hero__meta">
          {rating && (
            <span className="hero__rating"><Star size={14} fill="currentColor" /> {rating}</span>
          )}
          {year && <span>{year}</span>}
          <span>{mediaType === 'movie' ? 'Movie' : 'TV Series'}</span>
        </div>
        <p className="hero__overview">{item.overview}</p>
        <div className="hero__actions">
          <button className="btn btn--primary" onClick={handleWatch}>
            <Play size={16} fill="currentColor" /> Watch Now
          </button>
          <button className="btn btn--secondary" onClick={handleDetails}>
            <Info size={16} /> More Info
          </button>
        </div>
      </div>
      <div className="hero__indicators">
        {featured.map((_, idx) => (
          <button
            key={idx}
            className={`hero__indicator ${idx === current ? 'active' : ''}`}
            onClick={() => setCurrent(idx)}
          />
        ))}
      </div>
      {modalItem && <PreviewModal item={modalItem} onClose={() => setModalItem(null)} />}
    </div>
  );
}
