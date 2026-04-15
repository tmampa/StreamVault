export const MAX_CONTINUE_WATCHING_ITEMS = 20;

function toFiniteNumber(value, fallback = 0) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeItem(rawItem, now = Date.now()) {
  if (!rawItem || typeof rawItem !== 'object' || rawItem.id == null) {
    return null;
  }

  const mediaType = rawItem.media_type === 'movie' ? 'movie' : 'tv';
  const progressSeconds = Math.max(0, Math.floor(toFiniteNumber(rawItem.progressSeconds)));
  const durationSeconds = Math.max(0, Math.floor(toFiniteNumber(rawItem.durationSeconds)));
  const percentFromDuration = durationSeconds > 0 ? (progressSeconds / durationSeconds) * 100 : 0;
  const progressPercent = clamp(toFiniteNumber(rawItem.progressPercent, percentFromDuration), 0, 100);
  const updatedAt = Math.max(0, Math.floor(toFiniteNumber(rawItem.updatedAt, now)));

  return {
    ...rawItem,
    media_type: mediaType,
    progressSeconds,
    durationSeconds,
    progressPercent,
    updatedAt,
  };
}

export function getContinueWatchingKey(item) {
  if (!item || item.id == null) {
    return null;
  }

  return item.media_type === 'movie' ? `movie-${item.id}` : `tv-${item.id}`;
}

export function normalizeContinueWatchingItems(items, now = Date.now()) {
  if (!Array.isArray(items)) {
    return [];
  }

  const dedupedItems = new Map();

  items.forEach((rawItem) => {
    const item = normalizeItem(rawItem, now);
    const key = getContinueWatchingKey(item);

    if (!item || !key) {
      return;
    }

    const existingItem = dedupedItems.get(key);
    if (!existingItem || item.updatedAt > existingItem.updatedAt) {
      dedupedItems.set(key, item);
    }
  });

  return Array.from(dedupedItems.values())
    .sort((left, right) => right.updatedAt - left.updatedAt)
    .slice(0, MAX_CONTINUE_WATCHING_ITEMS);
}

function upsertItem(items, entry) {
  const key = getContinueWatchingKey(entry);

  if (!key) {
    return normalizeContinueWatchingItems(items);
  }

  const existingItems = normalizeContinueWatchingItems(items);
  return normalizeContinueWatchingItems([
    entry,
    ...existingItems.filter((item) => getContinueWatchingKey(item) !== key),
  ]);
}

export function mergeContinueWatchingEntry(items, entry, now = Date.now()) {
  const existingItems = normalizeContinueWatchingItems(items, now);
  const key = getContinueWatchingKey(entry);
  const existingEntry = existingItems.find((item) => getContinueWatchingKey(item) === key) || null;
  const isSameTvEpisode =
    entry.media_type !== 'tv' ||
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
  const key = getContinueWatchingKey(entry);
  const existingEntry = existingItems.find((item) => getContinueWatchingKey(item) === key) || null;

  if (!key) {
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
  const key = getContinueWatchingKey(entry);

  if (!key) {
    return normalizeContinueWatchingItems(items);
  }

  return normalizeContinueWatchingItems(items).filter((item) => getContinueWatchingKey(item) !== key);
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