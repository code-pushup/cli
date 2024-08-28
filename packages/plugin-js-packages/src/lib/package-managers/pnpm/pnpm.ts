import { objectToKeys } from '@code-pushup/utils';
import type { DependencyGroup } from '../../config';
import { filterAuditResult } from '../../runner/utils';
import { COMMON_AUDIT_ARGS, COMMON_OUTDATED_ARGS } from '../constants';
import type { AuditResults, PackageManager } from '../types';
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
    postProcessResult: (results: AuditResults) => {
      const depGroups = objectToKeys(results);
      const prodFilter =
        results.optional && results.prod
          ? filterAuditResult(results.optional, 'id', results.prod)
          : results.optional;
      const devFilter =
        prodFilter && results.dev
          ? filterAuditResult(prodFilter, 'id', results.dev)
          : results.optional;

      return {
        ...(depGroups.includes('prod') && { prod: results.prod }),
        ...(depGroups.includes('dev') && { dev: results.dev }),
        ...(results.optional && { optional: devFilter }),
      };
    },
  },
  outdated: {
    commandArgs: COMMON_OUTDATED_ARGS,
    unifyResult: pnpmToOutdatedResult,
  },
};
