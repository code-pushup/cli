import { describe, expect, it } from 'vitest';
import {
  barStyles,
  getProgressBar,
  getSingletonProgressBars,
} from './progress.js';

/**
 * ANSI escape codes in terminal stdout:
 * - `\u001b[30m` black
 * - `\u001b[90m` gray
 * - `\u001b[32m` green
 * - `\u001b[39m` reset or default color
 */

describe('getSingletonMultiProgressBars', () => {
  it('should be singleton', async () => {
    const a = getSingletonProgressBars();
    const b = getSingletonProgressBars();
    expect(a).toBe(b);
    a.close();
    await a.promise; // check if all tasks are done
  });

  // @TODO 'should end all tasks on close'
});

const taskAName = 'a';
const bars = getSingletonProgressBars({ progressWidth: 1 });
const tasks = bars['tasks'];
const progressBuffer: string[] = bars['logger'].progressBuffer;

describe('getProgressBar', () => {
  it('should init task', () => {
    expect(bars.getIndex(taskAName)).toBeUndefined();
    getProgressBar(taskAName);
    expect(bars.getIndex(taskAName)).toBe(0);
    expect(progressBuffer[0]!.trim()).toBe(
      `${taskAName}: ${barStyles.idle(' ')}   0% |`,
    );

    // safety checks int the first test only
    bars.removeTask(taskAName);
    expect(bars.getIndex(taskAName)).toBeUndefined();
  });

  it('should update task message', () => {
    const taskA = getProgressBar(taskAName);
    expect(tasks[taskAName].message).toBe('');

    taskA.updateTitle('0');
    expect(tasks[taskAName].message).toBe('0');
    expect(progressBuffer[0]!.trim()).toBe(
      `${taskAName}: ${barStyles.active(' ')}   0% | 0`,
    );
    taskA.updateTitle('1');
    expect(tasks[taskAName].message).toBe('1');
    expect(progressBuffer[0]!.trim()).toBe(
      `${taskAName}: ${barStyles.active(' ')}   0% | 1`,
    );

    bars.removeTask(taskAName);
  });

  it('should update task progress', () => {
    const taskA = getProgressBar(taskAName);
    taskA.incrementInSteps(2);
    expect(tasks[taskAName].message).toBe('');
    expect(progressBuffer[0]!.trim()).toBe(
      `${taskAName}: ${barStyles.active('▌')}  50% |`,
    );
    taskA.incrementInSteps(2);
    expect(tasks[taskAName].message).toBe('');
    expect(progressBuffer[0]!.trim()).toBe(
      `${taskAName}: ${barStyles.active('█')} 100% |`,
    );
    bars.removeTask(taskAName);
  });

  it('should end task when endProgress is called', () => {
    const taskA = getProgressBar(taskAName);
    expect(bars.isDone(taskAName)).toBe(false);
    taskA.endProgress();
    expect(bars.isDone(taskAName)).toBe(true);
    expect(progressBuffer[0]!.trim()).toBe(
      `${taskAName}: ${barStyles.done('█')} 100% |`,
    );
  });
});
