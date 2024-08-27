import { describe, expect, it } from 'vitest';
import type { OutdatedResult } from '../../runner/outdated/types';
import { pnpmToOutdatedResult } from './outdated-result';
import type { PnpmOutdatedResultJson } from './types';

describe('pnpmToOutdatedResult', () => {
  it('should transform PNPM outdated to unified outdated result', () => {
    expect(
      pnpmToOutdatedResult(
        JSON.stringify({
          cypress: {
            current: '8.5.0',
            latest: '13.6.0',
            dependencyType: 'devDependencies',
          },
          '@cypress/request': {
            current: '2.88.10',
            latest: '3.0.0',
            dependencyType: 'devDependencies',
          },
        } satisfies PnpmOutdatedResultJson),
      ),
    ).toEqual<OutdatedResult>([
      {
        name: 'cypress',
        current: '8.5.0',
        latest: '13.6.0',
        type: 'devDependencies',
      },
      {
        name: '@cypress/request',
        current: '2.88.10',
        latest: '3.0.0',
        type: 'devDependencies',
      },
    ]);
  });

  it('should transform no dependencies to empty array', () => {
    expect(pnpmToOutdatedResult('{}')).toEqual([]);
  });
});
