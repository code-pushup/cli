import { describe, expect, it } from 'vitest';
import { OutdatedResult } from '../../runner/outdated/types';
import { npmToOutdatedResult } from './outdated-result';

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

  it('should skip dependencies without current version', () => {
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
    ).toEqual([]);
  });

  it('should transform no dependencies to empty array', () => {
    expect(npmToOutdatedResult('{}')).toEqual([]);
  });
});
