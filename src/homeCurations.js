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
    heroContext: 'Brand-new films worth catching before the year gets crowded.',
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
    heroContext: 'Prestige series with the ratings and momentum to justify a binge.',
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
    heroContext: 'Sharp, stylish Korean series with the strongest buzz right now.',
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
    heroContext: 'Big-energy crowd-pleasers built for a louder movie night.',
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

function getHeroKey(item) {
  const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
  return `${mediaType}-${item.id}`;
}

export function buildHeroShowcase(trendingItems = [], curatedRows = [], maxItems = 5) {
  const selectedItems = [];
  const seen = new Set();

  function addItem(item, meta = {}) {
    if (!item || !item.id || !item.backdrop_path || !item.overview) {
      return;
    }

    const key = getHeroKey(item);
    if (seen.has(key)) {
      return;
    }

    const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
    selectedItems.push({
      ...item,
      media_type: mediaType,
      heroBadge: meta.heroBadge || 'Trending Now',
      heroContext: meta.heroContext || 'Breakout picks people are watching right now.',
      heroSeeAllLink: meta.heroSeeAllLink || '',
    });
    seen.add(key);
  }

  trendingItems.slice(0, 2).forEach((item, index) => {
    addItem(item, {
      heroBadge: index === 0 ? 'Trending Now' : 'Trending Spotlight',
      heroContext: index === 0
        ? 'The biggest breakout title across StreamVault today.'
        : 'Another high-velocity pick climbing through today\'s rankings.',
    });
  });

  curatedRows.forEach((row) => {
    const featuredItem = row.items?.find((item) => item.backdrop_path && item.overview && !seen.has(getHeroKey(item)));
    addItem(featuredItem, {
      heroBadge: row.label,
      heroContext: row.heroContext,
      heroSeeAllLink: row.seeAllLink,
    });
  });

  trendingItems.slice(2).forEach((item) => {
    addItem(item, {
      heroBadge: 'Trending Now',
      heroContext: 'Still climbing and still worth a closer look.',
    });
  });

  return selectedItems.slice(0, maxItems);
}