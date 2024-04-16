import { DependencyGroup } from '../../config';
import { AuditResult } from '../../runner/audit/types';
import { filterAuditResult } from '../../runner/utils';
import { COMMON_AUDIT_ARGS, COMMON_OUTDATED_ARGS } from '../constants';
import { PackageManager } from '../types';
import { npmToAuditResult } from './audit-result';
import { npmToOutdatedResult } from './outdated-result';

const npmDependencyOptions: Record<DependencyGroup, string[]> = {
  prod: ['--omit=dev', '--omit=optional'],
  dev: ['--include=dev', '--omit=optional'],
  optional: ['--include=optional', '--omit=dev'],
};

export const npmPackageManager: PackageManager = {
  slug: 'npm',
  name: 'NPM',
  command: 'npm',
  icon: 'npm',
  docs: {
    homepage: 'https://docs.npmjs.com/',
    audit: 'https://docs.npmjs.com/cli/commands/npm-audit',
    outdated: 'https://docs.npmjs.com/cli/commands/npm-outdated',
  },
  audit: {
    getCommandArgs: groupDep => [
      ...COMMON_AUDIT_ARGS,
      ...npmDependencyOptions[groupDep],
      '--audit-level=none',
    ],
    unifyResult: npmToAuditResult,
    // prod dependencies need to be filtered out manually since v10
    postProcessResult: (results: Record<DependencyGroup, AuditResult>) => ({
      prod: results.prod,
      dev: filterAuditResult(results.dev, 'name', results.prod),
      optional: filterAuditResult(results.optional, 'name', results.prod),
    }),
  },
  outdated: {
    commandArgs: [...COMMON_OUTDATED_ARGS, '--long'],
    unifyResult: npmToOutdatedResult,
  },
};
