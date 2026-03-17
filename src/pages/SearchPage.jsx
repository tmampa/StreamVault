import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ContentCard from '../components/ContentCard';
import { searchMulti, discoverMovies, discoverTv } from '../api/tmdb';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'all';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(type);

  useEffect(() => {
    async function loadResults() {
      setLoading(true);
      try {
        let data;
        if (query) {
          data = await searchMulti(query);
        } else if (filter === 'movie') {
          data = await discoverMovies();
        } else if (filter === 'tv') {
          data = await discoverTv();
        } else {
          data = await discoverMovies();
        }
        let items = data.results || [];
        // Filter by type if searching
        if (query && filter !== 'all') {
          items = items.filter((item) => item.media_type === filter);
        }
        // Filter out people and items without posters
        items = items.filter(
          (item) => item.media_type !== 'person' && (item.poster_path || item.backdrop_path)
        );
        setResults(items);
      } catch (err) {
        console.error('Search error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }
    loadResults();
  }, [query, filter]);

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
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <span className="loading-text">Searching...</span>
        </div>
      ) : results.length === 0 ? (
        <div className="loading-container">
          <span className="loading-text">No results found.</span>
        </div>
      ) : (
        <div className="search-grid">
          {results.map((item) => (
            <ContentCard
              key={item.id}
              item={{
                ...item,
                media_type: item.media_type || filter === 'all' ? item.media_type : filter,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
