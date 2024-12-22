import { type CommandContext, createCommandContext } from './context.js';

describe('createCommandContext', () => {
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
          nxProjectsFilter: '--with-target={task}',
          projects: null,
          silent: false,
          task: 'code-pushup',
        },
        null,
      ),
    ).toStrictEqual<CommandContext>({
      bin: 'npx --no-install code-pushup',
      directory: '/test',
      config: null,
      silent: false,
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
          nxProjectsFilter: '--with-target={task}',
          projects: null,
          silent: false,
          task: 'code-pushup',
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
      silent: false,
    });
  });
});
