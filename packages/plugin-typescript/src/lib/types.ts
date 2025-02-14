import type { DiagnosticsOptions } from './runner/ts-runner.js';
import type { CodeRangeName } from './runner/types.js';

export type AuditSlug = CodeRangeName;

export type FilterOptions = { onlyAudits?: AuditSlug[] | undefined };
export type TypescriptPluginOptions = Partial<DiagnosticsOptions> &
  FilterOptions;
