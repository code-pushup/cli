import { cp } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { type Report, reportSchema } from '@code-pushup/models';
import { nxTargetProject } from '@code-pushup/test-nx-utils';
import { teardownTestFolder } from '@code-pushup/test-setup';
import {
  E2E_ENVIRONMENTS_DIR,
  TEST_OUTPUT_DIR,
  omitVariableReportData,
} from '@code-pushup/test-utils';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

describe('PLUGIN collect report with doc-coverage-plugin NPM package', () => {
  const fixturesDir = path.join(
    'e2e',
    'plugin-doc-coverage-e2e',
    'mocks',
    'fixtures',
  );
  const fixturesAngularDir = path.join(fixturesDir, 'angular');
  const fixturesReactDir = path.join(fixturesDir, 'react');

  const envRoot = path.join(
    E2E_ENVIRONMENTS_DIR,
    nxTargetProject(),
    TEST_OUTPUT_DIR,
  );
  const angularDir = path.join(envRoot, 'angular');
  const reactDir = path.join(envRoot, 'react');
  const angularOutputDir = path.join(angularDir, '.code-pushup');
  const reactOutputDir = path.join(reactDir, '.code-pushup');

  beforeAll(async () => {
    await cp(fixturesAngularDir, angularDir, { recursive: true });
    await cp(fixturesReactDir, reactDir, { recursive: true });
  });

  afterAll(async () => {
    await teardownTestFolder(angularDir);
    await teardownTestFolder(reactDir);
  });

  afterEach(async () => {
    await teardownTestFolder(angularOutputDir);
    await teardownTestFolder(reactOutputDir);
  });

  it('should run Doc Coverage plugin for Angular example dir and create report.json', async () => {
    const { code, stderr } = await executeProcess({
      command: 'npx',
      args: ['@code-pushup/cli', 'collect', '--no-progress'],
      cwd: angularDir,
    });

    expect(code).toBe(0);

    const report = await readJsonFile(
      path.join(angularOutputDir, 'report.json'),
    );

    expect(() => reportSchema.parse(report)).not.toThrow();
    expect(omitVariableReportData(report as Report)).toMatchSnapshot();
  });
});
