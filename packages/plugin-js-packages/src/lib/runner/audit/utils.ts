import type { PackageAuditLevel } from '../../config';

export function getVulnerabilitiesTotal(
  summary: Record<PackageAuditLevel, number>,
): number {
  return Object.values(summary).reduce((acc, value) => acc + value, 0);
}
