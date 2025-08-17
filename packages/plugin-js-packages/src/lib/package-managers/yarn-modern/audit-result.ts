import { fromJsonLines } from '@code-pushup/utils';
import type { AuditResult, Vulnerability } from '../../runner/audit/types.js';
import {
  getVulnerabilitiesTotal,
  summaryStatsFromVulnerabilities,
} from '../../runner/audit/utils.js';
import type {
  YarnBerry2or3AuditResultJson,
  YarnBerry4AuditResultJson,
} from './types.js';

export function yarnBerryToAuditResult(output: string): AuditResult {
  const json = fromJsonLines<
    [YarnBerry2or3AuditResultJson] | YarnBerry4AuditResultJson
  >(output);

  if (json.length === 1 && 'advisories' in json[0] && 'metadata' in json[0]) {
    return transformYarn2or3(json[0]);
  }

  if (json.every(item => 'value' in item && 'children' in item)) {
    return transformYarn4(json);
  }

  throw new Error(
    `Unknown output format from 'yarn npm audit --json':\n${output}`,
  );
}

function transformYarn2or3(json: YarnBerry2or3AuditResultJson): AuditResult {
  const vulnerabilities = Object.values(json.advisories).map(
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
      ...json.metadata.vulnerabilities,
      total: getVulnerabilitiesTotal(json.metadata.vulnerabilities),
    },
  };
}

function transformYarn4(json: YarnBerry4AuditResultJson): AuditResult {
  const vulnerabilities = json.map(
    ({ value, children }): Vulnerability => ({
      name: value,
      severity: children['Severity'],
      title: children['Issue'],
      url: children['URL'],
      id: children['ID'],
      versionRange: children['Vulnerable Versions'],
      directDependency:
        children['Dependents'].some(spec => spec.endsWith('@workspace:.')) ||
        '',
    }),
  );

  const summary = summaryStatsFromVulnerabilities(vulnerabilities);

  return { vulnerabilities, summary };
}
