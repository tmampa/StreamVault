import { useState, useEffect } from 'react';
import HeroSection from '../components/HeroSection';
import ContentRow from '../components/ContentRow';
import { getTrending, getPopularMovies, getPopularTv, getTopRatedMovies, getTopRatedTv } from '../api/tmdb';

export default function HomePage() {
  const [trending, setTrending] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [popularTv, setPopularTv] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [topRatedTv, setTopRatedTv] = useState([]);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="loading-container" style={{ marginTop: 'var(--nav-height)' }}>
        <div className="spinner" />
        <span className="loading-text">Loading StreamVault...</span>
      </div>
    );
  }

  return (
    <div>
      <HeroSection items={trending} />
      <ContentRow title="🔥 Trending Today" items={trending} />
      <ContentRow title="🎬 Popular Movies" items={popularMovies} />
      <ContentRow title="📺 Popular TV Shows" items={popularTv} />
      <ContentRow title="⭐ Top Rated Movies" items={topRatedMovies} />
      <ContentRow title="🏆 Top Rated TV Shows" items={topRatedTv} />
    </div>
  );
}
