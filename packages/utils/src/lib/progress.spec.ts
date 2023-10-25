import { describe, expect, it } from 'vitest';
import { getProgress } from './progress';

describe('progress', () => {
  it('should return singleton', async () => {
    const progressBarName = 'test-progress';
    const progress = getProgress(progressBarName);
    const progress2 = getProgress(progressBarName);
    expect(progress.parent === progress2.parent).toBe(true);
  });
});
