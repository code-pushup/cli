import { describe, expect, it } from 'vitest';
import { executeProcess } from './execute-process';

describe('progress', () => {
  it('should log progress bar', async () => {
    const { stdout } = await executeProcess({
      command: 'npx',
      args: [
        'node',
        './packages/utils/test/fixtures/execute-progress.mock.mjs',
        '-P',
        './packages/utils/tsconfig.spec.json',
      ],
    });
    // log from process itself
    expect(stdout).toContain('progress:start with duration: 300, plugins: 10');
    // log from progress bar
    // expect(stdout).toContain('mock-progress'); @TODO fix testing for progress bar log! ATM is is not visible in stdout
  });
});
