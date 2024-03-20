import { describe, expect, it } from 'vitest';
import { OutdatedResult } from './types';
import { npmToOutdatedResult, yarnv1ToOutdatedResult } from './unify-type';

describe('npmOutdatedToOutdatedResult', () => {
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
        project: 'cli',
        type: 'dependencies',
        url: 'https://nx.dev/',
      },
      {
        name: '@nx/devkit',
        current: '16.9.0',
        latest: '17.0.1',
        project: 'plugin-js-packages',
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

describe('yarnv1OutdatedToOutdatedResult', () => {
  it('should transform Yarn v1 outdated to unified outdated result', () => {
    expect(
      yarnv1ToOutdatedResult(
        JSON.stringify({
          data: {
            body: [
              [
                'nx',
                '16.8.1',
                '17.0.0',
                '',
                'cli',
                'dependencies',
                'https://nx.dev/',
              ],
            ],
          },
        }),
      ),
    ).toEqual<OutdatedResult>([
      {
        name: 'nx',
        current: '16.8.1',
        latest: '17.0.0',
        project: 'cli',
        type: 'dependencies',
        url: 'https://nx.dev/',
      },
    ]);
  });

  it('should transform no dependencies to empty array', () => {
    expect(
      yarnv1ToOutdatedResult(JSON.stringify({ data: { body: [] } })),
    ).toEqual([]);
  });
});
