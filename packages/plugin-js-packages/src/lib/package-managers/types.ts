import type { MaterialIcon } from '@code-pushup/models';
import type { DependencyGroup, PackageManagerId } from '../config';
import type { AuditResult } from '../runner/audit/types';
import type { OutdatedResult } from '../runner/outdated/types';

export type AuditResults = Partial<Record<DependencyGroup, AuditResult>>;

export type PackageManager = {
  slug: PackageManagerId;
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
    postProcessResult?: (result: AuditResults) => AuditResults;
  };
  outdated: {
    commandArgs: string[];
    unifyResult: (output: string) => OutdatedResult;
  };
};
