/* eslint-disable react-refresh/only-export-components -- context module exports hook + provider */
import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const ContinueWatchingContext = createContext();
const STORAGE_KEY = 'owl_continue';
const LEGACY_KEY = 'streamvault_continue';
const LEGACY_KEY_2 = 'stephinah_continue';
const MAX_ITEMS = 20;

function loadItems() {
  try {
    const next = localStorage.getItem(STORAGE_KEY);
    if (next) return JSON.parse(next) || [];
    // Migrate from previous brand keys
    for (const key of [LEGACY_KEY, LEGACY_KEY_2]) {
      const legacy = localStorage.getItem(key);
      if (legacy) {
        localStorage.setItem(STORAGE_KEY, legacy);
        localStorage.removeItem(key);
        return JSON.parse(legacy) || [];
      }
    }
    return [];
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

  const removeFromHistory = useCallback((entry) => {
    setItems((prev) => {
      const key = getKey(entry);
      const updated = prev.filter((i) => getKey(i) !== key);
      saveItems(updated);
      return updated;
    });
  }, []);

  const value = useMemo(() => ({ items, addToHistory, removeFromHistory }), [items, addToHistory, removeFromHistory]);

  return (
    <ContinueWatchingContext.Provider value={value}>
      {children}
    </ContinueWatchingContext.Provider>
  );
}

export function useContinueWatching() {
  return useContext(ContinueWatchingContext);
}
