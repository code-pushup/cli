import type { OutdatedResult } from '../../runner/outdated/types.js';
import { npmToOutdatedResult } from './outdated-result.js';

describe('npmToOutdatedResult', () => {
  it('should transform NPM outdated to unified outdated result', () => {
    expect(
      npmToOutdatedResult(
        JSON.stringify({
          nx: {
            current: '16.8.1',
            latest: '17.0.0',
            dependent: 'cli',
            type: 'dependencies',
            homepage: 'https://nx.dev/',
          },
          '@nx/devkit': {
            current: '16.9.0',
            latest: '17.0.1',
            type: 'devDependencies',
            dependent: 'plugin-js-packages',
          },
        }),
      ),
    ).toEqual<OutdatedResult>([
      {
        name: 'nx',
        current: '16.8.1',
        latest: '17.0.0',
        type: 'dependencies',
        url: 'https://nx.dev/',
      },
      {
        name: '@nx/devkit',
        current: '16.9.0',
        latest: '17.0.1',
        type: 'devDependencies',
      },
    ]);
  });

  it('should not skip dependencies without current version', () => {
    expect(
      npmToOutdatedResult(
        JSON.stringify({
          typescript: {
            latest: '5.3.0',
            dependent: 'cli',
            type: 'dependencies',
          },
        }),
      ),
    ).toEqual([
      {
        current: undefined,
        latest: '5.3.0',
        name: 'typescript',
        type: 'dependencies',
      },
    ]);
  });

  it('should transform no dependencies to empty array', () => {
    expect(npmToOutdatedResult('{}')).toEqual([]);
  });
});
