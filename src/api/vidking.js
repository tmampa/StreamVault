const VIDKING_BASE = 'https://www.vidking.net/embed';
export const VIDKING_ORIGIN = new URL(VIDKING_BASE).origin;

export function getMovieEmbedUrl(tmdbId, options = {}) {
  const url = new URL(`${VIDKING_BASE}/movie/${tmdbId}`);
  if (options.color) url.searchParams.set('color', options.color);
  if (options.autoplay) url.searchParams.set('autoPlay', 'true');
  if (Number.isFinite(options.progress) && options.progress > 0) url.searchParams.set('progress', String(Math.floor(options.progress)));
  return url.toString();
}

export function getTvEmbedUrl(tmdbId, season, episode, options = {}) {
  const url = new URL(`${VIDKING_BASE}/tv/${tmdbId}/${season}/${episode}`);
  if (options.color) url.searchParams.set('color', options.color);
  if (options.autoplay) url.searchParams.set('autoPlay', 'true');
  if (Number.isFinite(options.progress) && options.progress > 0) url.searchParams.set('progress', String(Math.floor(options.progress)));
  if (options.episodeSelector !== false) url.searchParams.set('episodeSelector', 'true');
  if (options.nextEpisodeBtn !== false) url.searchParams.set('nextEpisode', 'true');
  return url.toString();
}

export function parsePlayerEventMessage(messageEvent, expectedSource) {
  if (!messageEvent || messageEvent.origin !== VIDKING_ORIGIN) {
    return null;
  }

  if (expectedSource && messageEvent.source !== expectedSource) {
    return null;
  }

  let payload = messageEvent.data;

  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {
      return null;
    }
  }

  if (!payload || typeof payload !== 'object' || payload.type !== 'PLAYER_EVENT') {
    return null;
  }

  const playerEvent = payload.data;

  if (!playerEvent || typeof playerEvent !== 'object' || typeof playerEvent.event !== 'string') {
    return null;
  }

  return playerEvent;
}

// Default color theme for our app
export const PLAYER_COLOR = '7c3aed';
