import { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Search, X, TrendingUp, Clock } from 'lucide-react';
import ContentCard from '../components/ContentCard';
import PreviewModal from '../components/PreviewModal';
import SkeletonCard from '../components/SkeletonCard';
import { searchMulti, discoverMovies, discoverTv, getMovieGenres, getTvGenres, getTrending } from '../api/tmdb';
import { getRecentSearches, saveRecentSearch, clearRecentSearches } from '../components/Navbar';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'all';
  const [results, setResults] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState(type);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [modalItem, setModalItem] = useState(null);
  const [localQuery, setLocalQuery] = useState(query);
  const [recentSearches, setRecentSearches] = useState(getRecentSearches);
  const loaderRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Sync local input with URL query
  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

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

  // Load trending content for empty-query state
  useEffect(() => {
    if (query) return;
    async function loadTrending() {
      try {
        const data = await getTrending('all', 'week');
        setTrending((data.results || []).filter((r) => r.poster_path).slice(0, 20));
      } catch {
        // non-critical
      }
    }
    loadTrending();
  }, [query]);

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
        setError(err instanceof Error ? err.message : 'Failed to load results. Please try again.');
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

  const handleInputChange = useCallback(
    (e) => {
      const val = e.target.value;
      setLocalQuery(val);
      clearTimeout(debounceRef.current);
      if (val.trim()) {
        debounceRef.current = setTimeout(() => {
          navigate(`/search?q=${encodeURIComponent(val.trim())}`, { replace: true });
        }, 400);
      } else {
        debounceRef.current = setTimeout(() => {
          navigate('/search', { replace: true });
        }, 400);
      }
    },
    [navigate]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    if (localQuery.trim()) {
      saveRecentSearch(localQuery.trim());
      setRecentSearches(getRecentSearches());
      navigate(`/search?q=${encodeURIComponent(localQuery.trim())}`);
    }
  };

  const handleClear = () => {
    setLocalQuery('');
    clearTimeout(debounceRef.current);
    navigate('/search', { replace: true });
    inputRef.current?.focus();
  };

  const handleRecentClick = (q) => {
    setLocalQuery(q);
    saveRecentSearch(q);
    setRecentSearches(getRecentSearches());
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  const pageTitle = query
    ? `Results for "${query}"`
    : filter === 'movie'
    ? 'Popular Movies'
    : filter === 'tv'
    ? 'Popular TV Shows'
    : 'Discover';

  const metaDesc = query
    ? `Search results for "${query}" on Owl.`
    : 'Browse and filter movies and TV shows on Owl.';

  return (
    <div className="search-page">
      <Helmet>
        <title>{pageTitle} — Owl</title>
        <meta name="description" content={metaDesc} />
      </Helmet>

      {/* Prominent search bar */}
      <div className="search-page__search-bar">
        <form onSubmit={handleSubmit} className="search-page__search-form">
          <Search size={20} className="search-page__search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="search-page__search-input"
            placeholder="Search for movies, TV shows, people..."
            value={localQuery}
            onChange={handleInputChange}
            autoFocus
          />
          {localQuery && (
            <button type="button" className="search-page__search-clear" onClick={handleClear}>
              <X size={18} />
            </button>
          )}
        </form>
      </div>

      {/* Recent searches chips — shown when no query */}
      {!query && recentSearches.length > 0 && (
        <div className="search-page__recent">
          <div className="search-page__recent-header">
            <Clock size={14} />
            <span>Recent</span>
            <button type="button" onClick={handleClearRecent}>Clear all</button>
          </div>
          <div className="search-page__recent-chips">
            {recentSearches.map((q) => (
              <button key={q} type="button" className="search-page__recent-chip" onClick={() => handleRecentClick(q)}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trending when no query and no type filter */}
      {!query && filter === 'all' && !selectedGenre && trending.length > 0 && !loading && (
        <div className="search-page__trending">
          <h2 className="search-page__trending-title">
            <TrendingUp size={20} /> Trending This Week
          </h2>
          <div className="search-grid search-grid--animated">
            {trending.map((item, i) => (
              <div key={`${item.media_type}-${item.id}`} className="search-grid__item" style={{ animationDelay: `${i * 40}ms` }}>
                <ContentCard item={item} onOpenModal={setModalItem} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters + results header */}
      {(query || filter !== 'all' || selectedGenre) && (
        <>
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
        </>
      )}

      {/* Discover filters when no query */}
      {!query && (filter !== 'all' || selectedGenre) ? null : !query && filter === 'all' && !selectedGenre ? null : null}

      {error && (
        <div className="error-message">
          <span className="error-message__icon"><AlertTriangle size={20} /></span>
          <span>{error}</span>
        </div>
      )}

      {(query || filter !== 'all' || selectedGenre) && (
        <>
          {loading ? (
            <div className="search-grid">
              {Array.from({ length: 12 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="search-page__empty">
              <Search size={48} />
              <h3>No results found</h3>
              <p>Try different keywords or browse popular titles</p>
            </div>
          ) : (
            <>
              <div className="search-grid search-grid--animated">
                {results.map((item, i) => (
                  <div
                    key={`${item.media_type || filter}-${item.id}`}
                    className="search-grid__item"
                    style={{ animationDelay: `${Math.min(i, 19) * 40}ms` }}
                  >
                    <ContentCard
                      item={{
                        ...item,
                        media_type: item.media_type || (filter !== 'all' ? filter : undefined),
                      }}
                      onOpenModal={setModalItem}
                    />
                  </div>
                ))}
              </div>
              {page < totalPages && (
                <div ref={loaderRef} className="loading-container" style={{ minHeight: '100px' }}>
                  {loadingMore && <div className="spinner" />}
                </div>
              )}
            </>
          )}
        </>
      )}

      {modalItem && <PreviewModal item={modalItem} onClose={() => setModalItem(null)} />}
    </div>
  );
}
