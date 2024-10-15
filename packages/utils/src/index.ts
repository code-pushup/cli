export { exists } from '@code-pushup/models';
export { comparePairs, matchArrayItemsByKey, type Diff } from './lib/diff';
export { stringifyError } from './lib/errors';
export {
  ProcessError,
  executeProcess,
  type ProcessConfig,
  type ProcessObserver,
  type ProcessResult,
} from './lib/execute-process';
export {
  crawlFileSystem,
  directoryExists,
  ensureDirectoryExists,
  fileExists,
  filePathToCliArg,
  findLineNumberInText,
  importModule,
  logMultipleFileResults,
  pluginWorkDir,
  projectToFilename,
  readJsonFile,
  readTextFile,
  removeDirectoryIfExists,
  type CrawlFileSystemOptions,
  type FileResult,
  type MultipleFileResults,
} from './lib/file-system';
export { filterItemRefsBy } from './lib/filter';
export {
  formatBytes,
  formatDuration,
  pluralize,
  pluralizeToken,
  slugify,
  truncateDescription,
  truncateIssueMessage,
  truncateText,
  truncateTitle,
} from './lib/formatting';
export {
  formatGitPath,
  getGitRoot,
  guardAgainstLocalChanges,
  safeCheckout,
  toGitPath,
} from './lib/git/git';
export {
  getCurrentBranchOrTag,
  getHashFromTag,
  getHashes,
  getLatestCommit,
  getSemverTags,
  type LogResult,
} from './lib/git/git.commits-and-tags';
export { groupByStatus } from './lib/group-by-status';
export {
  isPromiseFulfilledResult,
  isPromiseRejectedResult,
} from './lib/guards';
export { logMultipleResults } from './lib/log-results';
export { link, ui, type CliUi, type Column } from './lib/logging';
export { mergeConfigs } from './lib/merge-configs';
export { getProgressBar, type ProgressBar } from './lib/progress';
export {
  CODE_PUSHUP_DOMAIN,
  CODE_PUSHUP_UNICODE_LOGO,
  FOOTER_PREFIX,
  README_LINK,
  TERMINAL_WIDTH,
} from './lib/reports/constants';
export {
  listAuditsFromAllPlugins,
  listGroupsFromAllPlugins,
} from './lib/reports/flatten-plugins';
export { generateMdReport } from './lib/reports/generate-md-report';
export {
  generateMdReportsDiff,
  generateMdReportsDiffForMonorepo,
} from './lib/reports/generate-md-reports-diff';
export { loadReport } from './lib/reports/load-report';
export { logStdoutSummary } from './lib/reports/log-stdout-summary';
export { scoreReport } from './lib/reports/scoring';
export { sortReport } from './lib/reports/sorting';
export type {
  ScoredCategoryConfig,
  ScoredGroup,
  ScoredReport,
} from './lib/reports/types';
export {
  calcDuration,
  compareIssueSeverity,
  formatReportScore,
} from './lib/reports/utils';
export { isSemver, normalizeSemver, sortSemvers } from './lib/semver';
export * from './lib/text-formats';
export {
  capitalize,
  countOccurrences,
  distinct,
  factorOf,
  fromJsonLines,
  objectFromEntries,
  objectToCliArgs,
  objectToEntries,
  objectToKeys,
  toArray,
  toJsonLines,
  toNumberPrecision,
  toOrdinal,
  toUnixNewlines,
  toUnixPath,
  type CliArgsObject,
} from './lib/transform';
export type {
  ExcludeNullFromPropertyTypes,
  ExtractArray,
  ExtractArrays,
  ItemOrArray,
  Prettify,
  WithRequired,
} from './lib/types';
export { verboseUtils } from './lib/verbose-utils';
