import { describe, expect, it } from 'vitest';
import { buildDiscoveryLink, HOME_CURATIONS } from './homeCurations';

describe('homeCurations helpers', () => {
  it('builds search links while omitting default params', () => {
    expect(buildDiscoveryLink()).toBe('/search');
    expect(
      buildDiscoveryLink({
        type: 'movie',
        genre: '28',
        sort: 'release.desc',
        minRating: '7',
        year: '2026',
        language: 'en',
      }),
    ).toBe('/search?type=movie&genre=28&sort=release.desc&rating=7&year=2026&language=en');
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
});