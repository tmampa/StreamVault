import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import HeroSection from '../components/HeroSection';
import ContentRow from '../components/ContentRow';
import SkeletonCard from '../components/SkeletonCard';
import { useContinueWatching } from '../context/ContinueWatchingContext';
import { AlertTriangle, Play, Flame, Clapperboard, Tv, Star, Trophy, CalendarDays, Sparkles, Globe2, Zap } from 'lucide-react';
import { discoverMovies, discoverTv, getTrending, getPopularMovies, getPopularTv, getTopRatedMovies, getTopRatedTv } from '../api/tmdb';
import { buildDiscoverParams } from '../discoveryFilters';
import { HOME_CURATIONS } from '../homeCurations';

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
  const [curatedRows, setCuratedRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { items: continueWatchingItems, removeFromHistory } = useContinueWatching();

  const rowIcons = {
    'fresh-this-year': CalendarDays,
    'critics-choice-tv': Sparkles,
    'k-drama-spotlight': Globe2,
    'action-night': Zap,
  };

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

        const curatedResults = await Promise.allSettled(
          HOME_CURATIONS.map(async (row) => {
            const discover = row.mediaType === 'tv' ? discoverTv : discoverMovies;
            const data = await discover({
              ...buildDiscoverParams({
                mediaType: row.mediaType,
                genre: row.filters.genre,
                minRating: row.filters.minRating,
                year: row.filters.year,
                language: row.filters.language,
                sort: row.filters.sort,
              }),
              ...row.extraParams,
            });

            return {
              ...row,
              items: (data.results || []).map((item) => ({ ...item, media_type: row.mediaType })),
            };
          }),
        );

        setTrending(trendRes.results || []);
        setPopularMovies(popMovRes.results || []);
        setPopularTv(popTvRes.results || []);
        setTopRatedMovies(topMovRes.results || []);
        setTopRatedTv(topTvRes.results || []);
        setCuratedRows(
          curatedResults
            .filter((result) => result.status === 'fulfilled' && result.value.items.length > 0)
            .map((result) => result.value),
        );
      } catch (err) {
        console.error('Failed to load homepage data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load content. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div>
        <Helmet>
          <title>TM — Home</title>
          <meta name="description" content="Discover trending movies and TV shows." />
        </Helmet>
        <div className="hero skeleton-hero">
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
      <div style={{ paddingTop: 'var(--nav-height)' }}>
        <Helmet>
          <title>TM — Error</title>
        </Helmet>
        <div className="error-banner">
          <span><AlertTriangle size={16} /> {error}</span>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Helmet>
        <title>TM — Home</title>
        <meta name="description" content="Trending movies and TV, popular picks, and your continue watching list." />
      </Helmet>
      <HeroSection items={trending} />
      {continueWatchingItems.length > 0 && (
        <ContentRow
          title={<><Play size={18} fill="currentColor" /> Continue Watching</>}
          items={continueWatchingItems.map((item) => ({
            ...item,
            linkTo:
              item.media_type === 'movie'
                ? `/watch/movie/${item.id}`
                : `/watch/tv/${item.id}/${item.season}/${item.episode}`,
          }))}
          onRemove={removeFromHistory}
        />
      )}
      <ContentRow title={<><Flame size={18} /> Trending Today</>} items={trending} />
      {curatedRows.map((row) => {
        const RowIcon = rowIcons[row.key] || Sparkles;

        return (
          <ContentRow
            key={row.key}
            title={<><RowIcon size={18} /> {row.label}</>}
            items={row.items}
            seeAllLink={row.seeAllLink}
          />
        );
      })}
      <ContentRow title={<><Clapperboard size={18} /> Popular Movies</>} items={popularMovies} />
      <ContentRow title={<><Tv size={18} /> Popular TV Shows</>} items={popularTv} />
      <ContentRow title={<><Star size={18} /> Top Rated Movies</>} items={topRatedMovies} />
      <ContentRow title={<><Trophy size={18} /> Top Rated TV Shows</>} items={topRatedTv} />
    </div>
  );
}
