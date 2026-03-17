import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const ContinueWatchingContext = createContext();
const STORAGE_KEY = 'stephinah_continue';
const MAX_ITEMS = 20;

function loadItems() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function getKey(item) {
  return item.media_type === 'movie'
    ? `movie-${item.id}`
    : `tv-${item.id}-${item.season}-${item.episode}`;
}

export function ContinueWatchingProvider({ children }) {
  const [items, setItems] = useState(loadItems);

  const addToHistory = useCallback((entry) => {
    setItems((prev) => {
      const key = getKey(entry);
      const filtered = prev.filter((i) => getKey(i) !== key);
      const updated = [{ ...entry, updatedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
      saveItems(updated);
      return updated;
    });
  }, []);

  const value = useMemo(() => ({ items, addToHistory }), [items, addToHistory]);

  return (
    <ContinueWatchingContext.Provider value={value}>
      {children}
    </ContinueWatchingContext.Provider>
  );
}

export function useContinueWatching() {
  return useContext(ContinueWatchingContext);
}
