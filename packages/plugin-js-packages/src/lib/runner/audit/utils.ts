import type { PackageAuditLevel } from '../../config.js';

export function getVulnerabilitiesTotal(
  summary: Record<PackageAuditLevel, number>,
): number {
  return Object.values(summary).reduce((acc, value) => acc + value, 0);
}
