import { describe, expect, it } from 'vitest';
import { buildDiscoveryLink, buildHeroShowcase, HOME_CURATIONS } from './homeCurations';

const CURRENT_YEAR = String(new Date().getFullYear());

describe('homeCurations helpers', () => {
  it('builds search links while omitting default params', () => {
    expect(buildDiscoveryLink()).toBe('/search');
    expect(
      buildDiscoveryLink({
        type: 'movie',
        genre: '28',
        sort: 'release.desc',
        minRating: '7',
        year: CURRENT_YEAR,
        language: 'en',
      }),
    ).toBe(`/search?type=movie&genre=28&sort=release.desc&rating=7&year=${CURRENT_YEAR}&language=en`);
  });

  it('defines curated homepage shelves with links', () => {
    expect(HOME_CURATIONS).toHaveLength(4);
    expect(HOME_CURATIONS.map((row) => row.key)).toEqual([
      'fresh-this-year',
      'critics-choice-tv',
      'k-drama-spotlight',
      'action-night',
    ]);
    expect(HOME_CURATIONS.every((row) => typeof row.seeAllLink === 'string' && row.seeAllLink.startsWith('/search'))).toBe(true);
  });

  it('builds a deduped hero showcase from trending and curated rows', () => {
    const trendingItems = [
      {
        id: 1,
        media_type: 'movie',
        title: 'Alpha',
        overview: 'Alpha overview',
        backdrop_path: '/alpha.jpg',
      },
      {
        id: 2,
        media_type: 'tv',
        name: 'Bravo',
        overview: 'Bravo overview',
        backdrop_path: '/bravo.jpg',
      },
      {
        id: 3,
        media_type: 'movie',
        title: 'Charlie',
        overview: 'Charlie overview',
        backdrop_path: '/charlie.jpg',
      },
    ];

    const curatedRows = [
      {
        key: 'fresh-this-year',
        label: 'Fresh This Year',
        heroContext: 'Fresh context',
        seeAllLink: `/search?year=${CURRENT_YEAR}`,
        items: [
          {
            id: 2,
            media_type: 'tv',
            name: 'Bravo',
            overview: 'Bravo overview',
            backdrop_path: '/bravo.jpg',
          },
          {
            id: 4,
            media_type: 'movie',
            title: 'Delta',
            overview: 'Delta overview',
            backdrop_path: '/delta.jpg',
          },
        ],
      },
    ];

    const showcase = buildHeroShowcase(trendingItems, curatedRows, 4);

    expect(showcase).toHaveLength(4);
    expect(showcase.map((item) => item.id)).toEqual([1, 2, 4, 3]);
    expect(showcase[2]).toMatchObject({
      heroBadge: 'Fresh This Year',
      heroContext: 'Fresh context',
      heroSeeAllLink: `/search?year=${CURRENT_YEAR}`,
    });
  });
});