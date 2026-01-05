import path from 'node:path';
import type {
  RunnerFunction,
  TableColumnObject,
  TableRowObject,
} from '@code-pushup/models';
import {
  asyncSequential,
  capitalize,
  executeProcess,
  formatAsciiTable,
  logger,
  objectFromEntries,
  objectToEntries,
  pluralizeToken,
} from '@code-pushup/utils';
import {
  type AuditSeverity,
  type DependencyGroup,
  type FinalJSPackagesPluginConfig,
  type PackageAuditLevel,
  type PackageJsonPath,
  type PackageManagerId,
  dependencyGroups,
  packageAuditLevels,
} from '../config.js';
import { dependencyGroupToLong } from '../constants.js';
import { packageManagers } from '../package-managers/package-managers.js';
import { auditResultToAuditOutput } from './audit/transform.js';
import type { AuditResult } from './audit/types.js';
import { outdatedResultToAuditOutput } from './outdated/transform.js';
import { getTotalDependencies } from './utils.js';

export function createRunnerFunction(
  config: FinalJSPackagesPluginConfig,
): RunnerFunction {
  return (): Promise<AuditOutputs> =>
    profiler.measureAsync(
      'plugin-js-packages:runner',
      async (): Promise<AuditOutputs> => {
        const {
          packageManager,
          checks,
          auditLevelMapping,
          packageJsonPath,
          dependencyGroups: depGroups,
        } = config;

        const auditResults = checks.includes('audit')
          ? await processAudit(
              packageManager,
              depGroups,
              auditLevelMapping,
              packageJsonPath,
            )
          : [];

        const outdatedResults = checks.includes('outdated')
          ? await processOutdated(packageManager, depGroups, packageJsonPath)
          : [];

        return [...auditResults, ...outdatedResults];
      },
      {
        ...profiler.measureConfig.tracks.pluginJsPackages,
        success: (result: AuditOutputs) => ({
          properties: [
            ['Package Manager', packageManager],
            ['Checks', String(checks.length)],
            [
              'Audit Results',
              String(result.filter(r => r.slug.includes('audit')).length),
            ],
            [
              'Outdated Results',
              String(result.filter(r => r.slug.includes('outdated')).length),
            ],
            ['Total Audits', String(result.length)],
          ],
          tooltipText: `JS packages analysis completed with ${result.length} audits`,
        }),
      },
    );
}

async function processOutdated(
  id: PackageManagerId,
  depGroups: DependencyGroup[],
  packageJsonPath: PackageJsonPath,
) {
  logger.info('Looking for outdated packages ...');

  const pm = packageManagers[id];
  const { stdout } = await executeProcess({
    command: pm.command,
    args: pm.outdated.commandArgs,
    cwd: packageJsonPath ? path.dirname(packageJsonPath) : process.cwd(),
    ignoreExitCode: true, // outdated returns exit code 1 when outdated dependencies are found
  });

  const normalizedResult = pm.outdated.unifyResult(stdout);
  logger.info(
    `Detected ${pluralizeToken('outdated package', normalizedResult.length)} in total`,
  );

  const depTotals = await getTotalDependencies(packageJsonPath);

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
  packageJsonPath: PackageJsonPath,
) {
  const pm = packageManagers[id];
  const supportedAuditDepGroups =
    pm.audit.supportedDepGroups ?? dependencyGroups;
  const compatibleAuditDepGroups = depGroups.filter(group =>
    supportedAuditDepGroups.includes(group),
  );

  logger.info(
    `Auditing packages for ${pluralizeToken('dependency group', compatibleAuditDepGroups.length)} (${compatibleAuditDepGroups.join(', ')}) ...`,
  );

  const auditResults = await asyncSequential(
    compatibleAuditDepGroups,
    async (depGroup): Promise<[DependencyGroup, AuditResult]> => {
      const { stdout } = await executeProcess({
        command: pm.command,
        args: pm.audit.getCommandArgs(depGroup),
        cwd: packageJsonPath ? path.dirname(packageJsonPath) : process.cwd(),
        ignoreExitCode: pm.audit.ignoreExitCode,
      });
      return [depGroup, pm.audit.unifyResult(stdout)];
    },
  );

  const resultsMap = objectFromEntries(auditResults);
  const uniqueResults = pm.audit.postProcessResult?.(resultsMap) ?? resultsMap;

  logAuditSummary(uniqueResults);

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

function logAuditSummary(
  results: Partial<Record<DependencyGroup, AuditResult>>,
): void {
  const { totalCount, countsPerLevel } = aggregateAuditResults(results);
  const formattedLevels = objectToEntries(countsPerLevel)
    .filter(([, count]) => count > 0)
    .map(([level, count]) => `${count} ${level}`)
    .join(', ');

  logger.info(
    [
      `Found ${pluralizeToken('vulnerability', totalCount)} in total`,
      formattedLevels && `(${formattedLevels})`,
    ]
      .filter(Boolean)
      .join(' '),
  );

  if (!logger.isVerbose()) {
    return;
  }
  logger.debug(
    formatAsciiTable({
      columns: [
        { key: 'depGroup', label: 'Dep. group' },
        ...[...packageAuditLevels, 'total'].map(
          (level): TableColumnObject => ({
            key: level,
            label: capitalize(level),
            align: 'right',
          }),
        ),
      ],
      rows: objectToEntries(results).map(
        ([depGroup, result]): TableRowObject => ({
          depGroup,
          ...result?.summary,
        }),
      ),
    }),
  );
}

function aggregateAuditResults(
  results: Partial<Record<DependencyGroup, AuditResult>>,
) {
  const totalCount = Object.values(results).reduce(
    (acc, { vulnerabilities }) => acc + vulnerabilities.length,
    0,
  );
  const countsPerLevel = Object.values(results).reduce<
    Record<PackageAuditLevel, number>
  >(
    (acc, { summary }) =>
      objectFromEntries(
        packageAuditLevels.map(level => [level, acc[level] + summary[level]]),
      ),
    objectFromEntries(packageAuditLevels.map(level => [level, 0])),
  );

  return { totalCount, countsPerLevel };
}
