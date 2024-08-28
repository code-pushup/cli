export {
  type CollectAndPersistReportsOptions,
  collectAndPersistReports,
} from './lib/collect-and-persist';
export { compareReportFiles, compareReports } from './lib/compare';
export { type CollectOptions, collect } from './lib/implementation/collect';
export type { ReportsToCompare } from './lib/implementation/compare-scorables';
export {
  PluginOutputMissingAuditError,
  executePlugin,
  executePlugins,
} from './lib/implementation/execute-plugin';
export {
  PersistDirError,
  PersistError,
  persistReport,
} from './lib/implementation/persist';
export {
  history,
  type HistoryOptions,
  type HistoryOnlyOptions,
} from './lib/history';
export {
  ConfigPathError,
  autoloadRc,
  readRcByPath,
} from './lib/implementation/read-rc-file';
export type { GlobalOptions } from './lib/types';
export { type UploadOptions, upload } from './lib/upload';
export { mergeDiffs } from './lib/merge-diffs';
