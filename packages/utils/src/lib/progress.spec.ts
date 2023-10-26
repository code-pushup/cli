import { describe, expect, it } from 'vitest';
import {
  barStyles,
  getProgressBar,
  getSingletonProgressBars,
} from './progress';

describe('getSingletonMultiProgressBars', () => {
  it('should be singleton', async () => {
    const a = getSingletonProgressBars();
    const b = getSingletonProgressBars();
    expect(a).toBe(b);
    a.close();
    b.close();
    await bars.promise; // check if all tasks are done
  });

  // @TODO 'should end all tasks on close'
});

const taskAName = 'a';
const bars = getSingletonProgressBars({ progressWidth: 1 });
const tasks = bars?.['tasks'];
const progressBuffer = bars?.['logger'].progressBuffer;

describe('getProgressBar', () => {
  it('should init task', async () => {
    expect(bars.getIndex(taskAName)).toBe(undefined);
    getProgressBar(taskAName);
    expect(bars.getIndex(taskAName)).toBe(0);
    expect(progressBuffer[0].trim()).toBe(
      `${taskAName}: ${barStyles.idle(' ')}   0% |`,
    );

    // safety checks int the first test only
    bars.removeTask(taskAName);
    expect(bars.getIndex(taskAName)).toBe(undefined);
  });

  it('should update task message', async () => {
    const taskA = getProgressBar(taskAName);
    expect(tasks[taskAName].message).toBe('');
    taskA.updateTitle('0');
    expect(tasks[taskAName].message).toBe('0');
    expect(progressBuffer[0].trim()).toBe(
      `${taskAName}: ${barStyles.active(' ')}   0% | 0`,
    );
    bars.removeTask(taskAName);
  });

  it('should update task progress', async () => {
    const taskA = getProgressBar(taskAName);
    taskA.incrementInSteps(2);
    expect(tasks[taskAName].message).toBe('');
    expect(progressBuffer[0].trim()).toBe(
      `${taskAName}: ${barStyles.active('▌')}  50% |`,
    );
    bars.removeTask(taskAName);
  });

  it('should end task when endProgress is called', async () => {
    const taskA = getProgressBar(taskAName);
    expect(bars.isDone(taskAName)).toBe(false);
    taskA.endProgress();
    expect(bars.isDone(taskAName)).toBe(true);
    expect(progressBuffer[0].trim()).toBe(
      `${taskAName}: ${barStyles.done('█')} 100% |`,
    );
  });
});
