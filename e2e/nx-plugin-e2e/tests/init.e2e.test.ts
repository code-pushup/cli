import { expect } from 'vitest';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

describe('nx-plugin g init', () => {
  it('should run init generator and execute correctly', async () => {
    const { code, stderr } = await executeProcess({
      command: 'nx',
      args: ['g', './dist/packages/nx-plugin:init examples-react-todos-app'],
      observer: { onStdout: console.info },
    });

    expect(code).toBe(0);
    expect(stderr).toContain('dryRun');
  });
});

describe('nx-plugin g configuration', () => {
  it('should run init generator on react-todos-app', async () => {
    const { code, stderr } = await executeProcess({
      command: 'nx',
      args: ['g', './dist/packages/nx-plugin:init examples-react-todos-app'],
    });

    expect(code).toBe(0);
    expect(stderr).toBe('');

    // add code-pushup.config.ts
  });
});
