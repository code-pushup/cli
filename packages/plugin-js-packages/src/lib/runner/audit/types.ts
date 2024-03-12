import type { PackageAuditLevel } from '../../config';

// NPM audit JSON types
type Advisory = {
  title: string;
  url: string;
};

export type Vulnerability = {
  name: string;
  severity: PackageAuditLevel;
  via: Advisory[] | string[];
  range: string;
  fixAvailable: boolean;
};

export type Vulnerabilities = {
  [key: string]: Vulnerability;
};

export type NpmAuditResultJson = {
  vulnerabilities: Vulnerabilities;
  metadata: {
    vulnerabilities: Record<PackageAuditLevel | 'total', number>;
  };
};
