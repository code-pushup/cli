import type { PackageAuditLevel } from '../../config';

// Unified Audit result type
export type Vulnerability = {
  name: string;
  id?: number;
  title?: string;
  url?: string;
  severity: PackageAuditLevel;
  versionRange: string;
  directDependency: string | true; // either name of direct dependency this one affects or true
  fixInformation: string | false; // either guide on how to fix the vulnerability or false
};
export type AuditSummary = Record<PackageAuditLevel | 'total', number>;
export type AuditResult = {
  vulnerabilities: Vulnerability[];
  summary: AuditSummary;
};

// Subset of NPM audit JSON type
export type NpmAdvisory = {
  title: string;
  url: string;
};

export type NpmFixInformation = {
  name: string;
  version: string;
  isSemVerMajor: boolean;
};

export type NpmVulnerability = {
  name: string;
  severity: PackageAuditLevel;
  isDirect: boolean;
  effects: string[];
  via: NpmAdvisory[] | string[];
  range: string;
  fixAvailable: boolean | NpmFixInformation;
};

export type NpmVulnerabilities = Record<string, NpmVulnerability>;

export type NpmAuditResultJson = {
  vulnerabilities: NpmVulnerabilities;
  metadata: {
    vulnerabilities: AuditSummary;
  };
};

// Subset of Yarn v1 audit JSON type
export type Yarnv1AuditAdvisory = {
  type: 'auditAdvisory';
  data: {
    resolution: {
      id: number;
      path: string;
    };
    /* eslint-disable @typescript-eslint/naming-convention */
    advisory: {
      module_name: string;
      severity: PackageAuditLevel;
      vulnerable_versions: string;
      recommendation: string;
      title: string;
      url: string;
    };
    /* eslint-enable @typescript-eslint/naming-convention */
  };
};

export type Yarnv1AuditSummary = {
  type: 'auditSummary';
  data: {
    vulnerabilities: Record<PackageAuditLevel, number>;
  };
};

// NOTE: When rest operator can be at the beginning, the process will be much simpler
export type Yarnv1AuditResultJson = [
  ...Yarnv1AuditAdvisory[],
  Yarnv1AuditSummary,
];

// Subset of Yarn v2+ audit JSON type
/* eslint-disable @typescript-eslint/naming-convention */
export type Yarnv2AuditAdvisory = {
  module_name: string;
  severity: PackageAuditLevel;
  vulnerable_versions: string;
  recommendation: string;
  title: string;
  url: string;
  findings: { paths: string[] }[]; // TODO indirect?
};
/* eslint-enable @typescript-eslint/naming-convention */

export type Yarnv2AuditResultJson = {
  advisories: Record<string, Yarnv2AuditAdvisory>;
  metadata: { vulnerabilities: Record<PackageAuditLevel, number> };
};

// Subset of PNPM audit JSON type
/* eslint-disable @typescript-eslint/naming-convention */
export type PnpmAuditAdvisory = {
  module_name: string;
  id: number;
  severity: PackageAuditLevel;
  vulnerable_versions: string;
  recommendation: string;
  title: string;
  url: string;
  findings: { paths: string[] }[];
};
/* eslint-enable @typescript-eslint/naming-convention */

export type PnpmAuditResultJson = {
  advisories: Record<string, PnpmAuditAdvisory>;
  metadata: { vulnerabilities: Record<PackageAuditLevel, number> };
};
