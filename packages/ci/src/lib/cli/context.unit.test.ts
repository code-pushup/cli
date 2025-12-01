import { expect } from 'vitest';
import { type CommandContext, createCommandContext } from './context.js';

describe('createCommandContext', () => {
  it('should pick CLI-related settings in standalone mode', () => {
    expect(
      createCommandContext(
        {
          bin: 'npx --no-install code-pushup',
          config: null,
          detectNewIssues: true,
          directory: '/test',
          silent: false,
          monorepo: false,
          parallel: false,
          nxProjectsFilter: '--with-target={task}',
          projects: null,
          task: 'code-pushup',
          skipComment: false,
          configPatterns: null,
          searchCommits: false,
        },
        null,
      ),
    ).toStrictEqual<CommandContext>({
      bin: 'npx --no-install code-pushup',
      directory: '/test',
      silent: false,
      config: null,
    });
  });

  it('should override some settings when given monorepo project config', () => {
    expect(
      createCommandContext(
        {
          bin: 'npx --no-install code-pushup',
          config: null,
          detectNewIssues: true,
          directory: '/test',
          silent: false,
          monorepo: false,
          parallel: false,
          nxProjectsFilter: '--with-target={task}',
          projects: null,
          task: 'code-pushup',
          skipComment: false,
          configPatterns: null,
          searchCommits: false,
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
      silent: false,
      config: null,
      project: 'ui',
    });
  });
});
