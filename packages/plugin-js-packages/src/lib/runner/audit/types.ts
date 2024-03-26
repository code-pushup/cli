import type { PackageAuditLevel } from '../../config';

// Subset of NPM audit JSON type
type Advisory = {
  title: string;
  url: string;
};

type FixInformation = {
  name: string;
  version: string;
  isSemVerMajor: boolean;
};

export type Vulnerability = {
  name: string;
  severity: PackageAuditLevel;
  via: Advisory[] | string[];
  range: string;
  fixAvailable: boolean | FixInformation;
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
