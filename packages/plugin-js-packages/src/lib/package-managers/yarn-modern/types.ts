import type { PackageAuditLevel } from '../../config.js';
import type { DependencyGroupLong } from '../../runner/outdated/types.js';

export type YarnBerry2or3AuditAdvisory = {
  module_name: string;
  severity: PackageAuditLevel;
  vulnerable_versions: string;
  recommendation: string;
  title: string;
  url: string;
  findings: { paths: string[] }[]; // TODO indirect?
};

export type YarnBerry2or3AuditResultJson = {
  advisories: Record<string, YarnBerry2or3AuditAdvisory>;
  metadata: { vulnerabilities: Record<PackageAuditLevel, number> };
};

export type YarnBerry4AuditVulnerability = {
  value: string;
  children: {
    ID: number;
    Issue: string;
    URL: string;
    Severity: PackageAuditLevel;
    'Vulnerable Versions': string;
    'Tree Versions': string[];
    Dependents: string[];
  };
};

export type YarnBerry4AuditResultJson = YarnBerry4AuditVulnerability[];

// Subset of Yarn v2 outdated JSON type
export type YarnBerryOutdatedPackage = {
  current: string;
  latest: string;
  name: string;
  range?: string;
  type: DependencyGroupLong;
  url?: string;
  workspace?: string;
};

export type YarnBerryOutdatedResultJson = YarnBerryOutdatedPackage[];
