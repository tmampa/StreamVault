import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import ContentCard from '../components/ContentCard';
import SkeletonCard from '../components/SkeletonCard';
import { searchMulti, discoverMovies, discoverTv, getMovieGenres, getTvGenres } from '../api/tmdb';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'all';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState(type);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const loaderRef = useRef(null);

  // Load genres for filter dropdown
  useEffect(() => {
    async function loadGenres() {
      try {
        const [movieGenres, tvGenres] = await Promise.all([getMovieGenres(), getTvGenres()]);
        const merged = [...(movieGenres.genres || [])];
        (tvGenres.genres || []).forEach((g) => {
          if (!merged.some((m) => m.id === g.id)) merged.push(g);
        });
        merged.sort((a, b) => a.name.localeCompare(b.name));
        setGenres(merged);
      } catch (err) {
        console.error('Failed to load genres:', err);
      }
    }
    loadGenres();
  }, []);

  // Reset on filter/query/genre change
  useEffect(() => {
    setPage(1);
    setResults([]);
  }, [query, filter, selectedGenre]);

  useEffect(() => {
    async function loadResults() {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        let data;
        const genreParam = selectedGenre ? { with_genres: selectedGenre } : {};
        if (query) {
          data = await searchMulti(query, page);
        } else if (filter === 'movie') {
          data = await discoverMovies({ page, ...genreParam });
        } else if (filter === 'tv') {
          data = await discoverTv({ page, ...genreParam });
        } else {
          data = await discoverMovies({ page, ...genreParam });
        }
        let items = data.results || [];
        if (query && filter !== 'all') {
          items = items.filter((item) => item.media_type === filter);
        }
        items = items.filter(
          (item) => item.media_type !== 'person' && (item.poster_path || item.backdrop_path)
        );
        setResults((prev) => (page === 1 ? items : [...prev, ...items]));
        setTotalPages(data.total_pages || 1);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to load results. Please try again.');
        if (page === 1) setResults([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    }
    loadResults();
  }, [query, filter, page, selectedGenre]);

  // Infinite scroll
  useEffect(() => {
    const node = loaderRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !loadingMore && page < totalPages) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loading, loadingMore, page, totalPages]);

  const pageTitle = query
    ? `Results for "${query}"`
    : filter === 'movie'
    ? 'Popular Movies'
    : filter === 'tv'
    ? 'Popular TV Shows'
    : 'Discover';

  return (
    <div className="search-page">
      <div className="search-page__header">
        <h1 className="search-page__title">{pageTitle}</h1>
        <p className="search-page__count">{results.length} results</p>
      </div>

      <div className="search-page__filters">
        {['all', 'movie', 'tv'].map((f) => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f === 'movie' ? 'Movies' : 'TV Shows'}
          </button>
        ))}
        {!query && (
          <select
            className="genre-select"
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
          >
            <option value="">All Genres</option>
            {genres.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div className="error-message">
          <span className="error-message__icon">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="search-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="loading-container">
          <span className="loading-text">No results found.</span>
        </div>
      ) : (
        <>
          <div className="search-grid">
            {results.map((item) => (
              <ContentCard
                key={`${item.media_type || filter}-${item.id}`}
                item={{
                  ...item,
                  media_type: item.media_type || (filter !== 'all' ? filter : undefined),
                }}
              />
            ))}
          </div>
          {page < totalPages && (
            <div ref={loaderRef} className="loading-container" style={{ minHeight: '100px' }}>
              {loadingMore && <div className="spinner" />}
            </div>
          )}
        </>
      )}
    </div>
  );
}
