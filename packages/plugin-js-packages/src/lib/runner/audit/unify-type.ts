import { objectToEntries, toUnixNewlines } from '@code-pushup/utils';
import { filterAuditResult } from '../utils';
import {
  AuditResult,
  NpmAdvisory,
  NpmAuditResultJson,
  NpmFixInformation,
  NpmVulnerabilities,
  Yarnv1AuditAdvisory,
  Yarnv1AuditResultJson,
  Yarnv1AuditSummary,
} from './types';

export function npmToAuditResult(output: string): AuditResult {
  const npmAudit = JSON.parse(output) as NpmAuditResultJson;

  const vulnerabilities = objectToEntries(npmAudit.vulnerabilities).map<
    AuditResult['vulnerabilities'][number]
  >(([name, detail]) => {
    const advisory = npmToAdvisory(name, npmAudit.vulnerabilities);
    return {
      name: name.toString(),
      severity: detail.severity,
      versionRange: detail.range,
      directDependency: detail.isDirect ? true : detail.effects[0] ?? '',
      fixInformation: npmToFixInformation(detail.fixAvailable),
      ...(advisory != null && {
        title: advisory.title,
        url: advisory.url,
      }),
    };
  });

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
    typeof advisory[0] === 'string'
  ) {
    /* eslint-disable functional/no-let, functional/immutable-data, functional/no-loop-statements, prefer-const */
    let advisoryInfo: NpmAdvisory | null = null;
    let newReferences: string[] = [];
    let advisoryInfoFound = false;
    /* eslint-enable functional/no-let, prefer-const */

    for (const via of advisory as string[]) {
      if (!prevNodes.has(via)) {
        newReferences.push(via);
      }
    }

    while (newReferences.length > 0 && !advisoryInfoFound) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const ref = newReferences.pop()!;
      const result = npmToAdvisory(ref, vulnerabilities, prevNodes);

      if (result == null) {
        prevNodes.add(ref);
        continue;
      }

      advisoryInfo = { title: result.title, url: result.url };
      advisoryInfoFound = true;
    }
    /* eslint-enable functional/immutable-data, functional/no-loop-statements */

    return advisoryInfo;
  }

  return null;
}

export function yarnv1ToAuditResult(output: string): AuditResult {
  const yarnv1Json = jsonLinesToJson(output);
  const yarnv1Result = JSON.parse(yarnv1Json) as Yarnv1AuditResultJson;

  const [yarnv1Advisory, yarnv1Summary] = validateYarnv1Result(yarnv1Result);

  const vulnerabilities = yarnv1Advisory.map<AuditResult['vulnerabilities'][0]>(
    ({ data: { resolution, advisory } }) => {
      const directDependency = resolution.path.slice(
        0,
        resolution.path.indexOf('>'),
      );

      return {
        name: advisory.module_name,
        title: advisory.title,
        id: resolution.id,
        url: advisory.url,
        severity: advisory.severity,
        versionRange: advisory.vulnerable_versions,
        directDependency:
          advisory.module_name === directDependency ? true : directDependency,
        fixInformation: advisory.recommendation,
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

function jsonLinesToJson(text: string) {
  const unifiedNewLines = toUnixNewlines(text).trim();
  return unifiedNewLines === ''
    ? '[]'
    : `[${unifiedNewLines.split('\n').join(',')}]`;
}

function validateYarnv1Result(
  result: Yarnv1AuditResultJson,
): [Yarnv1AuditAdvisory[], Yarnv1AuditSummary] {
  if (result.length === 0) {
    throw new Error('Invalid Yarn v1 audit result - no properties found.');
  }

  if (result.length === 1) {
    if (result[0].type !== 'auditSummary') {
      throw new Error('Invalid Yarn v1 audit result - no summary found.');
    }

    return [[], result[0]];
  }

  const vulnerabilities = result.filter(
    item => item.type === 'auditAdvisory',
  ) as Yarnv1AuditAdvisory[];

  const summary = result.find(
    item => item.type === 'auditSummary',
  ) as Yarnv1AuditSummary;

  return [vulnerabilities, summary];
}
