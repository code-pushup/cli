// Subset of PNPM audit JSON type
import type { PackageAuditLevel } from '../../config.js';
import type { DependencyGroupLong } from '../../runner/outdated/types.js';

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

// Subset of PNPM outdated JSON type
export type PnpmVersionOverview = {
  current: string;
  latest: string;
  dependencyType: DependencyGroupLong;
};
export type PnpmOutdatedResultJson = Record<string, PnpmVersionOverview>;
