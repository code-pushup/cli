import { fromJsonLines } from '@code-pushup/utils';
import type { AuditResult, Vulnerability } from '../../runner/audit/types.js';
import { filterAuditResult } from '../../runner/utils.js';
import type {
  YarnClassicAuditAdvisory,
  YarnClassicAuditResultJson,
  YarnClassicAuditSummary,
} from './types.js';

export function yarnClassicToAuditResult(output: string): AuditResult {
  const yarnResult = fromJsonLines<YarnClassicAuditResultJson>(output);
  const [yarnAdvisories, yarnSummary] = validateYarnAuditResult(yarnResult);

  const vulnerabilities = yarnAdvisories.map(
    ({ data: { resolution, advisory } }): Vulnerability => {
      const { id, path } = resolution;
      const directDependency = path.slice(0, path.indexOf('>'));

      const {
        module_name: name,
        title,
        url,
        severity,
        vulnerable_versions: versionRange,
        recommendation: fixInformation,
      } = advisory;

      return {
        name,
        title,
        id,
        url,
        severity,
        versionRange,
        directDependency: name === directDependency ? true : directDependency,
        fixInformation,
      };
    },
  );

  const summary = {
    ...yarnSummary.data.vulnerabilities,
    total: Object.values(yarnSummary.data.vulnerabilities).reduce(
      (acc, amount) => acc + amount,
      0,
    ),
  };

  // duplicates are filtered out based on their ID
  return filterAuditResult({ vulnerabilities, summary }, 'id');
}

function validateYarnAuditResult(
  result: YarnClassicAuditResultJson,
): [YarnClassicAuditAdvisory[], YarnClassicAuditSummary] {
  const summary = result.at(-1);
  if (summary?.type !== 'auditSummary') {
    throw new Error('Invalid Yarn v1 audit result - no summary found.');
  }

  const vulnerabilities = result.filter(item => item.type === 'auditAdvisory');

  return [vulnerabilities, summary];
}
