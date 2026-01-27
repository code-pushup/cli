import { cp } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import type { MockInstance } from 'vitest';
import {
  restoreNxIgnoredFiles,
  teardownTestFolder,
} from '@code-pushup/test-utils';
import { executeProcess } from '@code-pushup/utils';
import { tsconfigFromAllNxProjects } from './tsconfig-paths.js';

// Test setup adapted from packages/plugin-eslint/src/lib/nx/nx.int.test.ts
describe.skipIf(process.platform === 'win32')('Nx helpers', () => {
  const thisDir = fileURLToPath(path.dirname(import.meta.url));
  const fixturesDir = path.join(thisDir, '..', '..', '..', 'mocks', 'fixtures');
  const tmpDir = path.join(process.cwd(), 'tmp', 'int', 'plugin-typescript');
  let cwdSpy: MockInstance<[], string>;

  beforeAll(async () => {
    const workspaceDir = path.join(tmpDir, 'nx-monorepo');
    await cp(path.join(fixturesDir, 'nx-monorepo'), workspaceDir, {
      recursive: true,
    });
    await restoreNxIgnoredFiles(workspaceDir);
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(workspaceDir);

    await executeProcess({
      command: 'npx nx graph --file=.nx/graph.json',
      cwd: workspaceDir,
    });
  });

  afterAll(async () => {
    cwdSpy.mockRestore();
    await teardownTestFolder(tmpDir);
  });

  describe('tsconfigFromAllNxProjects', () => {
    it('should find tsconfig files, filtering out empty configs and tsconfig.base.json', async () => {
      // cli project has tsconfig.json (empty arrays, filtered), tsconfig.base.json (excluded), tsconfig.lib.json (included)
      // other projects only have tsconfig.lib.json
      await expect(tsconfigFromAllNxProjects()).resolves.toEqual([
        'packages/cli/tsconfig.lib.json',
        'packages/core/tsconfig.lib.json',
        'packages/nx-plugin/tsconfig.lib.json',
        'packages/utils/tsconfig.lib.json',
      ]);
    });

    it('should exclude specified projects', async () => {
      await expect(
        tsconfigFromAllNxProjects({
          exclude: ['cli', 'core'],
        }),
      ).resolves.toEqual([
        'packages/nx-plugin/tsconfig.lib.json',
        'packages/utils/tsconfig.lib.json',
      ]);
    });

    it('should return empty array when all projects are excluded', async () => {
      await expect(
        tsconfigFromAllNxProjects({
          exclude: ['cli', 'core', 'nx-plugin', 'utils'],
        }),
      ).resolves.toEqual([]);
    });
  });
});
