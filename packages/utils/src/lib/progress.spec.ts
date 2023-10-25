import { describe, expect, it } from 'vitest';
import { executeProcess } from './execute-process';
import { getProgress } from './progress';

describe('progress', () => {
  it('should return singleton', async () => {
    const progressBarName = 'test-progress';
    const progress = getProgress(progressBarName);
    const progress2 = getProgress(progressBarName);
    expect(progress.parent === progress2.parent).toBe(true);
  });

  it('should log progress bar', async () => {
    const { stdout } = await executeProcess({
      command: 'npx',
      args: [
        'node',
        './packages/utils/test/fixtures/execute-progress.mock.mjs',
        '-P',
        './packages/utils/tsconfig.spec.json',
      ],
      observer: { next: b => console.log('next:', b.toString()) },
    });
    expect(stdout).toContain('progress:start with duration: 300, plugins: 10');
    // expect(stdout).toContain('mock-progress');  @TODO fix testing for progress bar log!
  });
});
