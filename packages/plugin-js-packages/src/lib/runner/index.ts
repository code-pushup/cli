import { writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { RunnerConfig } from '@code-pushup/models';
import {
  ensureDirectoryExists,
  executeProcess,
  isPromiseFulfilledResult,
  isPromiseRejectedResult,
  objectFromEntries,
  readJsonFile,
} from '@code-pushup/utils';
import {
  AuditSeverity,
  DependencyGroup,
  FinalJSPackagesPluginConfig,
  PackageManager,
  dependencyGroups,
} from '../config';
import { auditResultToAuditOutput } from './audit/transform';
import { AuditResult } from './audit/types';
import { PLUGIN_CONFIG_PATH, RUNNER_OUTPUT_PATH } from './constants';
import { outdatedResultToAuditOutput } from './outdated/transform';
import { adapters } from './package-managers';

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
  const adapter = adapters[packageManager];
  const { stdout } = await executeProcess({
    command: adapter.command,
    args: ['outdated', '--json', ...adapter.outdated.commandArgs],
    cwd: process.cwd(),
    ignoreExitCode: true, // outdated returns exit code 1 when outdated dependencies are found
  });

  const normalizedResult = adapter.outdated.unifyResult(stdout);
  return dependencyGroups.map(dep =>
    outdatedResultToAuditOutput(normalizedResult, packageManager, dep),
  );
}

async function processAudit(
  packageManager: PackageManager,
  auditLevelMapping: AuditSeverity,
) {
  const adapter = adapters[packageManager];

  const supportedDepGroups =
    adapter.audit.supportedDepGroups ?? dependencyGroups;

  const auditResults = await Promise.allSettled(
    supportedDepGroups.map(
      async (dep): Promise<[DependencyGroup, AuditResult]> => {
        const { stdout } = await executeProcess({
          command: adapter.command,
          args: adapter.audit.getCommandArgs(dep),
          cwd: process.cwd(),
          ignoreExitCode: adapter.audit.ignoreExitCode,
        });
        return [dep, adapter.audit.unifyResult(stdout)];
      },
    ),
  );

  const rejected = auditResults.filter(isPromiseRejectedResult);
  if (rejected.length > 0) {
    rejected.map(result => {
      console.error(result.reason);
    });

    throw new Error(
      `JS Packages plugin: Running ${adapter.name} audit failed.`,
    );
  }

  const fulfilled = objectFromEntries(
    auditResults.filter(isPromiseFulfilledResult).map(x => x.value),
  );

  const uniqueResults =
    adapter.audit.postProcessResult?.(fulfilled) ?? fulfilled;

  return supportedDepGroups.map(group =>
    auditResultToAuditOutput(
      uniqueResults[group],
      packageManager,
      group,
      auditLevelMapping,
    ),
  );
}
