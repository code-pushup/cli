import { describe, expect, it } from 'vitest';
import type { OutdatedResult } from '../../runner/outdated/types.js';
import { pnpmToOutdatedResult } from './outdated-result.js';
import type { PnpmOutdatedResultJson } from './types.js';

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

  it('should filter out warnings from the input', () => {
    /* eslint-disable no-irregular-whitespace */
    const inputWithWarnings = `
       WARN  Unsupported engine
       WARN  Issue while reading file
      {
        "cypress": {
          "current": "8.5.0",
          "latest": "13.6.0",
          "dependencyType": "devDependencies"
        },
        "@cypress/request": {
          "current": "2.88.10",
          "latest": "3.0.0",
          "dependencyType": "devDependencies"
        }
      }
    `;
    /* eslint-enable no-irregular-whitespace */
    expect(pnpmToOutdatedResult(inputWithWarnings)).toEqual<OutdatedResult>([
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
});
