import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import { executeProcess } from './execute-process';
import { getProgressBar, getSingletonProgressBars } from './progress';

const progressPath = join(
  fileURLToPath(dirname(import.meta.url)),
  '..',
  '..',
  'test',
  'fixtures',
  'execute-progress.mock.mjs',
);

describe('getSingletonMultiProgressBars', () => {
  it('should be singleton', async () => {
    const a = getSingletonProgressBars();
    const b = getSingletonProgressBars();
    expect(a).toBe(b);
  });
});

describe('getProgressBar', () => {
  it('should create bar', async () => {
    const tasks = getSingletonProgressBars();
    expect(tasks.getIndex('a')).toBe(undefined);
    getProgressBar('a');
    expect(tasks.getIndex('a')).toBe(0);
    tasks.close();
  });

  it('should end task when endProgress is called', async () => {
    const tasks = getSingletonProgressBars();
    const taskAName = 'a';
    const taskA = getProgressBar(taskAName);
    expect(tasks.isDone(taskAName)).toBe(false);
    taskA.endProgress();
    expect(tasks.isDone(taskAName)).toBe(true);
    await tasks.promise; // check if all tasks are done
  });

  it('should log progress bar', async () => {
    const { stdout } = await executeProcess({
      command: 'npx',
      args: ['node', progressPath, '--verbose=1'],
    });
    // log from the process itself (--verbose=1)
    expect(stdout).toContain('progress:start with duration: 300, steps: 10');
    // log from progress bar
    // expect(stdout).toContain('mock-progress'); // @TODO fix testing for progress bar log! ATM is is not visible in stdout
  });
});
