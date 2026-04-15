import { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, Search, X, TrendingUp, Clock, SlidersHorizontal } from 'lucide-react';
import ContentCard from '../components/ContentCard';
import PreviewModal from '../components/PreviewModal';
import SkeletonCard from '../components/SkeletonCard';
import { searchMulti, discoverMovies, discoverTv, getMovieGenres, getTvGenres, getTrending } from '../api/tmdb';
import {
  applyContentFilters,
  buildDiscoverParams,
  DEFAULT_DISCOVERY_SORT,
  LANGUAGE_OPTIONS,
  RATING_OPTIONS,
  SORT_OPTIONS,
  YEAR_OPTIONS,
} from '../discoveryFilters';
import { getRecentSearches, saveRecentSearch, clearRecentSearches } from '../recentSearches';

const DEFAULT_TYPE = 'all';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || DEFAULT_TYPE;
  const selectedGenre = searchParams.get('genre') || '';
  const selectedSort = searchParams.get('sort') || DEFAULT_DISCOVERY_SORT;
  const minRating = searchParams.get('rating') || '';
  const selectedYear = searchParams.get('year') || '';
  const selectedLanguage = searchParams.get('language') || '';
  const [results, setResults] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  const [genres, setGenres] = useState([]);
  const [modalItem, setModalItem] = useState(null);
  const [localQuery, setLocalQuery] = useState(query);
  const [recentSearches, setRecentSearches] = useState(getRecentSearches);
  const loaderRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const hasActiveFilters =
    type !== DEFAULT_TYPE ||
    Boolean(selectedGenre) ||
    Boolean(minRating) ||
    Boolean(selectedYear) ||
    Boolean(selectedLanguage) ||
    selectedSort !== DEFAULT_DISCOVERY_SORT;

  const updateSearchParams = useCallback((updates, options = {}) => {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      const nextValue = value == null ? '' : String(value);

      if (
        nextValue === '' ||
        (key === 'type' && nextValue === DEFAULT_TYPE) ||
        (key === 'sort' && nextValue === DEFAULT_DISCOVERY_SORT)
      ) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, nextValue);
      }
    });

    setSearchParams(nextParams, { replace: options.replace ?? true });
  }, [searchParams, setSearchParams]);

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
    if (query || hasActiveFilters) return;
    async function loadTrending() {
      try {
        const data = await getTrending('all', 'week');
        setTrending((data.results || []).filter((r) => r.poster_path).slice(0, 20));
      } catch {
        // non-critical
      }
    }
    loadTrending();
  }, [query, hasActiveFilters]);

  // Reset on query/filter changes
  useEffect(() => {
    setPage(1);
    setResults([]);
  }, [query, type, selectedGenre, selectedSort, minRating, selectedYear, selectedLanguage]);

  useEffect(() => {
    if (!query && !hasActiveFilters) {
      setLoading(false);
      setLoadingMore(false);
      setError(null);
      setResults([]);
      setTotalPages(1);
      return undefined;
    }

    let cancelled = false;

    async function loadResults() {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      try {
        const filterConfig = {
          type,
          genre: selectedGenre,
          minRating,
          year: selectedYear,
          language: selectedLanguage,
          sort: selectedSort,
        };

        let incomingItems = [];
        let nextTotalPages = 1;

        if (query) {
          const data = await searchMulti(query, page);
          incomingItems = data.results || [];
          nextTotalPages = data.total_pages || 1;
        } else if (type === DEFAULT_TYPE) {
          const [movieData, tvData] = await Promise.all([
            discoverMovies(buildDiscoverParams({
              page,
              mediaType: 'movie',
              genre: selectedGenre,
              minRating,
              year: selectedYear,
              language: selectedLanguage,
              sort: selectedSort,
            })),
            discoverTv(buildDiscoverParams({
              page,
              mediaType: 'tv',
              genre: selectedGenre,
              minRating,
              year: selectedYear,
              language: selectedLanguage,
              sort: selectedSort,
            })),
          ]);

          incomingItems = [
            ...(movieData.results || []).map((item) => ({ ...item, media_type: 'movie' })),
            ...(tvData.results || []).map((item) => ({ ...item, media_type: 'tv' })),
          ];
          nextTotalPages = Math.max(movieData.total_pages || 1, tvData.total_pages || 1);
        } else {
          const discover = type === 'tv' ? discoverTv : discoverMovies;
          const data = await discover(buildDiscoverParams({
            page,
            mediaType: type,
            genre: selectedGenre,
            minRating,
            year: selectedYear,
            language: selectedLanguage,
            sort: selectedSort,
          }));

          incomingItems = (data.results || []).map((item) => ({ ...item, media_type: type }));
          nextTotalPages = data.total_pages || 1;
        }

        if (cancelled) {
          return;
        }

        setResults((prev) => applyContentFilters(page === 1 ? incomingItems : [...prev, ...incomingItems], filterConfig));
        setTotalPages(nextTotalPages);
      } catch (err) {
        console.error('Search error:', err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load results. Please try again.');
          if (page === 1) setResults([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    }

    loadResults();

    return () => {
      cancelled = true;
    };
  }, [query, type, page, selectedGenre, selectedSort, minRating, selectedYear, selectedLanguage, hasActiveFilters]);

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
          updateSearchParams({ q: val.trim() }, { replace: true });
        }, 400);
      } else {
        debounceRef.current = setTimeout(() => {
          updateSearchParams({ q: null }, { replace: true });
        }, 400);
      }
    },
    [updateSearchParams]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    if (localQuery.trim()) {
      saveRecentSearch(localQuery.trim());
      setRecentSearches(getRecentSearches());
      updateSearchParams({ q: localQuery.trim() }, { replace: false });
    }
  };

  const handleClear = () => {
    setLocalQuery('');
    clearTimeout(debounceRef.current);
    updateSearchParams({ q: null }, { replace: true });
    inputRef.current?.focus();
  };

  const handleRecentClick = (q) => {
    setLocalQuery(q);
    saveRecentSearch(q);
    setRecentSearches(getRecentSearches());
    updateSearchParams({ q }, { replace: false });
  };

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  const handleResetFilters = () => {
    updateSearchParams(
      {
        type: DEFAULT_TYPE,
        genre: '',
        sort: DEFAULT_DISCOVERY_SORT,
        rating: '',
        year: '',
        language: '',
      },
      { replace: false },
    );
  };

  const pageTitle = query
    ? `Results for "${query}"`
    : type === 'movie'
    ? 'Popular Movies'
    : type === 'tv'
    ? 'Popular TV Shows'
    : 'Discover';

  const metaDesc = query
    ? `Search results for "${query}" on TM.`
    : 'Browse and filter movies and TV shows on TM.';

  return (
    <div className="search-page">
      <Helmet>
        <title>{pageTitle} — TM</title>
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

      <div className="search-page__filters-panel">
        <div className="search-page__filters-meta">
          <span className="search-page__filters-label">
            <SlidersHorizontal size={16} /> Refine Discovery
          </span>
          {hasActiveFilters && (
            <button type="button" className="search-page__filters-reset" onClick={handleResetFilters}>
              Reset filters
            </button>
          )}
        </div>

        <div className="search-page__filters">
          {['all', 'movie', 'tv'].map((nextType) => (
            <button
              key={nextType}
              className={`filter-btn ${type === nextType ? 'active' : ''}`}
              onClick={() => updateSearchParams({ type: nextType }, { replace: true })}
            >
              {nextType === 'all' ? 'All' : nextType === 'movie' ? 'Movies' : 'TV Shows'}
            </button>
          ))}
          <div className="search-page__filter-selects">
            <select
              className="genre-select search-page__filter-select"
              value={selectedGenre}
              onChange={(e) => updateSearchParams({ genre: e.target.value }, { replace: true })}
            >
              <option value="">All Genres</option>
              {genres.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.name}
                </option>
              ))}
            </select>

            <select
              className="genre-select search-page__filter-select"
              value={selectedSort}
              onChange={(e) => updateSearchParams({ sort: e.target.value }, { replace: true })}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              className="genre-select search-page__filter-select"
              value={minRating}
              onChange={(e) => updateSearchParams({ rating: e.target.value }, { replace: true })}
            >
              {RATING_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              className="genre-select search-page__filter-select"
              value={selectedYear}
              onChange={(e) => updateSearchParams({ year: e.target.value }, { replace: true })}
            >
              <option value="">All Years</option>
              {YEAR_OPTIONS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <select
              className="genre-select search-page__filter-select"
              value={selectedLanguage}
              onChange={(e) => updateSearchParams({ language: e.target.value }, { replace: true })}
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="search-page__filter-hint">
          Search results are refined client-side. Discovery results use TMDB filters directly when available.
        </p>
      </div>

      {/* Trending when no query and no active filters */}
      {!query && !hasActiveFilters && trending.length > 0 && !loading && (
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

      {(query || hasActiveFilters) && (
        <>
          <div className="search-page__header">
            <h1 className="search-page__title">{pageTitle}</h1>
            <p className="search-page__count">Showing {results.length} results</p>
          </div>
        </>
      )}

      {error && (
        <div className="error-message">
          <span className="error-message__icon"><AlertTriangle size={20} /></span>
          <span>{error}</span>
        </div>
      )}

      {(query || hasActiveFilters) && (
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
              <p>{hasActiveFilters ? 'Try broadening your filters or switching the content type.' : 'Try different keywords or browse popular titles.'}</p>
            </div>
          ) : (
            <>
              <div className="search-grid search-grid--animated">
                {results.map((item, i) => (
                  <div
                    key={`${item.media_type || type}-${item.id}`}
                    className="search-grid__item"
                    style={{ animationDelay: `${Math.min(i, 19) * 40}ms` }}
                  >
                    <ContentCard
                      item={{
                        ...item,
                        media_type: item.media_type || (type !== DEFAULT_TYPE ? type : undefined),
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
