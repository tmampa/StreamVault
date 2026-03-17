import { useState, useEffect } from 'react';
import HeroSection from '../components/HeroSection';
import ContentRow from '../components/ContentRow';
import SkeletonCard from '../components/SkeletonCard';
import { useContinueWatching } from '../context/ContinueWatchingContext';
import { getTrending, getPopularMovies, getPopularTv, getTopRatedMovies, getTopRatedTv } from '../api/tmdb';

function SkeletonRow() {
  return (
    <section className="content-section">
      <div className="content-section__header">
        <div className="skeleton-line skeleton-shimmer" style={{ width: 200, height: 24, borderRadius: 4 }} />
      </div>
      <div className="content-row">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const [trending, setTrending] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [popularTv, setPopularTv] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [topRatedTv, setTopRatedTv] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { items: continueWatchingItems } = useContinueWatching();

  useEffect(() => {
    async function loadData() {
      try {
        const [trendRes, popMovRes, popTvRes, topMovRes, topTvRes] = await Promise.all([
          getTrending('all', 'day'),
          getPopularMovies(),
          getPopularTv(),
          getTopRatedMovies(),
          getTopRatedTv(),
        ]);
        setTrending(trendRes.results || []);
        setPopularMovies(popMovRes.results || []);
        setPopularTv(popTvRes.results || []);
        setTopRatedMovies(topMovRes.results || []);
        setTopRatedTv(topTvRes.results || []);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
        setError('Failed to load content. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div>
        <div className="hero skeleton-hero" style={{ marginTop: 'var(--nav-height)' }}>
          <div className="hero__backdrop skeleton-shimmer" style={{ opacity: 1 }} />
        </div>
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ marginTop: 'var(--nav-height)' }}>
        <div className="error-banner">
          <span>⚠ {error}</span>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <HeroSection items={trending} />
      {continueWatchingItems.length > 0 && (
        <ContentRow
          title="▶ Continue Watching"
          items={continueWatchingItems.map((item) => ({
            ...item,
            linkTo:
              item.media_type === 'movie'
                ? `/watch/movie/${item.id}`
                : `/watch/tv/${item.id}/${item.season}/${item.episode}`,
          }))}
        />
      )}
      <ContentRow title="🔥 Trending Today" items={trending} />
      <ContentRow title="🎬 Popular Movies" items={popularMovies} />
      <ContentRow title="📺 Popular TV Shows" items={popularTv} />
      <ContentRow title="⭐ Top Rated Movies" items={topRatedMovies} />
      <ContentRow title="🏆 Top Rated TV Shows" items={topRatedTv} />
    </div>
  );
}
