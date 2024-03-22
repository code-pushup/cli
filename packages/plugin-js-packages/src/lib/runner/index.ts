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
  isPromiseFulfilledResult,
  isPromiseRejectedResult,
  readJsonFile,
} from '@code-pushup/utils';
import {
  FinalJSPackagesPluginConfig,
  PackageAuditLevel,
  PackageManager,
  dependencyGroups,
} from '../config';
import { pkgManagerCommands } from '../constants';
import { normalizeAuditMapper } from './audit/constants';
import { auditResultToAuditOutput } from './audit/transform';
import { auditArgs } from './audit/utils';
import { PLUGIN_CONFIG_PATH, RUNNER_OUTPUT_PATH } from './constants';
import { normalizeOutdatedMapper, outdatedArgs } from './outdated/constants';
import { outdatedResultToAuditOutput } from './outdated/transform';

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
    command: pkgManagerCommands[packageManager],
    args: ['outdated', ...outdatedArgs[packageManager]],
    cwd: process.cwd(),
    alwaysResolve: true, // npm outdated returns exit code 1 when outdated dependencies are found
  });

  const normalizedResult = normalizeOutdatedMapper[packageManager](stdout);
  return dependencyGroups.map(dep =>
    outdatedResultToAuditOutput(normalizedResult, dep),
  );
}

async function processAudit(
  packageManager: PackageManager,
  auditLevelMapping: Record<PackageAuditLevel, IssueSeverity>,
) {
  const auditResults = await Promise.allSettled(
    dependencyGroups.map<Promise<AuditOutput>>(async dep => {
      const { stdout } = await executeProcess({
        command: pkgManagerCommands[packageManager],
        args: ['audit', ...auditArgs(dep)[packageManager]],
        cwd: process.cwd(),
      });

      const normalizedResult = normalizeAuditMapper[packageManager](stdout);
      return auditResultToAuditOutput(normalizedResult, dep, auditLevelMapping);
    }),
  );
  const rejected = auditResults.filter(isPromiseRejectedResult);
  if (rejected.length > 0) {
    rejected.map(result => {
      console.error(result.reason);
    });

    throw new Error(
      `JS Packages plugin: Running ${pkgManagerCommands[packageManager]} audit failed.`,
    );
  }

  return auditResults.filter(isPromiseFulfilledResult).map(x => x.value);
}
