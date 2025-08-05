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
  history,
  type HistoryOnlyOptions,
  type HistoryOptions,
} from './lib/history.js';
export { collect, type CollectOptions } from './lib/implementation/collect.js';
export type { ReportsToCompare } from './lib/implementation/compare-scorables.js';
export {
  executePlugin,
  executePlugins,
  PluginOutputMissingAuditError,
} from './lib/implementation/execute-plugin.js';
export {
  PersistDirError,
  PersistError,
  persistReport,
} from './lib/implementation/persist.js';
export {
  autoloadRc,
  ConfigPathError,
  readRcByPath,
} from './lib/implementation/read-rc-file.js';
export { mergeDiffs } from './lib/merge-diffs.js';
export type { GlobalOptions } from './lib/types.js';
export { upload, type UploadOptions } from './lib/upload.js';
