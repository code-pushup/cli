import { describe, expect, it } from 'vitest';
import { yarnv2ToOutdatedResult } from './outdated-result';
import { Yarnv2OutdatedResultJson } from './types';

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
