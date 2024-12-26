import { describe, expect, it } from 'vitest';
import type { AuditOutput } from '@code-pushup/models';
import { applyMaxScoreAboveThreshold } from './utils.js';

describe('applyMaxScoreAboveThreshold', () => {
  it('should transform score above threshold to maximum', () => {
    expect(
      applyMaxScoreAboveThreshold(
        [
          {
            slug: 'branch-stylelint',
            value: 75,
            score: 0.75,
          },
        ],
        0.7,
      ),
    ).toEqual<AuditOutput[]>([
      {
        slug: 'branch-stylelint',
        value: 75,
        score: 1,
      },
    ]);
  });

  it('should leave score below threshold untouched', () => {
    expect(
      applyMaxScoreAboveThreshold(
        [
          {
            slug: 'line-stylelint',
            value: 60,
            score: 0.6,
          },
        ],
        0.7,
      ),
    ).toEqual<AuditOutput[]>([
      {
        slug: 'line-stylelint',
        value: 60,
        score: 0.6,
      },
    ]);
  });
});
