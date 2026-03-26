import { describe, it, expect } from 'vitest';
import { imgUrl, backdropUrl } from './tmdb';

describe('tmdb image helpers', () => {
  it('imgUrl builds TMDB path with size', () => {
    expect(imgUrl('/poster.jpg', 'w500')).toBe('https://image.tmdb.org/t/p/w500/poster.jpg');
  });

  it('imgUrl returns null for empty path', () => {
    expect(imgUrl(null)).toBeNull();
    expect(imgUrl('')).toBeNull();
  });

  it('backdropUrl uses w1280 by default', () => {
    expect(backdropUrl('/bg.jpg')).toBe('https://image.tmdb.org/t/p/w1280/bg.jpg');
  });
});
