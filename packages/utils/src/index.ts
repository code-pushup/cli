export { exists } from '@code-pushup/models';
export {
  camelCaseToKebabCase,
  capitalize,
  kebabCaseToCamelCase,
  lowercase,
  toSentenceCase,
  toTitleCase,
  uppercase,
} from './lib/case-conversions.js';
export { filesCoverageToTree, type FileCoverage } from './lib/coverage-tree.js';
export { createRunnerFiles } from './lib/create-runner-files.js';
export { dateToUnixTimestamp } from './lib/dates.js';
export { comparePairs, matchArrayItemsByKey, type Diff } from './lib/diff.js';
export {
  coerceBooleanValue,
  isCI,
  isEnvVarEnabled,
  isVerbose,
  runnerArgsFromEnv,
  runnerArgsToEnv,
} from './lib/env.js';
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
  createReportPath,
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
  indentLines,
  pluralize,
  pluralizeToken,
  roundDecimals,
  slugify,
  transformLines,
  truncateDescription,
  truncateIssueMessage,
  truncateMultilineText,
  truncateText,
  truncateTitle,
  UNICODE_ELLIPSIS,
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
export { interpolate } from './lib/interpolate.js';
export { logMultipleResults } from './lib/log-results.js';
export { Logger, logger } from './lib/logger.js';
export { link, ui, type CliUi } from './lib/logging.js';
export { mergeConfigs } from './lib/merge-configs.js';
export {
  addIndex,
  ContextValidationError,
  createCategoryRefs,
  expandAuditsForUrls,
  expandCategoryRefs,
  expandGroupsForUrls,
  removeIndex,
  shouldExpandForUrls,
  validateUrlContext,
} from './lib/plugin-url-aggregation.js';
export {
  getUrlIdentifier,
  normalizeUrlInput,
  type PluginUrlContext,
} from './lib/plugin-url-config.js';
export { getProgressBar, type ProgressBar } from './lib/progress.js';
export {
  asyncSequential,
  groupByStatus,
  settlePromise,
} from './lib/promises.js';
export { generateRandomId } from './lib/random.js';
export {
  CODE_PUSHUP_DOMAIN,
  CODE_PUSHUP_UNICODE_LOGO,
  FOOTER_PREFIX,
  README_LINK,
} from './lib/reports/constants.js';
export {
  listAuditsFromAllPlugins,
  listGroupsFromAllPlugins,
} from './lib/reports/flatten-plugins.js';
export { formatIssueSeverities } from './lib/reports/formatting.js';
export { generateMdReport } from './lib/reports/generate-md-report.js';
export {
  generateMdReportsDiff,
  generateMdReportsDiffForMonorepo,
} from './lib/reports/generate-md-reports-diff.js';
export { loadReport } from './lib/reports/load-report.js';
export { logStdoutSummary } from './lib/reports/log-stdout-summary.js';
export { scoreAuditsWithTarget, scoreReport } from './lib/reports/scoring.js';
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
  LooseAutocomplete,
  Prettify,
  WithRequired,
} from './lib/types.js';
