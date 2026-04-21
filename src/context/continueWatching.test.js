import { describe, expect, it } from 'vitest';
import {
  applyContinueWatchingProgress,
  createProgressSnapshot,
  findContinueWatchingItem,
  isSameContinueWatchingItem,
  mergeContinueWatchingEntry,
  normalizeContinueWatchingItems,
} from './continueWatching';

describe('continue watching helpers', () => {
  it('dedupes tv entries by show and keeps the latest episode snapshot', () => {
    const items = normalizeContinueWatchingItems([
      { id: 99, media_type: 'tv', name: 'The Show', season: 1, episode: 2, updatedAt: 200 },
      { id: 99, media_type: 'tv', name: 'The Show', season: 1, episode: 1, updatedAt: 100 },
      { id: 50, media_type: 'movie', title: 'Movie Night', updatedAt: 150 },
    ]);

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ id: 99, media_type: 'tv', season: 1, episode: 2 });
    expect(items[1]).toMatchObject({ id: 50, media_type: 'movie' });
  });

  it('prefers canonical show ids for legacy tv entries when deduping', () => {
    const items = normalizeContinueWatchingItems([
      {
        id: 50101,
        tmdb_id: 99,
        media_type: 'tv',
        name: 'The Show',
        first_air_date: '2024-01-01',
        season: 1,
        episode: 1,
        updatedAt: 100,
      },
      {
        id: 99,
        media_type: 'tv',
        name: 'The Show',
        first_air_date: '2024-01-01',
        season: 1,
        episode: 2,
        updatedAt: 200,
      },
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: 99, media_type: 'tv', season: 1, episode: 2 });
  });

  it('dedupes the same tv show across different seasons when legacy ids differ', () => {
    const items = normalizeContinueWatchingItems([
      {
        id: 321001,
        media_type: 'tv',
        name: 'Season Hopper',
        first_air_date: '2021-09-10',
        poster_path: '/poster.jpg',
        season: 1,
        episode: 8,
        updatedAt: 100,
      },
      {
        id: 321999,
        media_type: 'tv',
        name: 'Season Hopper',
        first_air_date: '2021-09-10',
        poster_path: '/poster.jpg',
        season: 2,
        episode: 1,
        updatedAt: 200,
      },
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ media_type: 'tv', season: 2, episode: 1, name: 'Season Hopper' });
  });

  it('dedupes sparse and rich tv history records from the same show', () => {
    const items = normalizeContinueWatchingItems([
      {
        id: 701001,
        media_type: 'tv',
        name: 'Same Season Show',
        season: 1,
        episode: 1,
        updatedAt: 100,
      },
      {
        id: 88,
        media_type: 'tv',
        name: 'Same Season Show',
        first_air_date: '2022-02-02',
        poster_path: '/same-season.jpg',
        season: 1,
        episode: 2,
        updatedAt: 200,
      },
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      media_type: 'tv',
      name: 'Same Season Show',
      first_air_date: '2022-02-02',
      poster_path: '/same-season.jpg',
      season: 1,
      episode: 2,
    });
  });

  it('finds an existing tv entry even when metadata richness differs', () => {
    const items = normalizeContinueWatchingItems([
      {
        id: 88,
        media_type: 'tv',
        name: 'Resume Me',
        first_air_date: '2022-02-02',
        poster_path: '/resume.jpg',
        season: 1,
        episode: 4,
        progressSeconds: 420,
        updatedAt: 300,
      },
    ]);

    expect(
      findContinueWatchingItem(items, {
        id: 701001,
        media_type: 'tv',
        name: 'Resume Me',
        season: 1,
        episode: 4,
      }),
    ).toMatchObject({ progressSeconds: 420, season: 1, episode: 4 });
  });

  it('matches tv items for the same show when one record is missing metadata', () => {
    expect(
      isSameContinueWatchingItem(
        {
          id: 701001,
          media_type: 'tv',
          name: 'Same Season Show',
          season: 1,
          episode: 1,
        },
        {
          id: 88,
          media_type: 'tv',
          name: 'Same Season Show',
          first_air_date: '2022-02-02',
          poster_path: '/same-season.jpg',
          season: 1,
          episode: 2,
        },
      ),
    ).toBe(true);
  });

  it('infers legacy movie items without an explicit media type', () => {
    const items = normalizeContinueWatchingItems([
      { id: 7, title: 'Example Movie', updatedAt: 100 },
      { id: 7, media_type: 'movie', title: 'Example Movie', updatedAt: 200 },
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: 7, media_type: 'movie', title: 'Example Movie' });
  });

  it('preserves progress on the same episode and resets it on the next episode', () => {
    const baseItems = [
      {
        id: 99,
        media_type: 'tv',
        name: 'The Show',
        season: 1,
        episode: 2,
        progressSeconds: 600,
        durationSeconds: 1800,
        progressPercent: 33.3,
        updatedAt: 100,
      },
    ];

    const sameEpisode = mergeContinueWatchingEntry(baseItems, {
      id: 99,
      media_type: 'tv',
      name: 'The Show',
      season: 1,
      episode: 2,
    }, 200);

    expect(sameEpisode[0]).toMatchObject({ season: 1, episode: 2, progressSeconds: 600 });

    const nextEpisode = mergeContinueWatchingEntry(baseItems, {
      id: 99,
      media_type: 'tv',
      name: 'The Show',
      season: 1,
      episode: 3,
    }, 300);

    expect(nextEpisode[0]).toMatchObject({ season: 1, episode: 3, progressSeconds: 0, progressPercent: 0 });
  });

  it('applies progress snapshots to the latest entry', () => {
    const updatedItems = applyContinueWatchingProgress(
      [],
      { id: 7, media_type: 'movie', title: 'Example Movie' },
      createProgressSnapshot({ currentTime: 305.9, duration: 1200, progress: 25.4 }),
      500,
    );

    expect(updatedItems[0]).toMatchObject({
      id: 7,
      media_type: 'movie',
      progressSeconds: 305,
      durationSeconds: 1200,
      progressPercent: 25.4,
      updatedAt: 500,
    });
  });
});
