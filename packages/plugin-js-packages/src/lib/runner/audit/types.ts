import type { PackageAuditLevel } from '../../config.js';

// Unified Audit result type
export type Vulnerability = {
  name: string;
  id?: number;
  title?: string;
  url?: string;
  severity: PackageAuditLevel;
  versionRange: string;
  directDependency: string | true; // either name of direct dependency this one affects or true
  fixInformation?: string | false; // either guide on how to fix the vulnerability or false
};
export type AuditSummary = Record<PackageAuditLevel | 'total', number>;
export type AuditResult = {
  vulnerabilities: Vulnerability[];
  summary: AuditSummary;
};
