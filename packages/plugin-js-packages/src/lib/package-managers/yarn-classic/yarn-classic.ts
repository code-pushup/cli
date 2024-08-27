import { dependencyGroupToLong } from '../../constants';
import { COMMON_AUDIT_ARGS, COMMON_OUTDATED_ARGS } from '../constants';
import type { PackageManager } from '../types';
import { yarnv1ToAuditResult } from './audit-result';
import { yarnv1ToOutdatedResult } from './outdated-result';

export const yarnv1PackageManager: PackageManager = {
  slug: 'yarn-classic',
  name: 'Yarn v1',
  command: 'yarn',
  icon: 'yarn',
  docs: {
    homepage: 'https://classic.yarnpkg.com/docs/',
    audit: 'https://classic.yarnpkg.com/docs/cli/audit',
    outdated: 'https://classic.yarnpkg.com/docs/cli/outdated/',
  },
  audit: {
    getCommandArgs: groupDep => [
      ...COMMON_AUDIT_ARGS,
      '--groups',
      dependencyGroupToLong[groupDep],
    ],
    ignoreExitCode: true,
    unifyResult: yarnv1ToAuditResult,
  },
  outdated: {
    commandArgs: COMMON_OUTDATED_ARGS,
    unifyResult: yarnv1ToOutdatedResult,
  },
};
