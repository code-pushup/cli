import { describe, expect, it } from 'vitest';
import { yarnBerryToOutdatedResult } from './outdated-result.js';
import type { YarnBerryOutdatedResultJson } from './types.js';

describe('yarnBerryToOutdatedResult', () => {
  it('should transform Yarn v2 outdated to unified outdated result', () => {
    const outdated = [
      {
        name: 'nx',
        current: '16.8.1',
        latest: '17.0.0',
        type: 'dependencies',
        url: 'https://nx.dev/',
      },
      {
        name: 'vite',
        current: '4.3.1',
        latest: '5.1.4',
        type: 'devDependencies',
      },
    ] satisfies YarnBerryOutdatedResultJson;

    expect(yarnBerryToOutdatedResult(JSON.stringify(outdated))).toStrictEqual(
      outdated,
    );
  });

  it('should transform no dependencies to empty array', () => {
    expect(yarnBerryToOutdatedResult('[]')).toEqual([]);
  });
});
