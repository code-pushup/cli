import { setWorkspaceRoot } from 'nx/src/utils/workspace-root';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type { SpyInstance } from 'vitest';
import { ESLintPluginConfig } from './config';
import { eslintConfigFromNxProjects } from './nx';

describe('Nx helpers', () => {
  let cwdSpy: SpyInstance;

  beforeAll(() => {
    const workspaceDir = join(
      fileURLToPath(dirname(import.meta.url)),
      '..',
      '..',
      'mocks',
      'fixtures',
      'nx-monorepo',
    );
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(workspaceDir);

    process.env['NX_DAEMON'] = 'false';

    setWorkspaceRoot(workspaceDir);
  });

  afterAll(() => {
    cwdSpy.mockRestore();
  });

  describe('create config from all Nx projects', () => {
    it('should include eslintrc and patterns of each project', async () => {
      await expect(eslintConfigFromNxProjects()).resolves.toEqual({
        eslintrc: {
          root: true,
          overrides: [
            {
              files: ['packages/cli/**/*.ts', 'packages/cli/package.json'],
              extends: './packages/cli/.eslintrc.json',
            },
            {
              files: ['packages/core/**/*.ts', 'packages/core/package.json'],
              extends: './packages/core/.eslintrc.json',
            },
            {
              files: [
                'packages/nx-plugin/**/*.ts',
                'packages/nx-plugin/package.json',
                'packages/nx-plugin/generators.json',
              ],
              extends: './packages/nx-plugin/.eslintrc.json',
            },
            {
              files: ['packages/utils/**/*.ts', 'packages/utils/package.json'],
              extends: './packages/utils/.eslintrc.json',
            },
          ],
        },
        patterns: [
          'packages/cli/**/*.ts',
          'packages/cli/package.json',
          'packages/cli/src/*.spec.ts',
          'packages/cli/src/*.cy.ts',
          'packages/cli/src/*.stories.ts',
          'packages/cli/src/.storybook/main.ts',

          'packages/core/**/*.ts',
          'packages/core/package.json',
          'packages/core/src/*.spec.ts',
          'packages/core/src/*.cy.ts',
          'packages/core/src/*.stories.ts',
          'packages/core/src/.storybook/main.ts',

          'packages/nx-plugin/**/*.ts',
          'packages/nx-plugin/package.json',
          'packages/nx-plugin/generators.json',
          'packages/nx-plugin/src/*.spec.ts',
          'packages/nx-plugin/src/*.cy.ts',
          'packages/nx-plugin/src/*.stories.ts',
          'packages/nx-plugin/src/.storybook/main.ts',

          'packages/utils/**/*.ts',
          'packages/utils/package.json',
          'packages/utils/src/*.spec.ts',
          'packages/utils/src/*.cy.ts',
          'packages/utils/src/*.stories.ts',
          'packages/utils/src/.storybook/main.ts',
        ],
      } satisfies ESLintPluginConfig);
    });
  });
});
