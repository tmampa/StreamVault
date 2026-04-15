import { DEFAULT_DISCOVERY_SORT } from './discoveryFilters';

const CURRENT_YEAR = String(new Date().getFullYear());

export function buildDiscoveryLink({
  type = 'all',
  genre = '',
  sort = DEFAULT_DISCOVERY_SORT,
  minRating = '',
  year = '',
  language = '',
} = {}) {
  const params = new URLSearchParams();

  if (type && type !== 'all') params.set('type', type);
  if (genre) params.set('genre', genre);
  if (sort && sort !== DEFAULT_DISCOVERY_SORT) params.set('sort', sort);
  if (minRating) params.set('rating', minRating);
  if (year) params.set('year', year);
  if (language) params.set('language', language);

  const queryString = params.toString();
  return queryString ? `/search?${queryString}` : '/search';
}

export const HOME_CURATIONS = [
  {
    key: 'fresh-this-year',
    label: 'Fresh This Year',
    mediaType: 'movie',
    filters: {
      type: 'movie',
      year: CURRENT_YEAR,
      sort: 'release.desc',
    },
    extraParams: {
      'vote_count.gte': 60,
    },
    seeAllLink: buildDiscoveryLink({
      type: 'movie',
      year: CURRENT_YEAR,
      sort: 'release.desc',
    }),
  },
  {
    key: 'critics-choice-tv',
    label: "Critics' Choice TV",
    mediaType: 'tv',
    filters: {
      type: 'tv',
      minRating: '7',
      sort: 'rating.desc',
    },
    extraParams: {
      'vote_count.gte': 150,
    },
    seeAllLink: buildDiscoveryLink({
      type: 'tv',
      minRating: '7',
      sort: 'rating.desc',
    }),
  },
  {
    key: 'k-drama-spotlight',
    label: 'K-Drama Spotlight',
    mediaType: 'tv',
    filters: {
      type: 'tv',
      minRating: '7',
      sort: 'rating.desc',
      language: 'ko',
    },
    extraParams: {
      'vote_count.gte': 40,
    },
    seeAllLink: buildDiscoveryLink({
      type: 'tv',
      minRating: '7',
      sort: 'rating.desc',
      language: 'ko',
    }),
  },
  {
    key: 'action-night',
    label: 'Action Night',
    mediaType: 'movie',
    filters: {
      type: 'movie',
      genre: '28',
      sort: DEFAULT_DISCOVERY_SORT,
    },
    seeAllLink: buildDiscoveryLink({
      type: 'movie',
      genre: '28',
    }),
  },
];