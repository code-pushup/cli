export { exists } from '@code-pushup/models';
export {
  camelCaseToKebabCase,
  capitalize,
  kebabCaseToCamelCase,
  toSentenceCase,
  toTitleCase,
} from './lib/case-conversions.js';
export { filesCoverageToTree, type FileCoverage } from './lib/coverage-tree.js';
export { createRunnerFiles } from './lib/create-runner-files.js';
export { comparePairs, matchArrayItemsByKey, type Diff } from './lib/diff.js';
export { stringifyError } from './lib/errors.js';
export {
  executeProcess,
  ProcessError,
  type ProcessConfig,
  type ProcessObserver,
  type ProcessResult,
} from './lib/execute-process.js';
export {
  crawlFileSystem,
  directoryExists,
  ensureDirectoryExists,
  fileExists,
  filePathToCliArg,
  findLineNumberInText,
  findNearestFile,
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
} from './lib/file-system.js';
export { filterItemRefsBy } from './lib/filter.js';
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
} from './lib/formatting.js';
export {
  getCurrentBranchOrTag,
  getHashes,
  getHashFromTag,
  getLatestCommit,
  getSemverTags,
  type LogResult,
} from './lib/git/git.commits-and-tags.js';
export {
  formatGitPath,
  getGitRoot,
  guardAgainstLocalChanges,
  safeCheckout,
  toGitPath,
} from './lib/git/git.js';
export {
  hasNoNullableProps,
  isPromiseFulfilledResult,
  isPromiseRejectedResult,
} from './lib/guards.js';
export { logMultipleResults } from './lib/log-results.js';
export { isVerbose, link, ui, type CliUi, type Column } from './lib/logging.js';
export { mergeConfigs } from './lib/merge-configs.js';
export { getProgressBar, type ProgressBar } from './lib/progress.js';
export { asyncSequential, groupByStatus } from './lib/promises.js';
export { generateRandomId } from './lib/random.js';
export {
  CODE_PUSHUP_DOMAIN,
  CODE_PUSHUP_UNICODE_LOGO,
  FOOTER_PREFIX,
  README_LINK,
  TERMINAL_WIDTH,
} from './lib/reports/constants.js';
export {
  listAuditsFromAllPlugins,
  listGroupsFromAllPlugins,
} from './lib/reports/flatten-plugins.js';
export { generateMdReport } from './lib/reports/generate-md-report.js';
export {
  generateMdReportsDiff,
  generateMdReportsDiffForMonorepo,
} from './lib/reports/generate-md-reports-diff.js';
export { loadReport } from './lib/reports/load-report.js';
export { logStdoutSummary } from './lib/reports/log-stdout-summary.js';
export { scoreReport } from './lib/reports/scoring.js';
export { sortReport } from './lib/reports/sorting.js';
export type {
  ScoredCategoryConfig,
  ScoredGroup,
  ScoredReport,
} from './lib/reports/types.js';
export {
  calcDuration,
  compareIssueSeverity,
  formatReportScore,
} from './lib/reports/utils.js';
export { isSemver, normalizeSemver, sortSemvers } from './lib/semver.js';
export * from './lib/text-formats/index.js';
export {
  countOccurrences,
  distinct,
  factorOf,
  fromJsonLines,
  objectFromEntries,
  objectToCliArgs,
  objectToEntries,
  objectToKeys,
  removeUndefinedAndEmptyProps,
  toArray,
  toJsonLines,
  toNumberPrecision,
  toOrdinal,
  toUnixNewlines,
  toUnixPath,
  type CliArgsObject,
} from './lib/transform.js';
export type {
  CamelCaseToKebabCase,
  ExcludeNullableProps,
  ExtractArray,
  ExtractArrays,
  ItemOrArray,
  Prettify,
  WithRequired,
} from './lib/types.js';
export { parseSchema, SchemaValidationError } from './lib/zod-validation.js';
