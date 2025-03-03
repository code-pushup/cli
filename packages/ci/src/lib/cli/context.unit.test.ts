import { expect } from 'vitest';
import { type CommandContext, createCommandContext } from './context.js';

describe('createCommandContext', () => {
  const expectedObserver = expect.objectContaining({
    onStderr: expect.any(Function),
    onStdout: expect.any(Function),
  });

  it('should pick CLI-related settings in standalone mode', () => {
    expect(
      createCommandContext(
        {
          bin: 'npx --no-install code-pushup',
          config: null,
          debug: false,
          detectNewIssues: true,
          directory: '/test',
          logger: console,
          monorepo: false,
          parallel: false,
          nxProjectsFilter: '--with-target={task}',
          projects: null,
          silent: false,
          task: 'code-pushup',
          skipComment: false,
        },
        null,
      ),
    ).toStrictEqual<CommandContext>({
      bin: 'npx --no-install code-pushup',
      directory: '/test',
      config: null,
      observer: expectedObserver,
    });
  });

  it('should override some settings when given monorepo project config', () => {
    expect(
      createCommandContext(
        {
          bin: 'npx --no-install code-pushup',
          config: null,
          debug: false,
          detectNewIssues: true,
          directory: '/test',
          logger: console,
          monorepo: false,
          parallel: false,
          nxProjectsFilter: '--with-target={task}',
          projects: null,
          silent: false,
          task: 'code-pushup',
          skipComment: false,
        },
        {
          name: 'ui',
          directory: '/test/ui',
          bin: 'yarn code-pushup',
        },
      ),
    ).toStrictEqual<CommandContext>({
      bin: 'yarn code-pushup',
      directory: '/test/ui',
      config: null,
      observer: expectedObserver,
    });
  });
});
