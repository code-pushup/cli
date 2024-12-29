import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect } from 'vitest';
import { nxTargetProject } from '@code-pushup/test-nx-utils';
import { E2E_ENVIRONMENTS_DIR } from '@code-pushup/test-utils';
import { getCurrentTsVersion } from '@code-pushup/typescript-plugin';

describe('PLUGIN install of typescript-plugin NPM package', () => {
  const envRoot = path.join(E2E_ENVIRONMENTS_DIR, nxTargetProject());
  const cacheDir = path.join(
    'node_modules',
    '.code-pushup',
    'typescript-plugin',
    'default-ts-configs',
  );

  it('should have current TS version defaults generated after install', async () => {
    await expect(
      readFile(
        path.join(envRoot, cacheDir, `${await getCurrentTsVersion()}.ts`),
      ),
    ).resolves.not.toThrow();
  });
});
