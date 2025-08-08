import { cp } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { type Report, reportSchema } from '@code-pushup/models';
import { nxTargetProject } from '@code-pushup/test-nx-utils';
import {
  E2E_ENVIRONMENTS_DIR,
  TEST_OUTPUT_DIR,
  omitVariableReportData,
  teardownTestFolder,
} from '@code-pushup/test-utils';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

describe('PLUGIN collect report with coverage-paths functionality', () => {
  const envRoot = path.join(E2E_ENVIRONMENTS_DIR, nxTargetProject());
  const testFileDir = path.join(envRoot, TEST_OUTPUT_DIR, 'coverage-paths');

  const nxWorkspaceDir = path.join(testFileDir, 'nx-workspace');
  const nxWorkspaceOutputDir = path.join(nxWorkspaceDir, '.code-pushup');

  const fixtureDir = path.join(
    'e2e',
    nxTargetProject(),
    'mocks',
    'fixtures',
    'nx-workspace',
  );

  beforeAll(async () => {
    await cp(fixtureDir, nxWorkspaceDir, { recursive: true });
  });

  afterAll(async () => {
    await teardownTestFolder(nxWorkspaceDir);
  });

  afterEach(async () => {
    await teardownTestFolder(nxWorkspaceOutputDir);
  });

  it('should run coverage plugin with Nx workspace and create report.json', async () => {
    const { code } = await executeProcess({
      command: 'npx',
      args: ['code-pushup', 'collect', '--no-progress'],
      cwd: nxWorkspaceDir,
    });

    expect(code).toBe(0);

    const report = await readJsonFile<Report>(
      path.join(nxWorkspaceOutputDir, 'report.json'),
    );

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report)).toMatchSnapshot();
  });

  it('should handle multiple coverage reports from different projects', async () => {
    const { code } = await executeProcess({
      command: 'npx',
      args: ['code-pushup', 'collect', '--no-progress'],
      cwd: nxWorkspaceDir,
    });

    expect(code).toBe(0);

    const report = await readJsonFile<Report>(
      path.join(nxWorkspaceOutputDir, 'report.json'),
    );

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report)).toMatchSnapshot();
  });
});
