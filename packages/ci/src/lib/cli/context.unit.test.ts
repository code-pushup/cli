import { DEFAULT_SETTINGS } from '../constants.js';
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
          output: '.code-pushup',
          projects: null,
          silent: false,
          task: 'code-pushup',
        },
        null,
      ),
    ).toStrictEqual<CommandContext>({
      project: undefined,
      bin: 'npx --no-install code-pushup',
      directory: '/test',
      config: null,
      silent: false,
      output: '.code-pushup',
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
          output: '.code-pushup',
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
      project: 'ui',
      bin: 'yarn code-pushup',
      directory: '/test/ui',
      config: null,
      silent: false,
      output: '.code-pushup',
    });
  });

  it('should interpolate project name in output path for monorepo project', () => {
    expect(
      createCommandContext(
        {
          ...DEFAULT_SETTINGS,
          output: '.code-pushup/{project}',
        },
        {
          name: 'website',
          bin: 'npx nx run website:code-pushup --',
        },
      ),
    ).toEqual(
      expect.objectContaining<Partial<CommandContext>>({
        project: 'website',
        bin: 'npx nx run website:code-pushup --',
        output: '.code-pushup/website',
      }),
    );
  });

  it('should omit {project} placeholder in output path when in standalone mode', () => {
    expect(
      createCommandContext(
        {
          ...DEFAULT_SETTINGS,
          output: '.code-pushup/{project}',
        },
        undefined,
      ),
    ).toEqual(
      expect.objectContaining<Partial<CommandContext>>({
        output: '.code-pushup/',
      }),
    );
  });
});
