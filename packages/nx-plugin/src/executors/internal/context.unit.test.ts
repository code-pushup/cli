import { describe, expect, it } from 'vitest';
import { normalizeContext } from './context.js';

describe('normalizeContext', () => {
  it('should normalizeContext', () => {
    const normalizedContext = normalizeContext({
      root: './',
      projectName: 'my-app',
      cwd: 'string',
      projectsConfigurations: {
        projects: {
          ['my-app']: {
            root: './my-app',
          },
        },
        version: 0,
      },
      isVerbose: false,
    });
    expect(normalizedContext).toEqual({
      projectName: 'my-app',
      projectConfig: {
        root: './my-app',
      },
      workspaceRoot: './',
    });
  });
});
