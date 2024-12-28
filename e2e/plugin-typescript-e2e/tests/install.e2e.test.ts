import path from 'node:path';
import {expect} from 'vitest';
import {nxTargetProject} from '@code-pushup/test-nx-utils';
import {E2E_ENVIRONMENTS_DIR, TEST_OUTPUT_DIR,} from '@code-pushup/test-utils';
import {readJsonFile} from '@code-pushup/utils';
import {getCurrentTsVersion} from "@code-pushup/typescript-plugin";

describe('PLUGIN install of typescript-plugin NPM package', () => {
  const testFileDir = path.join(
    E2E_ENVIRONMENTS_DIR,
    nxTargetProject(),
    TEST_OUTPUT_DIR,
    'install',
  );


  it('should have current TS version defaults generated after install', async () => {
    await expect(readJsonFile(
      path.join(testFileDir, 'node_modules', '.code-pushup', 'plugin-typescript', 'default-ts-configs', await getCurrentTsVersion()),
    )).resolves.not.toThrow();
  });

});
