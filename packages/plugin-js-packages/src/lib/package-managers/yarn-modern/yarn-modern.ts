// Yarn v2 does not currently audit optional dependencies
import type { DependencyGroup } from '../../config.js';
import { COMMON_AUDIT_ARGS, COMMON_OUTDATED_ARGS } from '../constants.js';
import type { PackageManager } from '../types.js';
import { yarnv2ToAuditResult } from './audit-result.js';
import { yarnv2ToOutdatedResult } from './outdated-result.js';

// see https://github.com/yarnpkg/berry/blob/master/packages/plugin-npm-cli/sources/npmAuditTypes.ts#L5
const yarnv2EnvironmentOptions: Record<DependencyGroup, string> = {
  prod: 'production',
  dev: 'development',
  optional: '',
};

export const yarnv2PackageManager: PackageManager = {
  slug: 'yarn-modern',
  name: 'yarn-modern',
  command: 'yarn',
  icon: 'yarn',
  docs: {
    homepage: 'https://yarnpkg.com/getting-started',
    audit: 'https://yarnpkg.com/cli/npm/audit',
    outdated: 'https://github.com/mskelton/yarn-plugin-outdated',
  },
  audit: {
    getCommandArgs: groupDep => [
      'npm',
      ...COMMON_AUDIT_ARGS,
      '--environment',
      yarnv2EnvironmentOptions[groupDep],
    ],
    supportedDepGroups: ['prod', 'dev'], // Yarn v2 does not support audit for optional dependencies
    unifyResult: yarnv2ToAuditResult,
    ignoreExitCode: true,
  },
  outdated: {
    commandArgs: COMMON_OUTDATED_ARGS,
    unifyResult: yarnv2ToOutdatedResult,
  },
};
