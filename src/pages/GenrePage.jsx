import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import ContentCard from '../components/ContentCard';
import SkeletonCard from '../components/SkeletonCard';
import { discoverMovies, discoverTv, getMovieGenres, getTvGenres } from '../api/tmdb';

export default function GenrePage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const type = searchParams.get('type') || 'movie';
  const [results, setResults] = useState([]);
  const [genreName, setGenreName] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);

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
  }, [id, type]);

  useEffect(() => {
    async function loadResults() {
      setLoading(true);
      setError(null);
      try {
        const discover = type === 'tv' ? discoverTv : discoverMovies;
        const data = await discover({ with_genres: id, page });
        setResults((prev) => (page === 1 ? data.results || [] : [...prev, ...(data.results || [])]));
        setTotalPages(data.total_pages || 1);
      } catch (err) {
        console.error('Failed to load genre results:', err);
        setError('Failed to load results. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadResults();
  }, [id, type, page]);

  const handleTypeChange = (newType) => {
    setSearchParams({ type: newType });
  };

  return (
    <div className="search-page">
      <div className="search-page__header">
        <h1 className="search-page__title">
          {genreName || 'Genre'} {type === 'tv' ? 'TV Shows' : 'Movies'}
        </h1>
        <p className="search-page__count">{results.length} results</p>
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
      </div>

      {error && (
        <div className="error-message">
          <span className="error-message__icon">⚠</span>
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
