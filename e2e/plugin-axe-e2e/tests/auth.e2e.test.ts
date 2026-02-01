import { cp } from 'node:fs/promises';
import type { Server } from 'node:http';
import path from 'node:path';
import type { Report } from '@code-pushup/models';
import { nxTargetProject } from '@code-pushup/test-nx-utils';
import {
  E2E_ENVIRONMENTS_DIR,
  TEST_OUTPUT_DIR,
  restoreNxIgnoredFiles,
  teardownTestFolder,
} from '@code-pushup/test-utils';
import { executeProcess, readJsonFile } from '@code-pushup/utils';
import {
  createAuthServer,
  startServer,
  stopServer,
} from '../mocks/fixtures/auth/server/server.js';

describe('PLUGIN collect with setupScript authentication', () => {
  const PORT = 8080;
  const fixturesDir = path.join(
    'e2e',
    nxTargetProject(),
    'mocks',
    'fixtures',
    'auth',
  );
  const testFileDir = path.join(
    E2E_ENVIRONMENTS_DIR,
    nxTargetProject(),
    TEST_OUTPUT_DIR,
    'auth',
  );

  let server: Server;

  beforeAll(async () => {
    await cp(fixturesDir, testFileDir, { recursive: true });
    await restoreNxIgnoredFiles(testFileDir);
    server = createAuthServer(path.join(testFileDir, 'server'));
    await startServer(server, PORT);
  });

  afterAll(async () => {
    await stopServer(server);
    await teardownTestFolder(testFileDir);
  });

  it('should analyze authenticated page using setupScript', async () => {
    const { code } = await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', 'collect'],
      cwd: testFileDir,
    });

    expect(code).toBe(0);

    const report = await readJsonFile<Report>(
      path.join(testFileDir, '.code-pushup', 'report.json'),
    );

    expect(report.plugins[0]!.audits).toSatisfyAny(
      audit => audit.score < 1 && audit.slug === 'th-has-data-cells',
    );
  });
});
