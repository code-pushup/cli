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
import { pkgManagerCommands } from '../constants';
import {
  auditArgs,
  normalizeAuditMapper,
  postProcessingAuditMapper,
} from './audit/constants';
import { auditResultToAuditOutput } from './audit/transform';
import { AuditResult } from './audit/types';
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
    args: ['outdated', '--json', ...outdatedArgs[packageManager]],
    cwd: process.cwd(),
    ignoreExitCode: true, // outdated returns exit code 1 when outdated dependencies are found
  });

  const normalizedResult = normalizeOutdatedMapper[packageManager](stdout);
  return dependencyGroups.map(dep =>
    outdatedResultToAuditOutput(normalizedResult, packageManager, dep),
  );
}

async function processAudit(
  packageManager: PackageManager,
  auditLevelMapping: AuditSeverity,
) {
  // Yarn v2 does not support audit for optional dependencies
  const supportedDepGroups =
    packageManager === 'yarn-modern'
      ? dependencyGroups.filter(dep => dep !== 'optional')
      : dependencyGroups;

  const auditResults = await Promise.allSettled(
    supportedDepGroups.map(
      async (dep): Promise<[DependencyGroup, AuditResult]> => {
        const { stdout } = await executeProcess({
          command: pkgManagerCommands[packageManager],
          args: getAuditCommandArgs(packageManager, dep),
          cwd: process.cwd(),
          ignoreExitCode:
            packageManager === 'yarn-classic' || packageManager === 'pnpm', // yarn v1 and PNPM do not have exit code configuration
        });
        return [dep, normalizeAuditMapper[packageManager](stdout)];
      },
    ),
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

  const fulfilled = objectFromEntries(
    auditResults.filter(isPromiseFulfilledResult).map(x => x.value),
  );

  const uniqueResults =
    postProcessingAuditMapper[packageManager]?.(fulfilled) ?? fulfilled;

  return supportedDepGroups.map(group =>
    auditResultToAuditOutput(
      uniqueResults[group],
      packageManager,
      group,
      auditLevelMapping,
    ),
  );
}

function getAuditCommandArgs(
  packageManager: PackageManager,
  group: DependencyGroup,
) {
  return [
    ...(packageManager === 'yarn-modern' ? ['npm'] : []),
    'audit',
    '--json',
    ...auditArgs(group)[packageManager],
  ];
}
