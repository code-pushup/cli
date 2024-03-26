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
import { auditArgs, normalizeAuditMapper } from './audit/constants';
import { auditResultToAuditOutput } from './audit/transform';
import { AuditResult } from './audit/types';
import { PLUGIN_CONFIG_PATH, RUNNER_OUTPUT_PATH } from './constants';
import { normalizeOutdatedMapper, outdatedArgs } from './outdated/constants';
import { outdatedResultToAuditOutput } from './outdated/transform';
import { filterAuditResult } from './utils';

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
    ignoreExitCode: true, // npm outdated returns exit code 1 when outdated dependencies are found
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
  const auditResults = await Promise.allSettled(
    dependencyGroups.map(
      async (dep): Promise<[DependencyGroup, AuditResult]> => {
        const { stdout } = await executeProcess({
          command: pkgManagerCommands[packageManager],
          args: ['audit', ...auditArgs(dep)[packageManager]],
          cwd: process.cwd(),
          ignoreExitCode: packageManager === 'yarn-classic', // yarn v1 does not have exit code configuration
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

  // For npm, one needs to filter out prod dependencies as there is no way to omit them
  const uniqueResults =
    packageManager === 'npm'
      ? {
          prod: fulfilled.prod,
          dev: filterAuditResult(fulfilled.dev, 'name', fulfilled.prod),
          optional: filterAuditResult(
            fulfilled.optional,
            'name',
            fulfilled.prod,
          ),
        }
      : fulfilled;

  return dependencyGroups.map(group =>
    auditResultToAuditOutput(
      uniqueResults[group],
      packageManager,
      group,
      auditLevelMapping,
    ),
  );
}
