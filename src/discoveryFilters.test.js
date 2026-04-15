import { describe, expect, it } from 'vitest';
import { applyContentFilters, buildDiscoverParams, DEFAULT_DISCOVERY_SORT } from './discoveryFilters';

describe('discoveryFilters helpers', () => {
  it('builds discover params with media-aware year and sort fields', () => {
    expect(
      buildDiscoverParams({
        mediaType: 'movie',
        page: 2,
        genre: '28',
        minRating: '7',
        year: '2024',
        language: 'en',
        sort: 'release.desc',
      }),
    ).toEqual({
      page: 2,
      sort_by: 'primary_release_date.desc',
      with_genres: '28',
      'vote_average.gte': '7',
      primary_release_year: '2024',
      with_original_language: 'en',
    });

    expect(
      buildDiscoverParams({
        mediaType: 'tv',
        year: '2023',
        sort: 'release.asc',
      }),
    ).toEqual({
      page: 1,
      sort_by: 'first_air_date.asc',
      first_air_date_year: '2023',
    });
  });

  it('filters by media type, genre, rating, year, and language', () => {
    const items = [
      {
        id: 1,
        media_type: 'movie',
        title: 'Alpha',
        genre_ids: [28],
        vote_average: 7.8,
        release_date: '2024-02-12',
        original_language: 'en',
        popularity: 40,
        poster_path: '/a.jpg',
      },
      {
        id: 2,
        media_type: 'tv',
        name: 'Bravo',
        genre_ids: [28],
        vote_average: 8.1,
        first_air_date: '2024-05-10',
        original_language: 'ko',
        popularity: 60,
        poster_path: '/b.jpg',
      },
      {
        id: 3,
        media_type: 'movie',
        title: 'Charlie',
        genre_ids: [35],
        vote_average: 6.1,
        release_date: '2022-09-01',
        original_language: 'en',
        popularity: 20,
        poster_path: '/c.jpg',
      },
    ];

    expect(
      applyContentFilters(items, {
        type: 'movie',
        genre: '28',
        minRating: '7',
        year: '2024',
        language: 'en',
        sort: DEFAULT_DISCOVERY_SORT,
      }),
    ).toEqual([items[0]]);
  });

  it('sorts filtered items client-side', () => {
    const items = [
      {
        id: 1,
        media_type: 'movie',
        title: 'Zulu',
        vote_average: 6,
        release_date: '2023-01-01',
        popularity: 30,
        poster_path: '/z.jpg',
      },
      {
        id: 2,
        media_type: 'movie',
        title: 'Alpha',
        vote_average: 8,
        release_date: '2024-01-01',
        popularity: 20,
        poster_path: '/a.jpg',
      },
    ];

    expect(applyContentFilters(items, { sort: 'title.asc' }).map((item) => item.id)).toEqual([2, 1]);
    expect(applyContentFilters(items, { sort: 'rating.desc' }).map((item) => item.id)).toEqual([2, 1]);
    expect(applyContentFilters(items, { sort: 'release.asc' }).map((item) => item.id)).toEqual([1, 2]);
  });
});