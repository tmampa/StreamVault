import { describe, expect, it } from 'vitest';
import { getTvEmbedUrl, parsePlayerEventMessage, VIDKING_ORIGIN } from './vidking';

describe('vidking helpers', () => {
  it('builds tv embed URLs with episode controls enabled by default', () => {
    const url = new URL(getTvEmbedUrl(1399, 1, 2, { color: 'f59e0b', autoplay: true, progress: 245.7 }));

    expect(`${url.origin}${url.pathname}`).toBe('https://www.vidking.net/embed/tv/1399/1/2');
    expect(url.searchParams.get('color')).toBe('f59e0b');
    expect(url.searchParams.get('autoPlay')).toBe('true');
    expect(url.searchParams.get('progress')).toBe('245');
    expect(url.searchParams.get('episodeSelector')).toBe('true');
    expect(url.searchParams.get('nextEpisode')).toBe('true');
  });

  it('parses valid player event messages', () => {
    const source = {};

    const playerEvent = parsePlayerEventMessage(
      {
        origin: VIDKING_ORIGIN,
        source,
        data: JSON.stringify({
          type: 'PLAYER_EVENT',
          data: {
            event: 'ended',
            id: '1399',
            mediaType: 'tv',
            season: 1,
            episode: 2,
            duration: 3600,
          },
        }),
      },
      source
    );

    expect(playerEvent).toMatchObject({
      event: 'ended',
      id: '1399',
      mediaType: 'tv',
      season: 1,
      episode: 2,
    });
  });

  it('ignores malformed or untrusted messages', () => {
    const source = {};

    expect(
      parsePlayerEventMessage(
        {
          origin: 'https://example.com',
          source,
          data: '{"type":"PLAYER_EVENT"}',
        },
        source
      )
    ).toBeNull();

    expect(
      parsePlayerEventMessage(
        {
          origin: VIDKING_ORIGIN,
          source,
          data: 'not json',
        },
        source
      )
    ).toBeNull();

    expect(
      parsePlayerEventMessage(
        {
          origin: VIDKING_ORIGIN,
          source: {},
          data: JSON.stringify({
            type: 'PLAYER_EVENT',
            data: {
              event: 'play',
            },
          }),
        },
        source
      )
    ).toBeNull();
  });
});