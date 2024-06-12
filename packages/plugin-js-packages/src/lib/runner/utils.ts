import {
  objectFromEntries,
  objectToKeys,
  readJsonFile,
} from '@code-pushup/utils';
import { dependencyGroups } from '../config';
import { dependencyGroupToLong } from '../constants';
import { AuditResult, Vulnerability } from './audit/types';
import { PackageJson } from './outdated/types';

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

export async function getTotalDependencies(packageJsonPath: string) {
  const packageJson = await readJsonFile<PackageJson>(packageJsonPath);
  return objectFromEntries(
    dependencyGroups.map(depGroup => {
      const deps = packageJson[dependencyGroupToLong[depGroup]];
      return [depGroup, deps == null ? 0 : objectToKeys(deps).length];
    }),
  );
}
