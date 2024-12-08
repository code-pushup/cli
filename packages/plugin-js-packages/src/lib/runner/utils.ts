import { sep } from 'node:path';
import {
  crawlFileSystem,
  objectFromEntries,
  objectToKeys,
  readJsonFile,
} from '@code-pushup/utils';
import type { AuditResult, Vulnerability } from './audit/types.js';
import {
  type DependencyGroupLong,
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

// TODO: use .gitignore
export async function findAllPackageJson(): Promise<string[]> {
  return (
    await crawlFileSystem({
      directory: '.',
      pattern: /(^|[\\/])package\.json$/,
    })
  ).filter(
    path =>
      !path.startsWith(`node_modules${sep}`) &&
      !path.includes(`${sep}node_modules${sep}`) &&
      !path.startsWith(`.nx${sep}`),
  );
}

export async function getTotalDependencies(
  packageJsonPaths: string[],
): Promise<DependencyTotals> {
  const parsedDeps = await Promise.all(
    packageJsonPaths.map(readJsonFile<PackageJson>),
  );

  const mergedDeps = parsedDeps.reduce<Record<DependencyGroupLong, string[]>>(
    (acc, depMapper) =>
      objectFromEntries(
        dependencyGroupLong.map(group => {
          const deps = depMapper[group];
          return [
            group,
            [...acc[group], ...(deps == null ? [] : objectToKeys(deps))],
          ];
        }),
      ),
    { dependencies: [], devDependencies: [], optionalDependencies: [] },
  );
  return objectFromEntries(
    objectToKeys(mergedDeps).map(deps => [
      deps,
      new Set(mergedDeps[deps]).size,
    ]),
  );
}
