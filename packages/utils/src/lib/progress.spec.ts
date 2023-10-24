import {describe, it, vi} from 'vitest';
import {executeProcess, ProcessConfig} from './execute-process';
import {getProgress} from './progress';
import {getAsyncProcessRunnerConfig} from "../../test";
import chalk from "chalk";

describe('progress1', () => {

  it('should update progress', async () => {
    const p = 'test-progress';
    const progress = getProgress(p, { type: 'percentage', percentage: 0, barTransformFn: (chalk.yellow as any)})
    const runs = 10;
    let cfg: ProcessConfig = getAsyncProcessRunnerConfig({interval: 1000, runs, outputFile: 'out.json'});
    cfg = {
      ...cfg,
      observer: {
        next: () => {
          progress.incrementTask(p, {
            percentage: 0.1,
            barTransformFn: (chalk.yellow as any)
          })
        },
        complete: () => progress.updateTask(p, {
          percentage: 1,
          barTransformFn: (chalk.gray as any)
        })
      }
    };
    const errorSpy = vi.fn();
    await executeProcess(cfg);

  });
}, 20000);
