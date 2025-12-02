import { expect } from 'vitest';
import { DEFAULT_SETTINGS } from '../settings.js';
import { type CommandContext, createCommandContext } from './context.js';

describe('createCommandContext', () => {
  it('should pick CLI-related settings in standalone mode', () => {
    expect(
      createCommandContext(
        {
          ...DEFAULT_SETTINGS,
          bin: 'npx --no-install code-pushup',
          config: null,
          directory: '/test',
          silent: false,
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
          ...DEFAULT_SETTINGS,
          bin: 'npx --no-install code-pushup',
          config: null,
          directory: '/test',
          silent: false,
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
