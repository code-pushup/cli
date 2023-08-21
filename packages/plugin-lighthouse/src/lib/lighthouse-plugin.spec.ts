import { lighthousePlugin } from './lighthouse-plugin';

describe('lighthousePlugin', () => {
  it('should initialize Lighthouse plugin', () => {
    expect(lighthousePlugin({ config: '.lighthouserc.json' })).toEqual({
      name: 'lighthouse',
      defaultConfig: expect.any(Object),
    });
  });
});
