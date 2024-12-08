export {
  type CollectAndPersistReportsOptions,
  collectAndPersistReports,
} from './lib/collect-and-persist.js';
export { compareReportFiles, compareReports } from './lib/compare.js';
export { type CollectOptions, collect } from './lib/implementation/collect.js';
export type { ReportsToCompare } from './lib/implementation/compare-scorables.js';
export {
  PluginOutputMissingAuditError,
  executePlugin,
  executePlugins,
} from './lib/implementation/execute-plugin.js';
export {
  PersistDirError,
  PersistError,
  persistReport,
} from './lib/implementation/persist.js';
export {
  history,
  type HistoryOptions,
  type HistoryOnlyOptions,
} from './lib/history.js';
export {
  ConfigPathError,
  autoloadRc,
  readRcByPath,
} from './lib/implementation/read-rc-file.js';
export type { GlobalOptions } from './lib/types.js';
export { type UploadOptions, upload } from './lib/upload.js';
export { mergeDiffs } from './lib/merge-diffs.js';
