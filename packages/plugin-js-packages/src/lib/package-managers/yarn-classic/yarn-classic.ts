import { dependencyGroupToLong } from '../../constants.js';
import { COMMON_AUDIT_ARGS, COMMON_OUTDATED_ARGS } from '../constants.js';
import type { PackageManager } from '../types.js';
import { yarnv1ToAuditResult } from './audit-result.js';
import { yarnv1ToOutdatedResult } from './outdated-result.js';

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
