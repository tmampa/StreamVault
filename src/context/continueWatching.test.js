import { describe, expect, it } from 'vitest';
import {
  applyContinueWatchingProgress,
  createProgressSnapshot,
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