// NOTE: This API key is exposed client-side in the browser.
// TMDB keys are free and low-risk, but never store secrets this way.
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p';

// In-memory API cache (5 min TTL)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

async function fetchTMDB(endpoint, params = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', API_KEY);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });

  const cacheKey = url.toString();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB API error: ${res.status}`);
  const data = await res.json();
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

// Images
export const imgUrl = (path, size = 'w500') =>
  path ? `${IMG_BASE}/${size}${path}` : null;

export const backdropUrl = (path, size = 'w1280') =>
  path ? `${IMG_BASE}/${size}${path}` : null;

// Trending
export const getTrending = (type = 'all', timeWindow = 'day') =>
  fetchTMDB(`/trending/${type}/${timeWindow}`);

// Search
export const searchMulti = (query, page = 1) =>
  fetchTMDB('/search/multi', { query, page });

// Movies
export const getMovieDetails = (id) =>
  fetchTMDB(`/movie/${id}`, { append_to_response: 'credits,videos,similar,images' });

export const getPopularMovies = (page = 1) =>
  fetchTMDB('/movie/popular', { page });

export const getTopRatedMovies = (page = 1) =>
  fetchTMDB('/movie/top_rated', { page });

// TV Shows
export const getTvDetails = (id) =>
  fetchTMDB(`/tv/${id}`, { append_to_response: 'credits,videos,similar,images' });

export const getPopularTv = (page = 1) =>
  fetchTMDB('/tv/popular', { page });

export const getTopRatedTv = (page = 1) =>
  fetchTMDB('/tv/top_rated', { page });

export const getTvSeasonDetails = (tvId, seasonNumber) =>
  fetchTMDB(`/tv/${tvId}/season/${seasonNumber}`);

// Genres
export const getMovieGenres = () => fetchTMDB('/genre/movie/list');
export const getTvGenres = () => fetchTMDB('/genre/tv/list');

// Discover
export const discoverMovies = (params = {}) =>
  fetchTMDB('/discover/movie', { sort_by: 'popularity.desc', ...params });

export const discoverTv = (params = {}) =>
  fetchTMDB('/discover/tv', { sort_by: 'popularity.desc', ...params });
