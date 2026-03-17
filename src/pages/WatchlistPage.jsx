import { useWatchlist } from '../context/WatchlistContext';
import ContentCard from '../components/ContentCard';

export default function WatchlistPage() {
  const { watchlist } = useWatchlist();

  return (
    <div className="search-page">
      <div className="search-page__header">
        <h1 className="search-page__title">My Watchlist</h1>
        <p className="search-page__count">{watchlist.length} items</p>
      </div>

      {watchlist.length === 0 ? (
        <div className="loading-container">
          <span className="loading-text">
            Your watchlist is empty. Browse movies and shows to add them!
          </span>
        </div>
      ) : (
        <div className="search-grid">
          {watchlist.map((item) => (
            <ContentCard key={`${item.media_type}-${item.id}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
