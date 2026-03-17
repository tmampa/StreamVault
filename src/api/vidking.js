const VIDKING_BASE = 'https://www.vidking.net/embed';

export function getMovieEmbedUrl(tmdbId, options = {}) {
  const url = new URL(`${VIDKING_BASE}/movie/${tmdbId}`);
  if (options.color) url.searchParams.set('color', options.color);
  if (options.autoplay) url.searchParams.set('autoplay', '1');
  return url.toString();
}

export function getTvEmbedUrl(tmdbId, season, episode, options = {}) {
  const url = new URL(`${VIDKING_BASE}/tv/${tmdbId}/${season}/${episode}`);
  if (options.color) url.searchParams.set('color', options.color);
  if (options.autoplay) url.searchParams.set('autoplay', '1');
  if (options.episodeSelector !== false) url.searchParams.set('episodeSelector', '1');
  if (options.nextEpisodeBtn !== false) url.searchParams.set('nextEpisodeBtn', '1');
  return url.toString();
}

// Default color theme for our app
export const PLAYER_COLOR = '7c3aed';
