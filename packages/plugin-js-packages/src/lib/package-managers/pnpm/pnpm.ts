import { DependencyGroup } from '../../config';
import { AuditResult } from '../../runner/audit/types';
import { filterAuditResult } from '../../runner/utils';
import { COMMON_AUDIT_ARGS, COMMON_OUTDATED_ARGS } from '../constants';
import { PackageManager } from '../types';
import { pnpmToAuditResult } from './audit-result';
import { pnpmToOutdatedResult } from './outdated-result';

const pnpmDependencyOptions: Record<DependencyGroup, string[]> = {
  prod: ['--prod', '--no-optional'],
  dev: ['--dev', '--no-optional'],
  optional: [],
};

export const pnpmPackageManager: PackageManager = {
  slug: 'pnpm',
  name: 'pnpm',
  command: 'pnpm',
  icon: 'pnpm',
  docs: {
    homepage: 'https://pnpm.io/pnpm-cli',
    audit: 'https://pnpm.io/cli/audit/',
    outdated: 'https://pnpm.io/cli/outdated',
  },
  audit: {
    getCommandArgs: groupDep => [
      ...COMMON_AUDIT_ARGS,
      ...pnpmDependencyOptions[groupDep],
    ],
    ignoreExitCode: true,
    unifyResult: pnpmToAuditResult,
    // optional dependencies don't have an exclusive option so they need duplicates filtered out
    postProcessResult: (results: Record<DependencyGroup, AuditResult>) => ({
      prod: results.prod,
      dev: results.dev,
      optional: filterAuditResult(
        filterAuditResult(results.optional, 'id', results.prod),
        'id',
        results.dev,
      ),
    }),
  },
  outdated: {
    commandArgs: COMMON_OUTDATED_ARGS,
    unifyResult: pnpmToOutdatedResult,
  },
};
