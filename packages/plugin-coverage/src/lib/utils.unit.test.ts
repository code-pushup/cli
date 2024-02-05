import { describe, expect, it } from 'vitest';
import type { AuditOutput } from '@code-pushup/models';
import { applyMaxScoreAboveThreshold } from './utils';

describe('applyMaxScoreAboveThreshold', () => {
  it('should transform score above threshold to maximum', () => {
    expect(
      applyMaxScoreAboveThreshold(
        [
          {
            slug: 'branch-coverage',
            value: 75,
            score: 0.75,
          } satisfies AuditOutput,
        ],
        0.7,
      ),
    ).toEqual([
      {
        slug: 'branch-coverage',
        value: 75,
        score: 1,
      } satisfies AuditOutput,
    ]);
  });

  it('should leave score below threshold untouched', () => {
    expect(
      applyMaxScoreAboveThreshold(
        [
          {
            slug: 'line-coverage',
            value: 60,
            score: 0.6,
          } satisfies AuditOutput,
        ],
        0.7,
      ),
    ).toEqual([
      {
        slug: 'line-coverage',
        value: 60,
        score: 0.6,
      } satisfies AuditOutput,
    ]);
  });
});
