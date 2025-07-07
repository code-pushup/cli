// Subset of Yarn v2+ audit JSON type
import type { PackageAuditLevel } from '../../config.js';
import type { DependencyGroupLong } from '../../runner/outdated/types.js';

export type Yarnv2AuditAdvisory = {
  module_name: string;
  severity: PackageAuditLevel;
  vulnerable_versions: string;
  recommendation: string;
  title: string;
  url: string;
  findings: { paths: string[] }[]; // TODO indirect?
};

export type Yarnv2AuditResultJson = {
  advisories: Record<string, Yarnv2AuditAdvisory>;
  metadata: { vulnerabilities: Record<PackageAuditLevel, number> };
};

// Subset of Yarn v2 outdated JSON type
export type Yarnv2VersionOverview = {
  current: string;
  latest: string;
  name: string;
  type: DependencyGroupLong;
  workspace?: string;
};

export type Yarnv2OutdatedResultJson = Yarnv2VersionOverview[];
