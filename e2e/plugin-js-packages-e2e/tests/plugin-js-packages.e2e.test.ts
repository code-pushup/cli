import path from 'node:path';
import { afterAll, beforeAll, expect, it } from 'vitest';
import {
  type AuditReport,
  type Report,
  reportSchema,
} from '@code-pushup/models';
import {
  type TestEnvironment,
  setupTestEnvironment,
} from '@code-pushup/test-utils';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

describe('plugin-js-packages', () => {
  let testEnv: TestEnvironment;
  let npmRepoDir: string;

  beforeAll(async () => {
    testEnv = await setupTestEnvironment(
      ['..', 'mocks', 'fixtures', 'npm-repo'],
      {
        callerUrl: import.meta.url,
      },
    );
    npmRepoDir = testEnv.baseDir;
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('should run JS packages plugin for NPM and create report.json', async () => {
    const { code } = await executeProcess({
      command: 'npx',
      args: [
        '@code-pushup/cli',
        'collect',
        '--verbose',
        `--config=code-pushup.config.ts`,
      ],
      cwd: npmRepoDir,
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
