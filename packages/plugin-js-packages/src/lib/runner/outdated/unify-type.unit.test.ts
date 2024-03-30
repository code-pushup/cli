import { describe, expect, it } from 'vitest';
import { toJsonLines } from '@code-pushup/utils';
import { OutdatedResult, Yarnv2OutdatedResultJson } from './types';
import {
  npmToOutdatedResult,
  yarnv1ToOutdatedResult,
  yarnv2ToOutdatedResult,
} from './unify-type';

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

describe('yarnv1ToOutdatedResult', () => {
  const yarnInfo = { type: 'info', data: 'Colours' };
  it('should transform Yarn v1 outdated to unified outdated result', () => {
    const table = {
      type: 'table',
      data: {
        body: [
          ['nx', '16.8.1', '', '17.0.0', '', 'dependencies', 'https://nx.dev/'],
        ],
      },
    };

    expect(
      yarnv1ToOutdatedResult(toJsonLines([yarnInfo, table])),
    ).toEqual<OutdatedResult>([
      {
        name: 'nx',
        current: '16.8.1',
        latest: '17.0.0',
        type: 'dependencies',
        url: 'https://nx.dev/',
      },
    ]);
  });

  it('should transform no dependencies to empty array', () => {
    const table = { type: 'table', data: { body: [] } };

    expect(yarnv1ToOutdatedResult(toJsonLines([yarnInfo, table]))).toEqual([]);
  });
});

describe('yarnv2ToOutdatedResult', () => {
  it('should transform Yarn v2 outdated to unified outdated result', () => {
    const outdated = [
      {
        name: 'nx',
        current: '16.8.1',
        latest: '17.0.0',
        type: 'dependencies',
      },
      {
        name: 'vite',
        current: '4.3.1',
        latest: '5.1.4',
        type: 'devDependencies',
      },
    ] satisfies Yarnv2OutdatedResultJson;

    expect(yarnv2ToOutdatedResult(JSON.stringify(outdated))).toStrictEqual(
      outdated,
    );
  });

  it('should transform no dependencies to empty array', () => {
    expect(yarnv2ToOutdatedResult('[]')).toEqual([]);
  });
});
