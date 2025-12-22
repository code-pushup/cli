import path from 'node:path';
import {
  logger,
  objectFromEntries,
  objectToEntries,
  objectToKeys,
  pluralizeToken,
  readJsonFile,
} from '@code-pushup/utils';
import type { AuditResult, Vulnerability } from './audit/types.js';
import {
  type DependencyTotals,
  type PackageJson,
  dependencyGroupLong,
} from './outdated/types.js';

export function filterAuditResult(
  result: AuditResult,
  key: keyof Vulnerability,
  referenceResult?: AuditResult,
): AuditResult {
  if (result.vulnerabilities.length === 0) {
    return result;
  }

  const uniqueResult = result.vulnerabilities.reduce<AuditResult>(
    (acc, ref) => {
      const matchReference = referenceResult ?? acc;
      const isMatch = matchReference.vulnerabilities
        .map(vulnerability => vulnerability[key])
        .includes(ref[key]);

      if (isMatch) {
        return {
          vulnerabilities: acc.vulnerabilities,
          summary: {
            ...acc.summary,
            [ref.severity]: acc.summary[ref.severity] - 1,
            total: acc.summary.total - 1,
          },
        };
      }

      return {
        vulnerabilities: [...acc.vulnerabilities, ref],
        summary: acc.summary,
      };
    },
    { vulnerabilities: [], summary: result.summary },
  );

  return {
    vulnerabilities: uniqueResult.vulnerabilities,
    summary: uniqueResult.summary,
  };
}

export async function getTotalDependencies(
  packageJsonPath: string,
): Promise<DependencyTotals> {
  const formattedPath = path.relative(process.cwd(), packageJsonPath);

  return logger.task(
    `Counting direct dependencies in ${formattedPath}`,
    async () => {
      const parsedDeps = await readJsonFile<PackageJson>(packageJsonPath);

      const mergedDeps = objectFromEntries(
        dependencyGroupLong.map(group => {
          const deps = parsedDeps[group];
          return [group, deps == null ? [] : objectToKeys(deps)];
        }),
      );

      const depTotals = objectFromEntries(
        objectToKeys(mergedDeps).map(deps => [
          deps,
          new Set(mergedDeps[deps]).size,
        ]),
      );

      const depTotal = Object.values(depTotals).reduce(
        (acc, count) => acc + count,
        0,
      );
      const groupsSummary = objectToEntries(depTotals)
        .filter(([, count]) => count > 0)
        .map(([group, count]) => `${count} ${group}`)
        .join(', ');
      const message = `Found ${pluralizeToken('direct dependency', depTotal)} in ${formattedPath} (${groupsSummary})`;

      return { message, result: depTotals };
    },
  );
}
