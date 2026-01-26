import { cp } from 'node:fs/promises';
import path from 'node:path';
import {
  type AuditReport,
  type Report,
  reportSchema,
} from '@code-pushup/models';
import { nxTargetProject } from '@code-pushup/test-nx-utils';
import {
  E2E_ENVIRONMENTS_DIR,
  TEST_OUTPUT_DIR,
  restoreNxIgnoredFiles,
  teardownTestFolder,
} from '@code-pushup/test-utils';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

describe('plugin-js-packages', () => {
  const fixturesDir = path.join(
    'e2e',
    'plugin-js-packages-e2e',
    'mocks',
    'fixtures',
  );
  const fixturesNPMDir = path.join(fixturesDir, 'npm-repo');

  const envRoot = path.join(
    E2E_ENVIRONMENTS_DIR,
    nxTargetProject(),
    TEST_OUTPUT_DIR,
  );
  const npmRepoDir = path.join(envRoot, 'npm-repo');

  beforeAll(async () => {
    await cp(fixturesNPMDir, npmRepoDir, { recursive: true });
    await restoreNxIgnoredFiles(npmRepoDir);
  });

  afterAll(async () => {
    await teardownTestFolder(npmRepoDir);
  });

  it('should run JS packages plugin for NPM and create report.json', async () => {
    const { code } = await executeProcess({
      command: 'npx',
      args: [
        '@code-pushup/cli',
        'collect',
        '--verbose',
        `--config=${path.join(
          TEST_OUTPUT_DIR,
          'npm-repo',
          'code-pushup.config.ts',
        )}`,
      ],
      cwd: path.join(E2E_ENVIRONMENTS_DIR, nxTargetProject()),
    });

    expect(code).toBe(0);

    const report = await readJsonFile<Report>(
      path.join(npmRepoDir, 'report.json'),
    );

    const plugin = report.plugins[0]!;
    const npmAuditProd = plugin.audits.find(
      ({ slug }) => slug === 'npm-audit-prod',
    )!;
    const npmOutdatedProd = plugin.audits.find(
      ({ slug }) => slug === 'npm-outdated-prod',
    )!;

    expect(plugin.packageName).toBe('@code-pushup/js-packages-plugin');
    expect(plugin.audits).toHaveLength(4);

    expect(npmAuditProd).toEqual<AuditReport>(
      expect.objectContaining({
        value: expect.any(Number),
      }),
    );
    expect(npmAuditProd.value).toBeGreaterThanOrEqual(7); // there are 7 vulnerabilities (6 high, 1 low) in prod dependency at the time
    expect(npmAuditProd.displayValue).toMatch(/\d vulnerabilities/);
    expect(npmAuditProd.details?.issues!.length).toBeGreaterThanOrEqual(7);

    const expressConnectIssue = npmAuditProd.details!.issues![0]!;
    expect(expressConnectIssue?.severity).toBe('error');
    expect(expressConnectIssue?.message).toContain('express');
    expect(expressConnectIssue?.message).toContain('2.30.2');
    expect(expressConnectIssue?.message).toContain(
      'methodOverride Middleware Reflected Cross-Site Scripting in connect',
    );

    expect(npmOutdatedProd.score).toBe(0);
    expect(npmOutdatedProd.value).toBe(1); // there is 1 outdated prod dependency at the time
    expect(npmOutdatedProd.displayValue).toBe(
      '1 major outdated package version',
    );
    expect(npmOutdatedProd.details?.issues).toHaveLength(1);

    const expressOutdatedIssue = npmOutdatedProd.details!.issues![0]!;
    expect(expressOutdatedIssue.severity).toBe('error');
    expect(expressOutdatedIssue?.message).toContain('express');
    expect(expressOutdatedIssue?.message).toContain(
      'requires a **major** update from **3.0.0** to',
    );

    expect(() => reportSchema.parse(report)).not.toThrow();
  });
});
