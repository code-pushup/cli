import { createExecutorTarget } from './executor-target.js';

describe('createExecutorTarget', () => {
  it('should return executor target without project name', () => {
    expect(createExecutorTarget()).toStrictEqual({
      executor: '@code-pushup/nx-plugin:cli',
    });
  });

  it('should use bin if provided', () => {
    expect(
      createExecutorTarget({ bin: 'packages/cli/src/index.ts' }),
    ).toStrictEqual({
      executor: '@code-pushup/nx-plugin:cli',
      options: {
        bin: 'packages/cli/src/index.ts',
      },
    });
  });

  it('should use projectPrefix if provided', () => {
    expect(createExecutorTarget({ projectPrefix: 'cli' })).toStrictEqual({
      executor: '@code-pushup/nx-plugin:cli',
      options: {
        projectPrefix: 'cli',
      },
    });
  });

  it('should use env if provided', () => {
    expect(
      createExecutorTarget({
        env: {
          NODE_OPTIONS: '--import tsx',
          TSX_TSCONFIG_PATH: 'tsconfig.base.json',
        },
      }),
    ).toStrictEqual({
      executor: '@code-pushup/nx-plugin:cli',
      options: {
        env: {
          NODE_OPTIONS: '--import tsx',
          TSX_TSCONFIG_PATH: 'tsconfig.base.json',
        },
      },
    });
  });
});
