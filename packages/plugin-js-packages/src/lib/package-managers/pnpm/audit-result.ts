import type { AuditResult, Vulnerability } from '../../runner/audit/types.js';
import { getVulnerabilitiesTotal } from '../../runner/audit/utils.js';
import type { PnpmAuditResultJson } from './types.js';
import { filterOutWarnings } from './utils.js';

export function pnpmToAuditResult(output: string): AuditResult {
  const pnpmResult = JSON.parse(
    filterOutWarnings(output),
  ) as PnpmAuditResultJson;

  const vulnerabilities = Object.values(pnpmResult.advisories).map(
    ({
      module_name: name,
      id,
      title,
      url,
      severity,
      vulnerable_versions: versionRange,
      recommendation: fixInformation,
      findings,
    }): Vulnerability => {
      const path = findings[0]?.paths[0];

      return {
        name,
        id,
        title,
        url,
        severity,
        versionRange,
        directDependency: path == null ? true : pnpmToDirectDependency(path),
        fixInformation,
      };
    },
  );

  return {
    vulnerabilities,
    summary: {
      ...pnpmResult.metadata.vulnerabilities,
      total: getVulnerabilitiesTotal(pnpmResult.metadata.vulnerabilities),
    },
  };
}

export function pnpmToDirectDependency(path: string): string | true {
  // the format is ". > <direct dependency>@<version> > ... > <current dependency>@<version>"
  const deps = path.split(' > ').slice(1);

  if (deps.length <= 1) {
    return true;
  }

  return deps[0]?.split('@')[0] ?? true;
}
