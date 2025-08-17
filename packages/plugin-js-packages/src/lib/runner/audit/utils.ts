import { objectFromEntries } from '@code-pushup/utils';
import { type PackageAuditLevel, packageAuditLevels } from '../../config.js';
import type { AuditSummary } from './types.js';

export function getVulnerabilitiesTotal(
  summary: Record<PackageAuditLevel, number>,
): number {
  return Object.values(summary).reduce((acc, value) => acc + value, 0);
}

export function summaryStatsFromVulnerabilities(
  vulnerabilities: { severity: PackageAuditLevel }[],
): AuditSummary {
  const initial: AuditSummary = objectFromEntries(
    ([...packageAuditLevels, 'total'] as const).map(key => [key, 0]),
  );
  return vulnerabilities.reduce(
    (acc, { severity }) => ({
      ...acc,
      [severity]: acc[severity] + 1,
      total: acc.total + 1,
    }),
    initial,
  );
}
