import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, SlidersHorizontal } from 'lucide-react';
import ContentCard from '../components/ContentCard';
import SkeletonCard from '../components/SkeletonCard';
import { discoverMovies, discoverTv, getMovieGenres, getTvGenres } from '../api/tmdb';
import {
  buildDiscoverParams,
  DEFAULT_DISCOVERY_SORT,
  DISCOVER_SORT_OPTIONS,
  filterContentItems,
  LANGUAGE_OPTIONS,
  normalizeSortValue,
  RATING_OPTIONS,
  YEAR_OPTIONS,
} from '../discoveryFilters';

const DEFAULT_TYPE = 'movie';

export default function GenrePage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const type = searchParams.get('type') || DEFAULT_TYPE;
  const requestedSort = searchParams.get('sort') || DEFAULT_DISCOVERY_SORT;
  const selectedSort = normalizeSortValue(requestedSort, DISCOVER_SORT_OPTIONS);
  const minRating = searchParams.get('rating') || '';
  const selectedYear = searchParams.get('year') || '';
  const selectedLanguage = searchParams.get('language') || '';
  const [results, setResults] = useState([]);
  const [genreName, setGenreName] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  const hasAdvancedFilters =
    selectedSort !== DEFAULT_DISCOVERY_SORT ||
    Boolean(minRating) ||
    Boolean(selectedYear) ||
    Boolean(selectedLanguage);

  const updateGenreParams = useCallback((updates, options = {}) => {
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

  useEffect(() => {
    if (requestedSort !== selectedSort) {
      updateGenreParams({ sort: selectedSort }, { replace: true });
    }
  }, [requestedSort, selectedSort, updateGenreParams]);

  useEffect(() => {
    async function loadGenreName() {
      try {
        const data = type === 'tv' ? await getTvGenres() : await getMovieGenres();
        const genre = data.genres?.find((g) => g.id === parseInt(id));
        if (genre) setGenreName(genre.name);
      } catch (err) {
        console.error('Failed to load genre name:', err);
      }
    }
    loadGenreName();
  }, [id, type]);

  useEffect(() => {
    setPage(1);
    setResults([]);
  }, [id, type, selectedSort, minRating, selectedYear, selectedLanguage]);

  useEffect(() => {
    let cancelled = false;

    async function loadResults() {
      setLoading(true);
      setError(null);
      try {
        const filterConfig = {
          type,
          genre: id,
          minRating,
          year: selectedYear,
          language: selectedLanguage,
        };
        const discover = type === 'tv' ? discoverTv : discoverMovies;
        const data = await discover(buildDiscoverParams({
          page,
          mediaType: type,
          genre: id,
          minRating,
          year: selectedYear,
          language: selectedLanguage,
          sort: selectedSort,
        }));

        if (cancelled) {
          return;
        }

        const filteredIncomingItems = filterContentItems(
          (data.results || []).map((item) => ({ ...item, media_type: type })),
          filterConfig,
        );

        setResults((prev) => (page === 1 ? filteredIncomingItems : [...prev, ...filteredIncomingItems]));
        setTotalPages(data.total_pages || 1);
      } catch (err) {
        console.error('Failed to load genre results:', err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load results. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    loadResults();

    return () => {
      cancelled = true;
    };
  }, [id, type, page, selectedSort, minRating, selectedYear, selectedLanguage]);

  const handleTypeChange = (newType) => {
    updateGenreParams({ type: newType }, { replace: true });
  };

  const handleResetFilters = () => {
    updateGenreParams({ sort: DEFAULT_DISCOVERY_SORT, rating: '', year: '', language: '' }, { replace: false });
  };

  const heading = `${genreName || 'Genre'} ${type === 'tv' ? 'TV Shows' : 'Movies'}`;

  return (
    <div className="search-page">
      <Helmet>
        <title>{heading} — TM</title>
        <meta name="description" content={`Browse ${heading.toLowerCase()} on TM.`} />
      </Helmet>
      <div className="search-page__header">
        <h1 className="search-page__title">
          {genreName || 'Genre'} {type === 'tv' ? 'TV Shows' : 'Movies'}
        </h1>
        <p className="search-page__count">{results.length} results</p>
      </div>

      <div className="search-page__filters-panel">
        <div className="search-page__filters-meta">
          <span className="search-page__filters-label">
            <SlidersHorizontal size={16} /> Refine This Genre
          </span>
          {hasAdvancedFilters && (
            <button type="button" className="search-page__filters-reset" onClick={handleResetFilters}>
              Reset filters
            </button>
          )}
        </div>

        <div className="search-page__filters">
          <button
            className={`filter-btn ${type === 'movie' ? 'active' : ''}`}
            onClick={() => handleTypeChange('movie')}
          >
            Movies
          </button>
          <button
            className={`filter-btn ${type === 'tv' ? 'active' : ''}`}
            onClick={() => handleTypeChange('tv')}
          >
            TV Shows
          </button>

          <div className="search-page__filter-selects">
            <label className="sr-only" htmlFor="genre-filter-sort">Sort</label>
            <select
              id="genre-filter-sort"
              className="genre-select search-page__filter-select"
              value={selectedSort}
              onChange={(e) => updateGenreParams({ sort: e.target.value }, { replace: true })}
            >
              {DISCOVER_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="genre-filter-rating">Minimum rating</label>
            <select
              id="genre-filter-rating"
              className="genre-select search-page__filter-select"
              value={minRating}
              onChange={(e) => updateGenreParams({ rating: e.target.value }, { replace: true })}
            >
              {RATING_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="genre-filter-year">Release year</label>
            <select
              id="genre-filter-year"
              className="genre-select search-page__filter-select"
              value={selectedYear}
              onChange={(e) => updateGenreParams({ year: e.target.value }, { replace: true })}
            >
              <option value="">All Years</option>
              {YEAR_OPTIONS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="genre-filter-language">Original language</label>
            <select
              id="genre-filter-language"
              className="genre-select search-page__filter-select"
              value={selectedLanguage}
              onChange={(e) => updateGenreParams({ language: e.target.value }, { replace: true })}
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-message__icon"><AlertTriangle size={20} /></span>
          <span>{error}</span>
        </div>
      )}

      {loading && page === 1 ? (
        <div className="search-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : results.length === 0 && !loading ? (
        <div className="loading-container">
          <span className="loading-text">No results found.</span>
        </div>
      ) : (
        <>
          <div className="search-grid">
            {results.map((item) => (
              <ContentCard key={`${type}-${item.id}`} item={{ ...item, media_type: type }} />
            ))}
          </div>
          {loading && (
            <div className="loading-container" style={{ minHeight: '100px' }}>
              <div className="spinner" />
            </div>
          )}
          {!loading && page < totalPages && (
            <div style={{ textAlign: 'center', padding: '20px 0 60px' }}>
              <button className="btn btn--secondary" onClick={() => setPage((p) => p + 1)}>
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
