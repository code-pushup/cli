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
export { formatCommandStatus } from './lib/command.js';
export {
  filesCoverageToTree,
  type FileCoverage,
  aggregateCoverageStats,
} from './lib/coverage-tree.js';
export { createRunnerFiles } from './lib/create-runner-files.js';
export { dateToUnixTimestamp } from './lib/dates.js';
export { comparePairs, matchArrayItemsByKey, type Diff } from './lib/diff.js';
export {
  coerceBooleanValue,
  isCI,
  isEnvVarEnabled,
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
  pluginWorkDir,
  projectToFilename,
  readJsonFile,
  readTextFile,
  removeDirectoryIfExists,
  truncatePaths,
  type CrawlFileSystemOptions,
} from './lib/file-system.js';
export { filterItemRefsBy } from './lib/filter.js';
export {
  formatBytes,
  formatCoveragePercentage,
  formatDuration,
  indentLines,
  pluginMetaLogFormatter,
  pluralize,
  pluralizeToken,
  roundDecimals,
  serializeCommandWithArgs,
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
  isRecord,
} from './lib/guards.js';
export { interpolate } from './lib/interpolate.js';
export { Logger, logger } from './lib/logger.js';
export { mergeConfigs } from './lib/merge-configs.js';
export { loadNxProjectGraph } from './lib/nx.js';
export {
  addIndex,
  expandAuditsForUrls,
  expandCategoryRefs,
  expandGroupsForUrls,
  extractGroupSlugs,
  shouldExpandForUrls,
} from './lib/plugin-url-aggregation.js';
export {
  getUrlIdentifier,
  normalizeUrlInput,
  pluginUrlContextSchema,
  type PluginUrlContext,
} from './lib/plugin-url-config.js';
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
export { formatIssueSeverities, wrapTags } from './lib/reports/formatting.js';
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
export { formatAsciiLink } from './lib/text-formats/ascii/link.js';
export { formatAsciiSticker } from './lib/text-formats/ascii/sticker.js';
export { formatAsciiTable } from './lib/text-formats/ascii/table.js';
export { formatAsciiTree } from './lib/text-formats/ascii/tree.js';
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
