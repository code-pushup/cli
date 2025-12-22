export {
  collectAndPersistReports,
  type CollectAndPersistReportsOptions,
} from './lib/collect-and-persist.js';
export {
  compareReportFiles,
  compareReports,
  type CompareOptions,
} from './lib/compare.js';
export {
  getRunnerOutputsPath,
  type RunnerResult,
} from './lib/implementation/runner.js';

export {
  history,
  type HistoryOnlyOptions,
  type HistoryOptions,
} from './lib/history.js';
export { collect, type CollectOptions } from './lib/implementation/collect.js';
export type { ReportsToCompare } from './lib/implementation/compare-scorables.js';
export {
  executePlugin,
  executePlugins,
} from './lib/implementation/execute-plugin.js';
export { persistReport } from './lib/implementation/persist.js';
export { autoloadRc, readRcByPath } from './lib/implementation/read-rc-file.js';
export { AuditOutputsMissingAuditError } from './lib/implementation/runner.js';
export { mergeDiffs } from './lib/merge-diffs.js';
export { upload, type UploadOptions } from './lib/upload.js';
