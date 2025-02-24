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

describe('PLUGIN collect report with eslint-plugin NPM package', () => {
  const fixturesDir = path.join(
    'e2e',
    'plugin-eslint-e2e',
    'mocks',
    'fixtures',
  );
  const fixturesFlatConfigDir = path.join(fixturesDir, 'flat-config');
  const fixturesLegacyConfigDir = path.join(fixturesDir, 'legacy-config');

  const envRoot = path.join(
    E2E_ENVIRONMENTS_DIR,
    nxTargetProject(),
    TEST_OUTPUT_DIR,
  );
  const flatConfigDir = path.join(envRoot, 'flat-config');
  const legacyConfigDir = path.join(envRoot, 'legacy-config');
  const flatConfigOutputDir = path.join(flatConfigDir, '.code-pushup');
  const legacyConfigOutputDir = path.join(legacyConfigDir, '.code-pushup');

  beforeAll(async () => {
    await cp(fixturesFlatConfigDir, flatConfigDir, { recursive: true });
    await cp(fixturesLegacyConfigDir, legacyConfigDir, { recursive: true });
  });

  afterAll(async () => {
    await teardownTestFolder(flatConfigDir);
    await teardownTestFolder(legacyConfigDir);
  });

  afterEach(async () => {
    await teardownTestFolder(flatConfigOutputDir);
    await teardownTestFolder(legacyConfigOutputDir);
  });

  it('should run ESLint plugin for flat config and create report.json', async () => {
    const { code } = await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', 'collect', '--no-progress'],
      cwd: flatConfigDir,
    });

    expect(code).toBe(0);

    const report = await readJsonFile(
      path.join(flatConfigOutputDir, 'report.json'),
    );

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report as Report)).toMatchSnapshot();
  });

  it('should run ESLint plugin for legacy config and create report.json', async () => {
    const { code } = await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', 'collect', '--no-progress'],
      cwd: legacyConfigDir,
      env: { ...process.env, ESLINT_USE_FLAT_CONFIG: 'false' },
    });

    expect(code).toBe(0);

    const report = await readJsonFile(
      path.join(legacyConfigOutputDir, 'report.json'),
    );

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report as Report)).toMatchSnapshot();
  });
});
