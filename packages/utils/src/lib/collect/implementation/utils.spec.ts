import {describe, expect} from 'vitest';
import {calcDuration, countWeightedRefs, sumRefs} from './utils';
import {CategoryConfig} from '@quality-metrics/models';

describe('calcDuration', () => {
  it('should calc the duration correctly if start and stop are given', () => {
    const start = performance.now();
    const stop = performance.now() + 100;
    expect(calcDuration(start, stop)).toBe(100);
  });

  it('should calc the duration correctly if only start is given', () => {
    const start = performance.now();
    expect(calcDuration(start)).toBe(0);
  });
});

describe('countWeightedRefs', () => {
  it('should calc weighted refs only', () => {
    const refs: CategoryConfig['refs'] = [
      {
        slug: 'a1',
        weight: 0,
        plugin: 'a',
        type: 'audit',
      },
      {
        slug: 'a2',
        weight: 1,
        plugin: 'a',
        type: 'audit',
      },
    ];
    expect(countWeightedRefs(refs)).toBe(1);
  });
});

describe('sumRefs', () => {
  it('should sum refs correctly', () => {
    const refs: CategoryConfig['refs'] = [
      {
        slug: 'a1',
        weight: 0,
        plugin: 'a',
        type: 'audit',
      },
      {
        slug: 'a2',
        weight: 1,
        plugin: 'a',
        type: 'audit',
      },
      {
        slug: 'a3',
        weight: 10,
        plugin: 'a',
        type: 'audit',
      },
    ];
    expect(sumRefs(refs)).toBe(11);
  });
});
