import { lighthousePlugin } from './lighthouse-plugin';

describe('lighthousePlugin', () => {
  it('should initialize Lighthouse plugin', () => {
    expect(lighthousePlugin({ config: '.lighthouserc.json' }).slug).toBe(
      'lighthouse',
    );
  });
});
