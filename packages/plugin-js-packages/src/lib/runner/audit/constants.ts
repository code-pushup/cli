import type { PackageAuditLevel } from '../../config';

/* eslint-disable no-magic-numbers */
export const auditScoreModifiers: Record<PackageAuditLevel, number> = {
  critical: 1,
  high: 0.1,
  moderate: 0.05,
  low: 0.02,
  info: 0.01,
};
/* eslint-enable no-magic-numbers */
