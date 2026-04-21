import { describe, expect, it } from 'vitest';
import { getPlayerRouteSyncTarget } from './watchPlayback';

describe('watch playback helpers', () => {
  it('returns null for movies', () => {
    expect(
      getPlayerRouteSyncTarget({
        isMovie: true,
        currentSeason: 1,
        currentEpisode: 1,
        playerEvent: { season: 2, episode: 3 },
      }),
    ).toBeNull();
  });

  it('returns null when the player stays on the current episode', () => {
    expect(
      getPlayerRouteSyncTarget({
        isMovie: false,
        currentSeason: 1,
        currentEpisode: 1,
        playerEvent: { season: 1, episode: 1 },
      }),
    ).toBeNull();
  });

  it('returns the new episode when the embedded player changes episodes', () => {
    expect(
      getPlayerRouteSyncTarget({
        isMovie: false,
        currentSeason: 1,
        currentEpisode: 1,
        playerEvent: { season: 2, episode: 4 },
      }),
    ).toEqual({ season: 2, episode: 4 });
  });

  it('ignores malformed player season and episode values', () => {
    expect(
      getPlayerRouteSyncTarget({
        isMovie: false,
        currentSeason: 1,
        currentEpisode: 1,
        playerEvent: { season: 'special', episode: 3 },
      }),
    ).toBeNull();

    expect(
      getPlayerRouteSyncTarget({
        isMovie: false,
        currentSeason: 1,
        currentEpisode: 1,
        playerEvent: { season: 2, episode: 0 },
      }),
    ).toBeNull();
  });
});
