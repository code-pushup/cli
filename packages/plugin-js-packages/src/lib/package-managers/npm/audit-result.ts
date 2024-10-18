import { objectToEntries } from '@code-pushup/utils';
import type { AuditResult, Vulnerability } from '../../runner/audit/types';
import type {
  NpmAdvisory,
  NpmAuditResultJson,
  NpmFixInformation,
  NpmVulnerabilities,
} from './types';

export function npmToAuditResult(output: string): AuditResult {
  const npmAudit = JSON.parse(output) as NpmAuditResultJson;

  const vulnerabilities = objectToEntries(npmAudit.vulnerabilities).map(
    ([name, detail]): Vulnerability => {
      const advisory = npmToAdvisory(name, npmAudit.vulnerabilities);
      return {
        name: name.toString(),
        severity: detail.severity,
        versionRange: detail.range,
        directDependency: detail.isDirect ? true : (detail.effects[0] ?? ''),
        fixInformation: npmToFixInformation(detail.fixAvailable),
        ...(advisory != null && {
          title: advisory.title,
          url: advisory.url,
        }),
      };
    },
  );

  return {
    vulnerabilities,
    summary: npmAudit.metadata.vulnerabilities,
  };
}

export function npmToFixInformation(
  fixAvailable: boolean | NpmFixInformation,
): string {
  if (typeof fixAvailable === 'boolean') {
    return fixAvailable ? 'Fix is available.' : '';
  }

  return `Fix available: Update \`${fixAvailable.name}\` to version **${
    fixAvailable.version
  }**${fixAvailable.isSemVerMajor ? ' (breaking change).' : '.'}`;
}

export function npmToAdvisory(
  name: string,
  vulnerabilities: NpmVulnerabilities,
  prevNodes: Set<string> = new Set(),
): NpmAdvisory | null {
  const advisory = vulnerabilities[name]?.via;

  if (
    Array.isArray(advisory) &&
    advisory.length > 0 &&
    typeof advisory[0] === 'object'
  ) {
    return { title: advisory[0].title, url: advisory[0].url };
  }

  // Cross-references another vulnerability
  if (
    Array.isArray(advisory) &&
    advisory.length > 0 &&
    advisory.every((value): value is string => typeof value === 'string')
  ) {
    /* eslint-disable functional/no-let, functional/immutable-data, functional/no-loop-statements, prefer-const */
    let advisoryInfo: NpmAdvisory | null = null;
    let newReferences: string[] = [];
    let advisoryInfoFound = false;
    /* eslint-enable functional/no-let, prefer-const */

    for (const via of advisory) {
      if (!prevNodes.has(via)) {
        newReferences.push(via);
      }
    }

    while (newReferences.length > 0 && !advisoryInfoFound) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const ref = newReferences.pop()!;
      prevNodes.add(ref);
      const result = npmToAdvisory(ref, vulnerabilities, prevNodes);

      if (result != null) {
        advisoryInfo = { title: result.title, url: result.url };
        advisoryInfoFound = true;
      }
    }
    /* eslint-enable functional/immutable-data, functional/no-loop-statements */

    return advisoryInfo;
  }

  return null;
}
