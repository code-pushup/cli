import chalk from 'chalk';
import { describe, expect, it } from 'vitest';
import { getProgress } from './progress';

describe('progress', () => {
  it('should return singleton', async () => {
    const p = 'test-progress';
    const progress = getProgress(p, {
      type: 'percentage',
      percentage: 0,
      barTransformFn: chalk.yellow as any,
    });
    const progress2 = getProgress(p, {
      type: 'percentage',
      percentage: 0,
      barTransformFn: chalk.yellow as any,
    });

    expect(progress === progress2).toBe(true);
  });
});
