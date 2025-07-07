import { expect } from 'vitest';
import { executeProcess } from '@code-pushup/utils';
import { createExecutionObserver } from './create-execution-observer.js';

describe('createExecutionObserver', () => {
  const message = 'This is stdout';
  const error = 'This is stderr';

  it('should use execute process and use observer to capture stdout message and stderr will be empty', async () => {
    const { stdout, stderr } = await executeProcess({
      command: 'node',
      args: ['-e', `"console.log('${message}');"`],
      observer: createExecutionObserver(),
    });

    expect(stdout).toMatch(message);
    expect(stderr).toMatch('');
  });

  it('should use execute process and use observer to capture stdout message and stderr will be error', async () => {
    const { stdout, stderr } = await executeProcess({
      command: 'node',
      args: ['-e', `"console.log('${message}'); console.error('${error}');"`],
      observer: createExecutionObserver(),
    });

    expect(stdout).toMatch(message);
    expect(stderr).toMatch(error);
  });

  it('should use execute process and use observer to capture stderr error and ignore stdout message', async () => {
    const { stdout, stderr } = await executeProcess({
      command: 'node',
      args: ['-e', `"console.log('${message}'); console.error('${error}');"`],
      observer: createExecutionObserver({ silent: true }),
    });

    expect(stdout).toMatch('');
    expect(stderr).toMatch(error);
  });
});
