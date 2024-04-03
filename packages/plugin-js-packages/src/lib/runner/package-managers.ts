import { MaterialIcon } from '@code-pushup/models';
import { DependencyGroup, PackageManager } from '../config';
import { dependencyGroupToLong } from '../constants';
import { AuditResult } from './audit/types';
import {
  npmToAuditResult,
  pnpmToAuditResult,
  yarnv1ToAuditResult,
  yarnv2ToAuditResult,
} from './audit/unify-type';
import { OutdatedResult } from './outdated/types';
import {
  npmToOutdatedResult,
  pnpmToOutdatedResult,
  yarnv1ToOutdatedResult,
  yarnv2ToOutdatedResult,
} from './outdated/unify-type';
import { filterAuditResult } from './utils';

type PackageManagerAdapter = {
  slug: PackageManager;
  name: string;
  command: string;
  icon: MaterialIcon;
  docs: {
    homepage: string;
    audit: string;
    outdated: string;
  };
  audit: {
    getCommandArgs: (groupDep: DependencyGroup) => string[];
    ignoreExitCode?: boolean; // non-zero exit code will throw by default
    supportedDepGroups?: DependencyGroup[]; // all are supported by default
    unifyResult: (output: string) => AuditResult;
    postProcessResult?: (
      result: Record<DependencyGroup, AuditResult>,
    ) => Record<DependencyGroup, AuditResult>;
  };
  outdated: {
    commandArgs: string[];
    unifyResult: (output: string) => OutdatedResult;
  };
};

const COMMON_AUDIT_ARGS = ['audit', '--json'];
const COMMON_OUTDATED_ARGS = ['outdated', '--json'];

const npmDependencyOptions: Record<DependencyGroup, string[]> = {
  prod: ['--omit=dev', '--omit=optional'],
  dev: ['--include=dev', '--omit=optional'],
  optional: ['--include=optional', '--omit=dev'],
};

export const npmAdapter: PackageManagerAdapter = {
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

export const yarnv1Adapter: PackageManagerAdapter = {
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

// Yarn v2 does not currently audit optional dependencies
// see https://github.com/yarnpkg/berry/blob/master/packages/plugin-npm-cli/sources/npmAuditTypes.ts#L5
const yarnv2EnvironmentOptions: Record<DependencyGroup, string> = {
  prod: 'production',
  dev: 'development',
  optional: '',
};

export const yarnv2Adapter: PackageManagerAdapter = {
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
  },
  outdated: {
    commandArgs: COMMON_OUTDATED_ARGS,
    unifyResult: yarnv2ToOutdatedResult,
  },
};

const pnpmDependencyOptions: Record<DependencyGroup, string[]> = {
  prod: ['--prod', '--no-optional'],
  dev: ['--dev', '--no-optional'],
  optional: [],
};

export const pnpmAdapter: PackageManagerAdapter = {
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

export const adapters: Record<PackageManager, PackageManagerAdapter> = {
  npm: npmAdapter,
  'yarn-classic': yarnv1Adapter,
  'yarn-modern': yarnv2Adapter,
  pnpm: pnpmAdapter,
};
