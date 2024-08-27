import type { PackageAuditLevel } from '../../config';
import type { AuditSummary } from '../../runner/audit/types';
import type { DependencyGroupLong } from '../../runner/outdated/types';

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

// Subset of NPM outdated JSON type
export type NpmVersionOverview = {
  current?: string;
  latest: string;
  type: DependencyGroupLong;
  homepage?: string;
};

export type NpmNormalizedOverview = Omit<NpmVersionOverview, 'current'> & {
  current: string;
};

export type NpmOutdatedResultJson = Record<string, NpmVersionOverview>;
