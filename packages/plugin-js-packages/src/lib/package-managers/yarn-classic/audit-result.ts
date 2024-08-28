import { fromJsonLines } from '@code-pushup/utils';
import type { AuditResult, Vulnerability } from '../../runner/audit/types';
import { filterAuditResult } from '../../runner/utils';
import type {
  Yarnv1AuditAdvisory,
  Yarnv1AuditResultJson,
  Yarnv1AuditSummary,
} from './types';

export function yarnv1ToAuditResult(output: string): AuditResult {
  const yarnv1Result = fromJsonLines<Yarnv1AuditResultJson>(output);
  const [yarnv1Advisory, yarnv1Summary] = validateYarnv1Result(yarnv1Result);

  const vulnerabilities = yarnv1Advisory.map(
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
    ...yarnv1Summary.data.vulnerabilities,
    total: Object.values(yarnv1Summary.data.vulnerabilities).reduce(
      (acc, amount) => acc + amount,
      0,
    ),
  };

  // duplicates are filtered out based on their ID
  return filterAuditResult({ vulnerabilities, summary }, 'id');
}

function validateYarnv1Result(
  result: Yarnv1AuditResultJson,
): [Yarnv1AuditAdvisory[], Yarnv1AuditSummary] {
  const summary = result.at(-1);
  if (summary?.type !== 'auditSummary') {
    throw new Error('Invalid Yarn v1 audit result - no summary found.');
  }

  const vulnerabilities = result.filter(
    (item): item is Yarnv1AuditAdvisory => item.type === 'auditAdvisory',
  );

  return [vulnerabilities, summary];
}
