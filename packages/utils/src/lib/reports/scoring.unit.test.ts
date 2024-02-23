import { describe, expect } from 'vitest';
import { REPORT_MOCK } from '@code-pushup/test-utils';
import { calculateScore, scoreReport } from './scoring';

describe('calculateScore', () => {
  it('should calculate the same score for one reference', () => {
    expect(
      calculateScore(
        [{ slug: 'first-contentful-paint', weight: 1, score: 0.75 }],
        ref => ref.score,
      ),
    ).toBe(0.75);
  });

  it('should calculate correct score for multiple references', () => {
    expect(
      calculateScore(
        [
          { slug: 'first-contentful-paint', weight: 3, score: 0 },
          { slug: 'cumulative-layout-shift', weight: 1, score: 1 },
        ],
        ref => ref.score,
      ),
    ).toBe(0.25);
  });

  it('should remove zero-weight reference from score calculation', () => {
    expect(
      calculateScore(
        [
          { slug: 'first-contentful-paint', weight: 3, score: 0 },
          { slug: 'cumulative-layout-shift', weight: 1, score: 1 },
          { slug: 'speed-index', weight: 0, score: 1 },
        ],
        ref => ref.score,
      ),
    ).toBe(0.25);
  });

  it('should calculate correct score for realistic Lighthouse values', () => {
    // https://googlechrome.github.io/lighthouse/scorecalc/#FCP=1200&LCP=1450&TBT=0&CLS=0&SI=1200&TTI=1200&FMP=1200&device=desktop&version=10.3.0
    expect(
      calculateScore(
        [
          { slug: 'first-contentful-paint', weight: 1, score: 0.75 },
          { slug: 'largest-contentful-paint', weight: 2.5, score: 0.82 },
          { slug: 'speed-index', weight: 1, score: 0.93 },
          { slug: 'total-blocking-time', weight: 3, score: 1 },
          { slug: 'cumulative-layout-shift', weight: 2.5, score: 1 },
        ],
        ref => ref.score,
      ),
    ).toBeCloseTo(0.92);
  });

  it('should throw for an empty reference array', () => {
    expect(() =>
      calculateScore<{ weight: number }>([], ref => ref.weight),
    ).toThrow('Reference array cannot be empty.');
  });

  it('should throw negative weight', () => {
    expect(() =>
      calculateScore(
        [{ slug: 'first-contentful-paint', weight: -1, score: 0.5 }],
        ref => ref.score,
      ),
    ).toThrow('Weight cannot be negative.');
  });

  it('should throw for a reference array full of zero weights', () => {
    expect(() =>
      calculateScore(
        [
          { slug: 'first-contentful-paint', weight: 0, score: 0 },
          { slug: 'cumulative-layout-shift', weight: 0, score: 1 },
        ],
        ref => ref.score,
      ),
    ).toThrow('All references cannot have zero weight.');
  });

  it('should throw for a negative score', () => {
    expect(() =>
      calculateScore(
        [{ slug: 'first-contentful-paint', weight: 1, score: -0.8 }],
        ref => ref.score,
      ),
    ).toThrow('All scores must be in range 0-1.');
  });

  it('should throw for score above 1', () => {
    expect(() =>
      calculateScore(
        [{ slug: 'first-contentful-paint', weight: 1, score: 2 }],
        ref => ref.score,
      ),
    ).toThrow('All scores must be in range 0-1.');
  });
});

describe('scoreReport', () => {
  it('should correctly score a valid report', () => {
    /* 
      The report mock has the following data:
      Test results
      -> Cypress E2E: score 0.5 | weight 2
      -> CyCT:        score 1   | weight 1
      => Overall score = 1.5/3 = 0.5
      
      Bug prevention
      -> TypeScript ESLint group:      score 0.25 weight 8
        -> ts-eslint-typing            score 0    weight 3
        -> ts-eslint-enums             score 1    weight 1
        -> ts-eslint-experimental      score 0    weight 0

      -> ESLint Jest naming:           score 1    weight 1
      -> TypeScript ESLint functional: score 0    weight 1
      -> ESLint Cypress:               score 1    weight 0
      => Overall score = 3/10 = 0.3
    */

    expect(scoreReport(REPORT_MOCK)).toEqual(
      expect.objectContaining({
        categories: [
          expect.objectContaining({ slug: 'test-results', score: 0.625 }),
          expect.objectContaining({ slug: 'bug-prevention', score: 0.3 }),
        ],
      }),
    );
  });

  it('should accept a report with empty categories', () => {
    expect(scoreReport({ ...REPORT_MOCK, categories: [] })).toEqual(
      expect.objectContaining({ categories: [] }),
    );
  });
});
