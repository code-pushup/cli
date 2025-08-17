import type { PackageAuditLevel } from '../../config.js';

export const auditScoreModifiers: Record<PackageAuditLevel, number> = {
  /* eslint-disable @typescript-eslint/no-magic-numbers */
  critical: 1,
  high: 0.1,
  moderate: 0.05,
  low: 0.02,
  info: 0.01,
  /* eslint-enable @typescript-eslint/no-magic-numbers */
};
