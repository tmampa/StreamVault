export const MAX_CONTINUE_WATCHING_ITEMS = 20;

function toFiniteNumber(value, fallback = 0) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeIdentitySegment(value) {
  if (value == null) {
    return '';
  }

  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getNormalizedMediaType(item) {
  const rawMedia = item?.media_type ?? item?.mediaType ?? item?.type;
  const normalizedMedia = String(rawMedia ?? '').toLowerCase();

  if (normalizedMedia === 'movie') {
    return 'movie';
  }

  if (
    normalizedMedia === 'tv' ||
    item?.season != null ||
    item?.episode != null ||
    item?.first_air_date != null ||
    item?.firstAirDate != null ||
    item?.name != null
  ) {
    return 'tv';
  }

  if (item?.title != null || item?.release_date != null || item?.releaseDate != null) {
    return 'movie';
  }

  return 'tv';
}

function getNormalizedReleaseYear(item) {
  const rawDate = item?.first_air_date ?? item?.firstAirDate ?? item?.release_date ?? item?.releaseDate;
  const year = String(rawDate ?? '').slice(0, 4);

  return /^\d{4}$/.test(year) ? year : '';
}

function getNormalizedPosterPath(item) {
  return normalizeIdentitySegment(item?.poster_path ?? item?.posterPath);
}

function getTvSeriesIdentity(item) {
  const title = item?.name ?? item?.title;
  const normalizedTitle = normalizeIdentitySegment(title);

  if (!normalizedTitle) {
    return null;
  }

  const year = getNormalizedReleaseYear(item);
  const posterPath = getNormalizedPosterPath(item);

  return [normalizedTitle, year, posterPath].filter(Boolean).join(':');
}

function getExplicitTvSeriesId(item) {
  const rawId = item?.tmdb_id ?? item?.tmdbId ?? item?.show_id ?? item?.showId ?? item?.series_id ?? item?.seriesId;

  if (rawId == null) {
    return null;
  }

  return Number.isFinite(Number(rawId)) ? Number(rawId) : rawId;
}

function getCanonicalItemId(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const mediaType = getNormalizedMediaType(item);
  const rawId =
    mediaType === 'movie'
      ? item.tmdb_id ?? item.tmdbId ?? item.movie_id ?? item.movieId ?? item.id
      : item.tmdb_id
        ?? item.tmdbId
        ?? item.show_id
        ?? item.showId
        ?? item.series_id
        ?? item.seriesId
        ?? item.id
        ?? item.episode_id
        ?? item.episodeId;

  if (rawId == null) {
    return null;
  }

  return Number.isFinite(Number(rawId)) ? Number(rawId) : rawId;
}

function areLikelySameTvSeries(leftItem, rightItem) {
  const leftSeriesId = getExplicitTvSeriesId(leftItem);
  const rightSeriesId = getExplicitTvSeriesId(rightItem);

  if (leftSeriesId != null && rightSeriesId != null) {
    return String(leftSeriesId) === String(rightSeriesId);
  }

  const leftTitle = normalizeIdentitySegment(leftItem?.name ?? leftItem?.title);
  const rightTitle = normalizeIdentitySegment(rightItem?.name ?? rightItem?.title);

  if (!leftTitle || leftTitle !== rightTitle) {
    return false;
  }

  const leftYear = getNormalizedReleaseYear(leftItem);
  const rightYear = getNormalizedReleaseYear(rightItem);

  if (leftYear && rightYear && leftYear !== rightYear) {
    return false;
  }

  const leftPosterPath = getNormalizedPosterPath(leftItem);
  const rightPosterPath = getNormalizedPosterPath(rightItem);

  if (leftPosterPath && rightPosterPath && leftPosterPath !== rightPosterPath) {
    return false;
  }

  return true;
}

export function isSameContinueWatchingItem(leftItem, rightItem) {
  if (!leftItem || !rightItem) {
    return false;
  }

  const leftMediaType = getNormalizedMediaType(leftItem);
  const rightMediaType = getNormalizedMediaType(rightItem);

  if (leftMediaType !== rightMediaType) {
    return false;
  }

  if (leftMediaType === 'tv' && areLikelySameTvSeries(leftItem, rightItem)) {
    return true;
  }

  const leftId = getCanonicalItemId(leftItem);
  const rightId = getCanonicalItemId(rightItem);

  return leftId != null && rightId != null && String(leftId) === String(rightId);
}

function mergeMatchingItems(existingItem, incomingItem, now = Date.now()) {
  const existingUpdatedAt = toFiniteNumber(existingItem?.updatedAt);
  const incomingUpdatedAt = toFiniteNumber(incomingItem?.updatedAt);
  const shouldPreferIncoming = incomingUpdatedAt >= existingUpdatedAt;
  const preferredItem = shouldPreferIncoming ? incomingItem : existingItem;
  const fallbackItem = shouldPreferIncoming ? existingItem : incomingItem;

  return normalizeItem(
    {
      ...fallbackItem,
      ...preferredItem,
      updatedAt: Math.max(existingUpdatedAt, incomingUpdatedAt, now),
    },
    now,
  );
}

function normalizeItem(rawItem, now = Date.now()) {
  if (!rawItem || typeof rawItem !== 'object') {
    return null;
  }

  const id = getCanonicalItemId(rawItem);
  if (id == null) {
    return null;
  }

  const mediaType = getNormalizedMediaType(rawItem);

  const progressSeconds = Math.max(0, Math.floor(toFiniteNumber(rawItem.progressSeconds)));
  const durationSeconds = Math.max(0, Math.floor(toFiniteNumber(rawItem.durationSeconds)));
  const percentFromDuration = durationSeconds > 0 ? (progressSeconds / durationSeconds) * 100 : 0;
  const progressPercent = clamp(toFiniteNumber(rawItem.progressPercent, percentFromDuration), 0, 100);
  const updatedAt = Math.max(0, Math.floor(toFiniteNumber(rawItem.updatedAt, now)));

  return {
    ...rawItem,
    id,
    media_type: mediaType,
    progressSeconds,
    durationSeconds,
    progressPercent,
    updatedAt,
  };
}

export function getContinueWatchingKey(item) {
  if (!item) return null;

  const mediaType = getNormalizedMediaType(item);

  if (mediaType === 'tv') {
    const seriesIdentity = getTvSeriesIdentity(item);
    if (seriesIdentity) {
      return `tv-${seriesIdentity}`;
    }
  }

  const id = getCanonicalItemId(item);
  if (id == null) {
    return null;
  }

  return `${mediaType}-${String(id)}`;
}

export function findContinueWatchingItem(items, entry) {
  if (!Array.isArray(items)) {
    return null;
  }

  return items.find((item) => isSameContinueWatchingItem(item, entry)) || null;
}

export function normalizeContinueWatchingItems(items, now = Date.now()) {
  if (!Array.isArray(items)) {
    return [];
  }

  const dedupedItems = [];

  items.forEach((rawItem) => {
    const item = normalizeItem(rawItem, now);

    if (!item) {
      return;
    }

    const existingIndex = dedupedItems.findIndex((existingItem) => isSameContinueWatchingItem(existingItem, item));

    if (existingIndex === -1) {
      dedupedItems.push(item);
      return;
    }

    dedupedItems[existingIndex] = mergeMatchingItems(dedupedItems[existingIndex], item, now);
  });

  return dedupedItems
    .sort((left, right) => right.updatedAt - left.updatedAt)
    .slice(0, MAX_CONTINUE_WATCHING_ITEMS);
}

function upsertItem(items, entry) {
  const normalizedEntry = normalizeItem(entry);

  if (!normalizedEntry) {
    return normalizeContinueWatchingItems(items);
  }

  const existingItems = normalizeContinueWatchingItems(items);
  return normalizeContinueWatchingItems([
    normalizedEntry,
    ...existingItems.filter((item) => !isSameContinueWatchingItem(item, normalizedEntry)),
  ]);
}

export function mergeContinueWatchingEntry(items, entry, now = Date.now()) {
  const existingItems = normalizeContinueWatchingItems(items, now);
  const existingEntry = findContinueWatchingItem(existingItems, entry);
  const isSameTvEpisode =
    getNormalizedMediaType(entry) !== 'tv' ||
    (existingEntry && existingEntry.season === entry.season && existingEntry.episode === entry.episode);

  const mergedEntry = normalizeItem(
    {
      ...existingEntry,
      ...entry,
      progressSeconds: isSameTvEpisode ? existingEntry?.progressSeconds ?? 0 : 0,
      durationSeconds: isSameTvEpisode ? existingEntry?.durationSeconds ?? 0 : 0,
      progressPercent: isSameTvEpisode ? existingEntry?.progressPercent ?? 0 : 0,
      updatedAt: now,
    },
    now,
  );

  return upsertItem(existingItems, mergedEntry);
}

export function applyContinueWatchingProgress(items, entry, progressSnapshot, now = Date.now()) {
  const existingItems = normalizeContinueWatchingItems(items, now);
  const existingEntry = findContinueWatchingItem(existingItems, entry);
  const normalizedEntry = normalizeItem(entry, now);

  if (!normalizedEntry) {
    return existingItems;
  }

  const mergedEntry = normalizeItem(
    {
      ...existingEntry,
      ...entry,
      ...progressSnapshot,
      updatedAt: now,
    },
    now,
  );

  return upsertItem(existingItems, mergedEntry);
}

export function removeContinueWatchingEntry(items, entry) {
  return normalizeContinueWatchingItems(items).filter((item) => !isSameContinueWatchingItem(item, entry));
}

export function createProgressSnapshot(playerEvent) {
  const progressSeconds = Math.max(0, Math.floor(toFiniteNumber(playerEvent?.currentTime)));
  const durationSeconds = Math.max(0, Math.floor(toFiniteNumber(playerEvent?.duration)));
  const derivedPercent = durationSeconds > 0 ? (progressSeconds / durationSeconds) * 100 : 0;
  const progressPercent = clamp(toFiniteNumber(playerEvent?.progress, derivedPercent), 0, 100);

  return {
    progressSeconds,
    durationSeconds,
    progressPercent,
  };
}
