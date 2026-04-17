export const DEFAULT_DISCOVERY_SORT = 'popularity.desc';

export const SORT_OPTIONS = [
  { value: DEFAULT_DISCOVERY_SORT, label: 'Most Popular' },
  { value: 'rating.desc', label: 'Highest Rated' },
  { value: 'release.desc', label: 'Newest First' },
  { value: 'release.asc', label: 'Oldest First' },
  { value: 'title.asc', label: 'A to Z' },
];

export const DISCOVER_SORT_OPTIONS = SORT_OPTIONS.filter((option) => option.value !== 'title.asc');

export const RATING_OPTIONS = [
  { value: '', label: 'Any Rating' },
  { value: '5', label: '5+ Rating' },
  { value: '6', label: '6+ Rating' },
  { value: '7', label: '7+ Rating' },
  { value: '8', label: '8+ Rating' },
];

export const LANGUAGE_OPTIONS = [
  { value: '', label: 'All Languages' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'hi', label: 'Hindi' },
  { value: 'it', label: 'Italian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'pt', label: 'Portuguese' },
];

export const YEAR_OPTIONS = Array.from(
  { length: new Date().getFullYear() - 1979 },
  (_, index) => String(new Date().getFullYear() - index),
);

function normalizeMediaType(item, fallbackType = 'movie') {
  return item.media_type || fallbackType;
}

function getReleaseDate(item) {
  return item.release_date || item.first_air_date || '';
}

function getTitle(item) {
  return (item.title || item.name || '').toLowerCase();
}

function getYear(item) {
  return getReleaseDate(item).slice(0, 4);
}

function getSortComparator(sort) {
  switch (sort) {
    case 'rating.desc':
      return (left, right) => (right.vote_average || 0) - (left.vote_average || 0);
    case 'release.desc':
      return (left, right) => getReleaseDate(right).localeCompare(getReleaseDate(left));
    case 'release.asc':
      return (left, right) => getReleaseDate(left).localeCompare(getReleaseDate(right));
    case 'title.asc':
      return (left, right) => getTitle(left).localeCompare(getTitle(right));
    case DEFAULT_DISCOVERY_SORT:
    default:
      return (left, right) => (right.popularity || 0) - (left.popularity || 0);
  }
}

export function normalizeSortValue(sort, options = SORT_OPTIONS) {
  return options.some((option) => option.value === sort) ? sort : DEFAULT_DISCOVERY_SORT;
}

function getDiscoverSort(sort, mediaType) {
  switch (sort) {
    case 'rating.desc':
      return 'vote_average.desc';
    case 'release.desc':
      return mediaType === 'tv' ? 'first_air_date.desc' : 'primary_release_date.desc';
    case 'release.asc':
      return mediaType === 'tv' ? 'first_air_date.asc' : 'primary_release_date.asc';
    case 'title.asc':
      return DEFAULT_DISCOVERY_SORT;
    case DEFAULT_DISCOVERY_SORT:
    default:
      return DEFAULT_DISCOVERY_SORT;
  }
}

export function buildDiscoverParams({
  page = 1,
  mediaType = 'movie',
  genre = '',
  minRating = '',
  year = '',
  language = '',
  sort = DEFAULT_DISCOVERY_SORT,
} = {}) {
  const params = {
    page,
    sort_by: getDiscoverSort(sort, mediaType),
  };

  if (genre) params.with_genres = genre;
  if (minRating) params['vote_average.gte'] = minRating;
  if (year) params[mediaType === 'tv' ? 'first_air_date_year' : 'primary_release_year'] = year;
  if (language) params.with_original_language = language;

  return params;
}

export function filterContentItems(items, {
  type = 'all',
  genre = '',
  minRating = '',
  year = '',
  language = '',
} = {}) {
  const normalizedGenre = genre ? Number(genre) : null;
  const normalizedRating = minRating ? Number(minRating) : null;

  return items.filter((item) => {
    const mediaType = normalizeMediaType(item, type === 'all' ? 'movie' : type);
    if (item.media_type === 'person') return false;
    if (!item.poster_path && !item.backdrop_path) return false;
    if (type !== 'all' && mediaType !== type) return false;
    if (normalizedGenre && !(item.genre_ids || []).includes(normalizedGenre)) return false;
    if (normalizedRating && (item.vote_average || 0) < normalizedRating) return false;
    if (year && getYear(item) !== year) return false;
    if (language && item.original_language !== language) return false;
    return true;
  });
}

export function sortContentItems(items, sort = DEFAULT_DISCOVERY_SORT) {
  return [...items].sort(getSortComparator(sort));
}

export function mergeSortedContent(existingItems, incomingItems, sort = DEFAULT_DISCOVERY_SORT) {
  if (existingItems.length === 0) {
    return [...incomingItems];
  }

  if (incomingItems.length === 0) {
    return [...existingItems];
  }

  const comparator = getSortComparator(sort);
  const merged = [];
  let existingIndex = 0;
  let incomingIndex = 0;

  while (existingIndex < existingItems.length && incomingIndex < incomingItems.length) {
    if (comparator(existingItems[existingIndex], incomingItems[incomingIndex]) <= 0) {
      merged.push(existingItems[existingIndex]);
      existingIndex += 1;
    } else {
      merged.push(incomingItems[incomingIndex]);
      incomingIndex += 1;
    }
  }

  return merged.concat(existingItems.slice(existingIndex), incomingItems.slice(incomingIndex));
}

export function applyContentFilters(items, {
  type = 'all',
  genre = '',
  minRating = '',
  year = '',
  language = '',
  sort = DEFAULT_DISCOVERY_SORT,
} = {}) {
  return sortContentItems(filterContentItems(items, { type, genre, minRating, year, language }), sort);
}