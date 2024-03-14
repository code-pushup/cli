import { writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type {
  AuditOutput,
  IssueSeverity,
  RunnerConfig,
} from '@code-pushup/models';
import {
  ensureDirectoryExists,
  executeProcess,
  readJsonFile,
} from '@code-pushup/utils';
import {
  FinalJSPackagesPluginConfig,
  PackageAuditLevel,
  PackageDependency,
  PackageManager,
  packageDependencies,
} from '../config';
import { auditResultToAuditOutput } from './audit/transform';
import { NpmAuditResultJson } from './audit/types';
import { PLUGIN_CONFIG_PATH, RUNNER_OUTPUT_PATH } from './constants';
import { outdatedResultToAuditOutput } from './outdated/transform';
import { NpmOutdatedResultJson } from './outdated/types';

export async function createRunnerConfig(
  scriptPath: string,
  config: FinalJSPackagesPluginConfig,
): Promise<RunnerConfig> {
  await ensureDirectoryExists(dirname(PLUGIN_CONFIG_PATH));
  await writeFile(PLUGIN_CONFIG_PATH, JSON.stringify(config));

  return {
    command: 'node',
    args: [scriptPath],
    outputFile: RUNNER_OUTPUT_PATH,
  };
}

export async function executeRunner(): Promise<void> {
  const { packageManager, checks, auditLevelMapping } =
    await readJsonFile<FinalJSPackagesPluginConfig>(PLUGIN_CONFIG_PATH);

  const auditResults = checks.includes('audit')
    ? await processAudit(packageManager, auditLevelMapping)
    : [];

  const outdatedResults = checks.includes('outdated')
    ? await processOutdated(packageManager)
    : [];
  const checkResults = [...auditResults, ...outdatedResults];

  await ensureDirectoryExists(dirname(RUNNER_OUTPUT_PATH));
  await writeFile(RUNNER_OUTPUT_PATH, JSON.stringify(checkResults));
}

async function processOutdated(packageManager: PackageManager) {
  const { stdout } = await executeProcess({
    command: packageManager,
    args: ['outdated', '--json', '--long'],
    alwaysResolve: true, // npm outdated returns exit code 1 when outdated dependencies are found
  });

  const outdatedResult = JSON.parse(stdout) as NpmOutdatedResultJson;
  return packageDependencies.map(dep =>
    outdatedResultToAuditOutput(outdatedResult, dep),
  );
}

async function processAudit(
  packageManager: PackageManager,
  auditLevelMapping: Record<PackageAuditLevel, IssueSeverity>,
) {
  const auditResults = await Promise.allSettled(
    packageDependencies.map<Promise<AuditOutput>>(async dep => {
      const { stdout } = await executeProcess({
        command: packageManager,
        args: ['audit', ...getNpmAuditOptions(dep)],
      });

      const auditResult = JSON.parse(stdout) as NpmAuditResultJson;
      return auditResultToAuditOutput(auditResult, dep, auditLevelMapping);
    }),
  );
  return auditResults
    .filter(
      (x): x is PromiseFulfilledResult<AuditOutput> => x.status === 'fulfilled',
    )
    .map(x => x.value);
}

function getNpmAuditOptions(currentDep: PackageDependency) {
  const flags = [
    `--include=${currentDep}`,
    ...packageDependencies
      .filter(dep => dep !== currentDep)
      .map(dep => `--omit=${dep}`),
  ];
  return [...flags, '--json', '--audit-level=none'];
}
