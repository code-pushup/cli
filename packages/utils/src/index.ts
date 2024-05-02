import * as html from './lib/reports/html';

export { ExcludeNullFromPropertyTypes } from './lib/types';
export { exists } from '@code-pushup/models';
export { Diff, comparePairs, matchArrayItemsByKey } from './lib/diff';
export {
  ProcessConfig,
  ProcessError,
  ProcessObserver,
  ProcessResult,
  executeProcess,
} from './lib/execute-process';
export {
  CrawlFileSystemOptions,
  FileResult,
  MultipleFileResults,
  crawlFileSystem,
  directoryExists,
  ensureDirectoryExists,
  fileExists,
  findLineNumberInText,
  importEsmModule,
  logMultipleFileResults,
  pluginWorkDir,
  readJsonFile,
  readTextFile,
  removeDirectoryIfExists,
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
  guardAgainstLocalChanges,
  getGitRoot,
  safeCheckout,
  toGitPath,
} from './lib/git/git';
export {
  getSemverTags,
  LogResult,
  getHashes,
  getHashFromTag,
  getCurrentBranchOrTag,
  getLatestCommit,
} from './lib/git/git.commits-and-tags';
export { groupByStatus } from './lib/group-by-status';
export {
  isPromiseFulfilledResult,
  isPromiseRejectedResult,
} from './lib/guards';
export { logMultipleResults } from './lib/log-results';
export { CliUi, Column, link, ui } from './lib/logging';
export { ProgressBar, getProgressBar } from './lib/progress';
export {
  CODE_PUSHUP_DOMAIN,
  FOOTER_PREFIX,
  README_LINK,
  TERMINAL_WIDTH,
} from './lib/reports/constants';
export {
  listAuditsFromAllPlugins,
  listGroupsFromAllPlugins,
} from './lib/reports/flatten-plugins';
export { generateMdReport } from './lib/reports/generate-md-report';
export { generateMdReportsDiff } from './lib/reports/generate-md-reports-diff';
export { logStdoutSummary } from './lib/reports/log-stdout-summary';
export { scoreReport } from './lib/reports/scoring';
export { sortReport } from './lib/reports/sorting';
export {
  ScoredCategoryConfig,
  ScoredGroup,
  ScoredReport,
} from './lib/reports/types';
export {
  calcDuration,
  compareIssueSeverity,
  loadReport,
} from './lib/reports/utils';

export const htmlFormat = { ...html };
export * as markdown from './lib/reports/md';
export {
  CliArgsObject,
  apostrophize,
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
  normalizeTable,
} from './lib/transform';
export { verboseUtils } from './lib/verbose-utils';
export { isSemver, normalizeSemver, sortSemvers } from './lib/semver';
