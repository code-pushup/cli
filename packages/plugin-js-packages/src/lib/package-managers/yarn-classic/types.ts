import type { PackageAuditLevel } from '../../config.js';

// Subset of Yarn v1 audit JSON type
export type YarnClassicAuditAdvisory = {
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

export type YarnClassicAuditSummary = {
  type: 'auditSummary';
  data: {
    vulnerabilities: Record<PackageAuditLevel, number>;
  };
};

export type YarnClassicAuditResultJson = [
  ...YarnClassicAuditAdvisory[],
  YarnClassicAuditSummary,
];

export const yarnClassicFieldNames = [
  'Package',
  'Current',
  'Latest',
  'Package Type',
  'URL',
] as const;

export type YarnClassicFieldName = (typeof yarnClassicFieldNames)[number];

type YarnClassicInfo = { type: 'info' };
type YarnClassicTable = {
  type: 'table';
  data: {
    head: string[];
    body: string[][];
  };
};

export type YarnClassicOutdatedResultJson =
  | [YarnClassicInfo, YarnClassicTable]
  | [];
