import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { RunnerConfig, RunnerFilesPaths } from '@code-pushup/models';
import {
  createRunnerFiles,
  ensureDirectoryExists,
  executeProcess,
  filePathToCliArg,
  isPromiseFulfilledResult,
  isPromiseRejectedResult,
  objectFromEntries,
  objectToCliArgs,
  readJsonFile,
} from '@code-pushup/utils';
import {
  type AuditSeverity,
  type DependencyGroup,
  type FinalJSPackagesPluginConfig,
  type PackageJsonPaths,
  type PackageManagerId,
  dependencyGroups,
} from '../config.js';
import { dependencyGroupToLong } from '../constants.js';
import { packageManagers } from '../package-managers/package-managers.js';
import { auditResultToAuditOutput } from './audit/transform.js';
import type { AuditResult } from './audit/types.js';
import { outdatedResultToAuditOutput } from './outdated/transform.js';
import { findAllPackageJson, getTotalDependencies } from './utils.js';

export async function createRunnerConfig(
  scriptPath: string,
  config: FinalJSPackagesPluginConfig,
): Promise<RunnerConfig> {
  const { runnerConfigPath, runnerOutputPath } = await createRunnerFiles(
    'js-packages',
    JSON.stringify(config),
  );

  return {
    command: 'node',
    args: [
      filePathToCliArg(scriptPath),
      ...objectToCliArgs({ runnerConfigPath, runnerOutputPath }),
    ],
    configFile: runnerConfigPath,
    outputFile: runnerOutputPath,
  };
}

export async function executeRunner({
  runnerConfigPath,
  runnerOutputPath,
}: RunnerFilesPaths): Promise<void> {
  const {
    packageManager,
    checks,
    auditLevelMapping,
    packageJsonPaths,
    dependencyGroups: depGroups,
  } = await readJsonFile<FinalJSPackagesPluginConfig>(runnerConfigPath);

  const auditResults = checks.includes('audit')
    ? await processAudit(packageManager, depGroups, auditLevelMapping)
    : [];

  const outdatedResults = checks.includes('outdated')
    ? await processOutdated(packageManager, depGroups, packageJsonPaths)
    : [];
  const checkResults = [...auditResults, ...outdatedResults];

  await ensureDirectoryExists(path.dirname(runnerOutputPath));
  await writeFile(runnerOutputPath, JSON.stringify(checkResults));
}

async function processOutdated(
  id: PackageManagerId,
  depGroups: DependencyGroup[],
  packageJsonPaths: PackageJsonPaths,
) {
  const pm = packageManagers[id];
  const { stdout, stderr } = await executeProcess({
    command: pm.command,
    args: pm.outdated.commandArgs,
    cwd: process.cwd(),
    ignoreExitCode: true, // outdated returns exit code 1 when outdated dependencies are found
  });

  // Successful outdated check has empty stderr
  if (stderr) {
    throw new Error(`JS packages plugin: outdated error: ${stderr}`);
  }

  // Locate all package.json files in the repository if not provided
  const finalPaths = Array.isArray(packageJsonPaths)
    ? packageJsonPaths
    : await findAllPackageJson();
  const depTotals = await getTotalDependencies(finalPaths);

  const normalizedResult = pm.outdated.unifyResult(stdout);
  return depGroups.map(depGroup =>
    outdatedResultToAuditOutput(
      normalizedResult,
      id,
      depGroup,
      depTotals[dependencyGroupToLong[depGroup]],
    ),
  );
}

async function processAudit(
  id: PackageManagerId,
  depGroups: DependencyGroup[],
  auditLevelMapping: AuditSeverity,
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
        const { stdout, stderr } = await executeProcess({
          command: pm.command,
          args: pm.audit.getCommandArgs(depGroup),
          cwd: process.cwd(),
          ignoreExitCode: pm.audit.ignoreExitCode,
        });
        // Successful audit check has empty stderr
        if (stderr) {
          throw new Error(`JS packages plugin: audit error: ${stderr}`);
        }
        return [depGroup, pm.audit.unifyResult(stdout)];
      },
    ),
  );

  const rejected = auditResults.filter(isPromiseRejectedResult);
  if (rejected.length > 0) {
    rejected.forEach(result => {
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
