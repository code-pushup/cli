import type { PackageAuditLevel } from '../../config';

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

export const yarnv1FieldNames = [
  'Package',
  'Current',
  'Latest',
  'Package Type',
  'URL',
] as const;

export type Yarnv1FieldName = (typeof yarnv1FieldNames)[number];

type Yarnv1Info = { type: 'info' };
type Yarnv1Table = {
  type: 'table';
  data: {
    head: string[];
    body: string[][];
  };
};

export type Yarnv1OutdatedResultJson = [Yarnv1Info, Yarnv1Table];
