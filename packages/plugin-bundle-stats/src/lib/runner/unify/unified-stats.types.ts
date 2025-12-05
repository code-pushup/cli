export type SupportedImportKind = 'static' | 'dynamic';

export type UnifiedStatsImport = {
  path: string;
  kind: string;
  /**
   * The "original" property contains the exact import statement as it was written in the source code,
   * while "path" contains the resolved absolute file path after webpack processing.
   */
  original?: string;
};

export type UnifiedStatsInput = {
  bytes: number;
  imports?: UnifiedStatsImport[];
  format?: string;
};

export type UnifiedStatsBundle = {
  path: string;
  bytes: number;
  inputs?: Record<string, UnifiedStatsInput>;
  entryPoint?: string;
  imports?: UnifiedStatsImport[];
};

export type UnifiedStats = Record<string, UnifiedStatsBundle>;
