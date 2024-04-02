import { fromJsonLines, objectToEntries } from '@code-pushup/utils';
import { PackageAuditLevel } from '../../config';
import { filterAuditResult } from '../utils';
import {
  AuditResult,
  NpmAdvisory,
  NpmAuditResultJson,
  NpmFixInformation,
  NpmVulnerabilities,
  PnpmAuditResultJson,
  Vulnerability,
  Yarnv1AuditAdvisory,
  Yarnv1AuditResultJson,
  Yarnv1AuditSummary,
  Yarnv2AuditResultJson,
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
        directDependency: detail.isDirect ? true : detail.effects[0] ?? '',
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

export function pnpmToAuditResult(output: string): AuditResult {
  const pnpmResult = JSON.parse(output) as PnpmAuditResultJson;

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

function getVulnerabilitiesTotal(
  summary: Record<PackageAuditLevel, number>,
): number {
  return Object.values(summary).reduce((acc, value) => acc + value, 0);
}
