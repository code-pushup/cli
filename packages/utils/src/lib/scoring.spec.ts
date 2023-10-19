import { describe, expect } from 'vitest';
import { report } from '@code-pushup/models/testing';
import { calculateScore, scoreReport } from './scoring';

describe('calculateScore', () => {
  // https://googlechrome.github.io/lighthouse/scorecalc/#FCP=1200&LCP=1450&TBT=0&CLS=0&SI=1200&TTI=1200&FMP=1200&device=desktop&version=10.3.0
  const refs = [
    { slug: 'first-contentful-paint', weight: 1 },
    { slug: 'largest-contentful-paint', weight: 2.5 },
    { slug: 'speed-index', weight: 1 },
    { slug: 'total-blocking-time', weight: 3 },
    { slug: 'cumulative-layout-shift', weight: 2.5 },
  ];
  const scores = {
    'first-contentful-paint': 0.75,
    'largest-contentful-paint': 0.82,
    'speed-index': 0.93,
    'total-blocking-time': 1,
    'cumulative-layout-shift': 1,
    'unminified-javascript': 1,
    'uses-long-cache-ttl': 0,
  };
  const scoreFn = (ref: (typeof refs)[number]) =>
    scores[ref.slug as keyof typeof scores];

  test('Lighthouse performance group', () => {
    expect(calculateScore(refs, scoreFn)).toBeCloseTo(0.92);
  });

  test('ignore refs with weight 0', () => {
    expect(
      calculateScore(
        [
          ...refs,
          { slug: 'unminified-javascript', weight: 0 },
          { slug: 'uses-long-cache-ttl', weight: 0 },
        ],
        scoreFn,
      ),
    ).toBeCloseTo(0.92);
  });
});

describe('scoreReport', () => {
  it('should score valid report', () => {
    const reportA = report();
    const prepared = scoreReport(reportA);
    // enriched and scored groups
    expect(prepared.plugins[1]?.groups[0]?.plugin).toBe('lighthouse');
    expect(prepared.plugins[1]?.groups[0]?.slug).toBe('performance');
    expect(prepared.plugins[1]?.groups[0]?.score).toBeCloseTo(0.92);
    // enriched audits
    expect(prepared.plugins[1]?.audits[0]?.plugin).toBe('lighthouse');
    expect(prepared.plugins[1]?.audits[0]?.slug).toBe('first-contentful-paint');
    expect(prepared.plugins[1]?.audits[0]?.score).toBeCloseTo(0.76);
    // enriched and scored categories
    expect(prepared.categories[0]?.slug).toBe('performance');
    expect(prepared?.categories?.[0]?.score).toBeCloseTo(0.92);
    expect(prepared.categories[1]?.slug).toBe('bug-prevention');
    expect(prepared?.categories?.[1]?.score).toBeCloseTo(0.68);
    expect(prepared.categories[2]?.slug).toBe('code-style');
    expect(prepared?.categories?.[2]?.score).toBeCloseTo(0.54);
  });
});
