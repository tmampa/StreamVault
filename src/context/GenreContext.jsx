import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getMovieGenres, getTvGenres } from '../api/tmdb';

const GenreContext = createContext({});

export function GenreProvider({ children }) {
  const [genreMap, setGenreMap] = useState({});

  useEffect(() => {
    async function loadGenres() {
      try {
        const [movieRes, tvRes] = await Promise.all([getMovieGenres(), getTvGenres()]);
        const map = {};
        [...(movieRes.genres || []), ...(tvRes.genres || [])].forEach((g) => {
          map[g.id] = g.name;
        });
        setGenreMap(map);
      } catch {
        // Genres are optional — cards work without them
      }
    }
    loadGenres();
  }, []);

  const value = useMemo(() => genreMap, [genreMap]);

  return (
    <GenreContext.Provider value={value}>
      {children}
    </GenreContext.Provider>
  );
}

export function useGenres() {
  return useContext(GenreContext);
}
