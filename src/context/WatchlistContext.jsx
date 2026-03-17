import { createContext, useContext, useState, useEffect } from 'react';

const WatchlistContext = createContext();

export function useWatchlist() {
  return useContext(WatchlistContext);
}

export function WatchlistProvider({ children }) {
  const [watchlist, setWatchlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('stephinah_watchlist')) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('stephinah_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const addToWatchlist = (item) => {
    setWatchlist((prev) => {
      if (prev.some((i) => i.id === item.id && i.media_type === item.media_type)) return prev;
      return [
        ...prev,
        {
          id: item.id,
          media_type: item.media_type,
          title: item.title,
          name: item.name,
          poster_path: item.poster_path,
          vote_average: item.vote_average,
          release_date: item.release_date,
          first_air_date: item.first_air_date,
        },
      ];
    });
  };

  const removeFromWatchlist = (id, mediaType) => {
    setWatchlist((prev) => prev.filter((i) => !(i.id === id && i.media_type === mediaType)));
  };

  const isInWatchlist = (id, mediaType) => {
    return watchlist.some((i) => i.id === id && i.media_type === mediaType);
  };

  return (
    <WatchlistContext.Provider value={{ watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist }}>
      {children}
    </WatchlistContext.Provider>
  );
}
