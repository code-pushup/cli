import { describe, expect, it } from 'vitest';
import { toJsonLines } from '@code-pushup/utils';
import { OutdatedResult } from '../../runner/outdated/types';
import { yarnv1ToOutdatedResult } from './outdated-result';

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
