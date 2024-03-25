import type { PackageAuditLevel } from '../../config';

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

export type NpmVulnerabilities = Record<
  string,
  {
    name: string;
    severity: PackageAuditLevel;
    isDirect: boolean;
    effects: string[];
    via: NpmAdvisory[] | string[];
    range: string;
    fixAvailable: boolean | NpmFixInformation;
  }
>;

export type NpmAuditResultJson = {
  vulnerabilities: NpmVulnerabilities;
  metadata: {
    vulnerabilities: Record<PackageAuditLevel | 'total', number>;
  };
};

// Subset of Yarn v1 audit JSON type
/* eslint-disable @typescript-eslint/naming-convention */
export type Yarnv1AuditAdvisory = {
  type: 'auditAdvisory';
  data: {
    resolution: {
      id: number;
      path: string;
    };
    advisory: {
      module_name: string;
      severity: PackageAuditLevel;
      vulnerable_versions: string;
      recommendation: string;
      title: string;
      url: string;
    };
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

// Unified Audit result type
export type AuditResult = {
  vulnerabilities: {
    name: string;
    id?: number;
    title?: string;
    url?: string;
    severity: PackageAuditLevel;
    versionRange: string;
    directDependency: string | true; // either name of direct dependency this one affects or true
    fixInformation: string | false; // either guide on how to fix the vulnerability or false
  }[];
  summary: Record<PackageAuditLevel | 'total', number>;
};
