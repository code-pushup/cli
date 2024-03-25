import {
  DependencyGroup,
  PackageAuditLevel,
  PackageManager,
} from '../../config';
import { dependencyGroupToLong } from '../../constants';
import { AuditResult } from './types';
import { npmToAuditResult, yarnv1ToAuditResult } from './unify-type';

/* eslint-disable no-magic-numbers */
export const auditScoreModifiers: Record<PackageAuditLevel, number> = {
  critical: 1,
  high: 0.1,
  moderate: 0.05,
  low: 0.02,
  info: 0.01,
};
/* eslint-enable no-magic-numbers */

/* eslint-disable @typescript-eslint/consistent-type-assertions */
export const normalizeAuditMapper: Record<
  PackageManager,
  (_: string) => AuditResult
> = {
  npm: npmToAuditResult,
  'yarn-classic': yarnv1ToAuditResult,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'yarn-modern': _ => ({} as AuditResult),
  pnpm: _ => ({} as AuditResult),
};
/* eslint-enable @typescript-eslint/consistent-type-assertions */

const npmDependencyOptions: Record<DependencyGroup, string[]> = {
  prod: ['--omit=dev', '--omit=optional'],
  dev: ['--include=dev', '--omit=optional'],
  optional: ['--include=optional', '--omit=dev'],
};

export const auditArgs = (
  groupDep: DependencyGroup,
): Record<PackageManager, string[]> => ({
  npm: [...npmDependencyOptions[groupDep], '--json', '--audit-level=none'],
  'yarn-classic': ['--json', `--groups ${dependencyGroupToLong[groupDep]}`],
  'yarn-modern': [],
  pnpm: [],
});
