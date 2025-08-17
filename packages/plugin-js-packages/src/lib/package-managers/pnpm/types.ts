// Subset of PNPM audit JSON type
import type { PackageAuditLevel } from '../../config.js';
import type { DependencyGroupLong } from '../../runner/outdated/types.js';

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

export type PnpmAuditResultJson = {
  advisories: Record<string, PnpmAuditAdvisory>;
  metadata: { vulnerabilities: Record<PackageAuditLevel, number> };
};

// Subset of PNPM outdated JSON type
export type PnpmVersionOverview = {
  current: string;
  latest: string;
  dependencyType: DependencyGroupLong;
};
export type PnpmOutdatedResultJson = Record<string, PnpmVersionOverview>;
