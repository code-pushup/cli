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
  PackageManagerId,
  dependencyGroups,
} from '../config';
import { packageManagers } from '../package-managers';
import { auditResultToAuditOutput } from './audit/transform';
import { AuditResult } from './audit/types';
import { PLUGIN_CONFIG_PATH, RUNNER_OUTPUT_PATH } from './constants';
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
  const {
    packageManager,
    checks,
    auditLevelMapping,
    dependencyGroups: depGroups,
  } = await readJsonFile<FinalJSPackagesPluginConfig>(PLUGIN_CONFIG_PATH);

  const auditResults = checks.includes('audit')
    ? await processAudit(packageManager, auditLevelMapping, depGroups)
    : [];

  const outdatedResults = checks.includes('outdated')
    ? await processOutdated(packageManager, depGroups)
    : [];
  const checkResults = [...auditResults, ...outdatedResults];

  await ensureDirectoryExists(dirname(RUNNER_OUTPUT_PATH));
  await writeFile(RUNNER_OUTPUT_PATH, JSON.stringify(checkResults));
}

async function processOutdated(
  id: PackageManagerId,
  depGroups: DependencyGroup[],
) {
  const pm = packageManagers[id];
  const { stdout } = await executeProcess({
    command: pm.command,
    args: pm.outdated.commandArgs,
    cwd: process.cwd(),
    ignoreExitCode: true, // outdated returns exit code 1 when outdated dependencies are found
  });

  const normalizedResult = pm.outdated.unifyResult(stdout);
  return depGroups.map(depGroup =>
    outdatedResultToAuditOutput(normalizedResult, id, depGroup),
  );
}

async function processAudit(
  id: PackageManagerId,
  auditLevelMapping: AuditSeverity,
  depGroups: DependencyGroup[],
) {
  const pm = packageManagers[id];
  const supportedAuditDepGroups =
    pm.audit.supportedDepGroups ?? dependencyGroups;
  const compatibleAuditDepGroups = depGroups.filter(group =>
    supportedAuditDepGroups.includes(group),
  );

  const auditResults = await Promise.allSettled(
    compatibleAuditDepGroups.map(
      async (depGroup): Promise<[DependencyGroup, AuditResult]> => {
        const { stdout } = await executeProcess({
          command: pm.command,
          args: pm.audit.getCommandArgs(depGroup),
          cwd: process.cwd(),
          ignoreExitCode: pm.audit.ignoreExitCode,
        });
        return [depGroup, pm.audit.unifyResult(stdout)];
      },
    ),
  );

  const rejected = auditResults.filter(isPromiseRejectedResult);
  if (rejected.length > 0) {
    rejected.map(result => {
      console.error(result.reason);
    });

    throw new Error(`JS Packages plugin: Running ${pm.name} audit failed.`);
  }

  const fulfilled = objectFromEntries(
    auditResults.filter(isPromiseFulfilledResult).map(x => x.value),
  );

  const uniqueResults = pm.audit.postProcessResult?.(fulfilled) ?? fulfilled;

  return compatibleAuditDepGroups.map(depGroup =>
    auditResultToAuditOutput(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      uniqueResults[depGroup]!,
      id,
      depGroup,
      auditLevelMapping,
    ),
  );
}
