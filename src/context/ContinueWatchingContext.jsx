/* eslint-disable react-refresh/only-export-components -- context module exports hook + provider */
import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  applyContinueWatchingProgress,
  mergeContinueWatchingEntry,
  normalizeContinueWatchingItems,
  removeContinueWatchingEntry,
} from './continueWatching';

const ContinueWatchingContext = createContext();
const STORAGE_KEY = 'owl_continue';
const LEGACY_KEY = 'streamvault_continue';
const LEGACY_KEY_2 = 'stephinah_continue';

function loadItems() {
  try {
    const next = localStorage.getItem(STORAGE_KEY);
    if (next) {
      const normalizedItems = normalizeContinueWatchingItems(JSON.parse(next) || []);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedItems));
      return normalizedItems;
    }
    // Migrate from previous brand keys
    for (const key of [LEGACY_KEY, LEGACY_KEY_2]) {
      const legacy = localStorage.getItem(key);
      if (legacy) {
        const normalizedItems = normalizeContinueWatchingItems(JSON.parse(legacy) || []);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedItems));
        localStorage.removeItem(key);
        return normalizedItems;
      }
    }
    return [];
  } catch {
    return [];
  }
}

function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeContinueWatchingItems(items)));
}

export function ContinueWatchingProvider({ children }) {
  const [items, setItems] = useState(loadItems);

  const addToHistory = useCallback((entry) => {
    setItems((prev) => {
      const updated = mergeContinueWatchingEntry(prev, entry);
      saveItems(updated);
      return updated;
    });
  }, []);

  const updateProgress = useCallback((entry, progressSnapshot) => {
    setItems((prev) => {
      const updated = applyContinueWatchingProgress(prev, entry, progressSnapshot);
      saveItems(updated);
      return updated;
    });
  }, []);

  const removeFromHistory = useCallback((entry) => {
    setItems((prev) => {
      const updated = removeContinueWatchingEntry(prev, entry);
      saveItems(updated);
      return updated;
    });
  }, []);

  const value = useMemo(
    () => ({ items, addToHistory, updateProgress, removeFromHistory }),
    [items, addToHistory, updateProgress, removeFromHistory],
  );

  return (
    <ContinueWatchingContext.Provider value={value}>
      {children}
    </ContinueWatchingContext.Provider>
  );
}

export function useContinueWatching() {
  return useContext(ContinueWatchingContext);
}
