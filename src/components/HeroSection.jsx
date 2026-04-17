import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Star, Play, Info, ArrowRight } from 'lucide-react';
import { backdropUrl, getMovieDetails, getTvDetails } from '../api/tmdb';
import PreviewModal from './PreviewModal';

export default function HeroSection({ items }) {
  const [current, setCurrent] = useState(0);
  const [modalItem, setModalItem] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [trailerKeys, setTrailerKeys] = useState({});
  const [loadedTrailerKey, setLoadedTrailerKey] = useState('');
  const iframeRef = useRef(null);
  const loadTimerRef = useRef(null);
  const currentTrailerKeyRef = useRef(null);
  const navigate = useNavigate();
  const featured = items?.slice(0, 5) || [];
  const safeCurrent = Math.min(current, Math.max(featured.length - 1, 0));
  const item = featured[safeCurrent] || null;
  const mediaType = item ? item.media_type || (item.title ? 'movie' : 'tv') : 'movie';
  const currentKey = item ? `${mediaType}-${item.id}` : '';
  const trailerKey = currentKey ? trailerKeys[currentKey] || null : null;

  useEffect(() => {
    if (featured.length === 0 || isPaused) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % featured.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [featured.length, isPaused]);

  useEffect(() => {
    const featuredItems = items?.slice(0, 5) || [];
    if (featuredItems.length === 0) return;
    let cancelled = false;

    Promise.all(
      featuredItems.map(async (featuredItem) => {
        const type = featuredItem.media_type || (featuredItem.title ? 'movie' : 'tv');
        const fetchDetails = type === 'movie' ? getMovieDetails : getTvDetails;

        try {
          const data = await fetchDetails(featuredItem.id);
          const trailer =
            data.videos?.results?.find((video) => video.type === 'Trailer' && video.site === 'YouTube') ||
            data.videos?.results?.find((video) => video.site === 'YouTube');

          return [`${type}-${featuredItem.id}`, trailer ? trailer.key : null];
        } catch {
          return [`${type}-${featuredItem.id}`, null];
        }
      }),
    ).then((entries) => {
      if (!cancelled) {
        setTrailerKeys(Object.fromEntries(entries));
      }
    });

    return () => { cancelled = true; };
  }, [items]);

  useEffect(() => {
    currentTrailerKeyRef.current = trailerKey;
    clearTimeout(loadTimerRef.current);
    setLoadedTrailerKey('');
    return () => clearTimeout(loadTimerRef.current);
  }, [trailerKey]);

  if (!item) return null;

  const title = item.title || item.name;
  const year = (item.release_date || item.first_air_date || '').slice(0, 4);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : '';
  const videoReady = Boolean(trailerKey) && loadedTrailerKey === trailerKey;
  const badge = item.heroBadge || 'Trending Now';
  const featureCopy = item.heroContext || 'Breakout picks people are watching right now.';

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

  const handleExploreCollection = () => {
    if (item.heroSeeAllLink) {
      navigate(item.heroSeeAllLink);
    }
  };

  return (
    <div className="hero" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
      {featured.map((f, idx) => (
        <div
          key={f.id}
          className={`hero__backdrop ${idx === safeCurrent ? 'active' : ''}`}
          style={{ backgroundImage: f.backdrop_path ? `url(${backdropUrl(f.backdrop_path)})` : 'none' }}
        />
      ))}
      {trailerKey && (
        <div className={`hero__trailer ${videoReady ? 'active' : ''}`}>
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${encodeURIComponent(trailerKey)}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&playsinline=1&loop=1&playlist=${encodeURIComponent(trailerKey)}`}
            allow="autoplay; fullscreen; encrypted-media"
            allowFullScreen
            title="Trailer"
            onLoad={() => {
              const keyAtLoad = trailerKey;
              clearTimeout(loadTimerRef.current);
              loadTimerRef.current = setTimeout(() => {
                if (currentTrailerKeyRef.current === keyAtLoad) {
                  setLoadedTrailerKey(keyAtLoad);
                }
              }, 1000);
            }}
          />
        </div>
      )}
      <div className="hero__content">
        <span className="hero__badge"><Flame size={16} /> {badge}</span>
        <h1 className="hero__title">{title}</h1>
        <div className="hero__meta">
          {rating && (
            <span className="hero__rating"><Star size={14} fill="currentColor" /> {rating}</span>
          )}
          {year && <span>{year}</span>}
          <span>{mediaType === 'movie' ? 'Movie' : 'TV Series'}</span>
        </div>
        <p className="hero__feature-copy">{featureCopy}</p>
        <p className="hero__overview">{item.overview}</p>
        <div className="hero__actions">
          <button className="btn btn--primary" onClick={handleWatch}>
            <Play size={16} fill="currentColor" /> Watch Now
          </button>
          <button className="btn btn--secondary" onClick={handleDetails}>
            <Info size={16} /> More Info
          </button>
          {item.heroSeeAllLink && (
            <button className="btn btn--ghost" onClick={handleExploreCollection}>
              Explore Collection <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
      <div className="hero__indicators">
        {featured.map((_, idx) => (
          <button
            key={idx}
            className={`hero__indicator ${idx === safeCurrent ? 'active' : ''}`}
            onClick={() => setCurrent(idx)}
          />
        ))}
      </div>
      {modalItem && <PreviewModal item={modalItem} onClose={() => setModalItem(null)} />}
    </div>
  );
}
