import type { AuditResult, Vulnerability } from '../../runner/audit/types';
import { getVulnerabilitiesTotal } from '../../runner/audit/utils';
import type { Yarnv2AuditResultJson } from './types';

export function yarnv2ToAuditResult(output: string): AuditResult {
  const yarnv2Audit = JSON.parse(output) as Yarnv2AuditResultJson;

  const vulnerabilities = Object.values(yarnv2Audit.advisories).map(
    ({
      module_name: name,
      severity,
      title,
      url,
      vulnerable_versions: versionRange,
      recommendation: fixInformation,
      findings,
    }): Vulnerability => {
      // TODO missing example of an indirect dependency to verify this
      const directDep = findings[0]?.paths[0];
      return {
        name,
        severity,
        title,
        url,
        versionRange,
        fixInformation,
        directDependency:
          directDep != null && directDep !== name ? directDep : true,
      };
    },
  );

  return {
    vulnerabilities,
    summary: {
      ...yarnv2Audit.metadata.vulnerabilities,
      total: getVulnerabilitiesTotal(yarnv2Audit.metadata.vulnerabilities),
    },
  };
}
