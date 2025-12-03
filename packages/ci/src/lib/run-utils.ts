/* eslint-disable max-lines */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { SimpleGit } from 'simple-git';
import {
  DEFAULT_PERSIST_FILENAME,
  DEFAULT_PERSIST_FORMAT,
  DEFAULT_PERSIST_OUTPUT_DIR,
  type Report,
  type ReportsDiff,
} from '@code-pushup/models';
import {
  type Diff,
  createReportPath,
  interpolate,
  objectFromEntries,
  readJsonFile,
  removeUndefinedAndEmptyProps,
  stringifyError,
} from '@code-pushup/utils';
import {
  type CommandContext,
  type EnhancedPersistConfig,
  createCommandContext,
  parsePersistConfig,
  persistedFilesFromConfig,
  runCollect,
  runCompare,
  runPrintConfig,
} from './cli/index.js';
import { listChangedFiles, normalizeGitRef } from './git.js';
import { type SourceFileIssue, filterRelevantIssues } from './issues.js';
import { logDebug, logInfo, logWarning } from './log.js';
import type {
  ConfigPatterns,
  GitBranch,
  GitRefs,
  Options,
  ProjectRunResult,
  ProviderAPIClient,
  Settings,
} from './models.js';
import type { ProjectConfig } from './monorepo/index.js';
import { saveOutputFiles } from './output-files.js';
import { downloadFromPortal } from './portal/download.js';
import {
  DEFAULT_SETTINGS,
  MAX_SEARCH_COMMITS,
  MIN_SEARCH_COMMITS,
} from './settings.js';

export type RunEnv = {
  refs: NormalizedGitRefs;
  api: ProviderAPIClient;
  settings: Settings;
  git: SimpleGit;
};

type NormalizedGitRefs = {
  head: GitBranch;
  base?: GitBranch;
};

export type CompareReportsArgs = {
  project: ProjectConfig | null;
  env: RunEnv;
  ctx: CommandContext;
  base: GitBranch;
  currReport: ReportData<'current'>;
  prevReport: ReportData<'previous'>;
  config: EnhancedPersistConfig;
};

export type BaseReportArgs = {
  project: ProjectConfig | null;
  config: EnhancedPersistConfig;
  env: RunEnv;
  base: GitBranch;
  ctx: CommandContext;
};

export type ReportData<T extends 'current' | 'previous'> = {
  content: string;
  files: Required<ProjectRunResult['files']>[T];
};

export async function createRunEnv(
  refs: GitRefs,
  api: ProviderAPIClient,
  options: Options | undefined,
  git: SimpleGit,
): Promise<RunEnv> {
  const [head, base] = await Promise.all([
    normalizeGitRef(refs.head, git),
    refs.base && normalizeGitRef(refs.base, git),
  ]);

  return {
    refs: { head, ...(base && { base }) },
    api,
    settings: {
      ...DEFAULT_SETTINGS,
      ...(options && sanitizeOptions(options)),
    },
    git,
  };
}

function sanitizeOptions(options: Options): Options {
  return removeUndefinedAndEmptyProps({
    ...options,
    searchCommits: sanitizeSearchCommits(options.searchCommits),
  });
}

function sanitizeSearchCommits(
  searchCommits: Options['searchCommits'],
): Options['searchCommits'] {
  if (
    typeof searchCommits === 'number' &&
    (!Number.isInteger(searchCommits) ||
      searchCommits < MIN_SEARCH_COMMITS ||
      searchCommits > MAX_SEARCH_COMMITS)
  ) {
    logWarning(
      `The searchCommits option must be a boolean or an integer in range ${MIN_SEARCH_COMMITS} to ${MAX_SEARCH_COMMITS}, ignoring invalid value ${searchCommits}.`,
    );
    return undefined;
  }

  return searchCommits;
}

export async function runOnProject(
  project: ProjectConfig | null,
  env: RunEnv,
): Promise<ProjectRunResult> {
  const {
    refs: { head, base },
    settings,
  } = env;

  const ctx = createCommandContext(settings, project);

  if (project) {
    logInfo(`Running Code PushUp on monorepo project ${project.name}`);
  }

  const config = settings.configPatterns
    ? configFromPatterns(settings.configPatterns, project)
    : await printPersistConfig(ctx);
  logDebug(
    settings.configPatterns
      ? `Parsed persist and upload configs from configPatterns option - ${JSON.stringify(config)}`
      : `Loaded persist and upload configs from print-config command - ${JSON.stringify(config)}`,
  );

  await runCollect(ctx, { hasFormats: hasDefaultPersistFormats(config) });
  const currReport = await saveReportFiles({
    project,
    type: 'current',
    files: persistedFilesFromConfig(config, ctx),
    settings,
  });
  logDebug(`Collected current report at ${currReport.files.json}`);

  const noDiffOutput = {
    name: projectToName(project),
    files: { current: currReport.files },
  } satisfies ProjectRunResult;

  if (base == null) {
    return noDiffOutput;
  }

  logInfo(
    `PR/MR detected, preparing to compare base branch ${base.ref} to head ${head.ref}`,
  );

  const baseArgs: BaseReportArgs = { project, env, base, config, ctx };
  const prevReport = await collectPreviousReport(baseArgs);
  if (!prevReport) {
    return noDiffOutput;
  }

  const compareArgs = { ...baseArgs, currReport, prevReport };
  return compareReports(compareArgs);
}

export async function compareReports(
  args: CompareReportsArgs,
): Promise<ProjectRunResult> {
  const { ctx, env, config } = args;
  const { settings } = env;

  await prepareReportFilesToCompare(args);
  await runCompare(ctx, { hasFormats: hasDefaultPersistFormats(config) });

  logInfo('Compared reports and generated diff files');

  const newIssues = settings.detectNewIssues
    ? await findNewIssues(args)
    : undefined;

  return saveDiffFiles(args, newIssues);
}

export async function prepareReportFilesToCompare(
  args: CompareReportsArgs,
): Promise<Diff<string>> {
  const { config, project, ctx } = args;
  const {
    outputDir = DEFAULT_PERSIST_OUTPUT_DIR,
    filename = DEFAULT_PERSIST_FILENAME,
  } = config.persist ?? {};
  const label = project?.name;

  const originalReports = await Promise.all(
    [args.currReport, args.prevReport].map(({ files }) =>
      readJsonFile<Report>(files.json),
    ),
  );
  const labeledReports = label
    ? originalReports.map(report => ({ ...report, label }))
    : originalReports;

  const reportPaths = labeledReports.map((report, idx) => {
    const key: keyof Diff<string> = idx === 0 ? 'after' : 'before';
    const filePath = createReportPath({
      outputDir: path.resolve(ctx.directory, outputDir),
      filename,
      format: 'json',
      suffix: key,
    });
    return { key, report, filePath };
  });

  await Promise.all(
    reportPaths.map(({ filePath, report }) =>
      writeFile(filePath, JSON.stringify(report, null, 2)),
    ),
  );

  logDebug(
    [
      'Prepared',
      project && `"${project.name}" project's`,
      'report files for comparison',
      `at ${reportPaths.map(({ filePath }) => filePath).join(' and ')}`,
    ]
      .filter(Boolean)
      .join(' '),
  );

  return objectFromEntries(
    reportPaths.map(({ key, filePath }) => [key, filePath]),
  );
}

export async function saveDiffFiles(
  args: CompareReportsArgs,
  newIssues: SourceFileIssue[] | undefined,
) {
  const {
    project,
    ctx,
    env: { settings },
    currReport,
    prevReport,
    config,
  } = args;

  const diffFiles = persistedFilesFromConfig(config, {
    directory: ctx.directory,
    isDiff: true,
  });

  return {
    name: projectToName(project),
    files: {
      current: currReport.files,
      previous: prevReport.files,
      comparison: await saveOutputFiles({
        project,
        type: 'comparison',
        files: diffFiles,
        settings,
      }),
    },
    ...(newIssues && { newIssues }),
  } satisfies ProjectRunResult;
}

export async function saveReportFiles<T extends 'current' | 'previous'>(args: {
  project: Pick<ProjectConfig, 'name'> | null;
  type: T;
  files: ReportData<T>['files'];
  settings: Settings;
}): Promise<ReportData<T>> {
  const [content, files] = await Promise.all([
    readFile(args.files.json, 'utf8'),
    saveOutputFiles(args),
  ]);
  return { content, files };
}

export async function collectPreviousReport(
  args: BaseReportArgs,
): Promise<ReportData<'previous'> | null> {
  const { ctx, env, base, project } = args;
  const { settings } = env;
  const { configPatterns } = settings;

  const cachedBaseReport = await loadCachedBaseReport(args);
  if (cachedBaseReport) {
    return cachedBaseReport;
  }

  return runInBaseBranch(base, env, async () => {
    const config = configPatterns
      ? configFromPatterns(configPatterns, project)
      : await checkPrintConfig(args);
    if (!config) {
      return null;
    }

    await runCollect(ctx, { hasFormats: hasDefaultPersistFormats(config) });
    const report = await saveReportFiles({
      project,
      type: 'previous',
      files: persistedFilesFromConfig(config, ctx),
      settings,
    });
    logDebug(`Collected previous report at ${report.files.json}`);
    return report;
  });
}

export async function loadCachedBaseReport(
  args: BaseReportArgs,
): Promise<ReportData<'previous'> | null> {
  const {
    project,
    env: { settings },
  } = args;

  const cachedBaseReport =
    (await loadCachedBaseReportFromPortal(args)) ??
    (await loadCachedBaseReportFromArtifacts(args));

  if (!cachedBaseReport) {
    return null;
  }
  return saveReportFiles({
    project,
    type: 'previous',
    files: { json: cachedBaseReport },
    settings,
  });
}

async function loadCachedBaseReportFromArtifacts(
  args: BaseReportArgs,
): Promise<string | null> {
  const {
    env: { api },
    project,
  } = args;

  if (api.downloadReportArtifact == null) {
    return null;
  }

  const reportPath = await api
    .downloadReportArtifact(project?.name)
    .catch((error: unknown) => {
      logWarning(
        `Error when downloading previous report artifact, skipping - ${stringifyError(error)}`,
      );
      return null;
    });

  logInfo(`Previous report artifact ${reportPath ? 'found' : 'not found'}`);
  if (reportPath) {
    logDebug(`Previous report artifact downloaded to ${reportPath}`);
  }

  return reportPath;
}

async function loadCachedBaseReportFromPortal(
  args: BaseReportArgs,
): Promise<string | null> {
  const {
    config,
    env: { settings },
    base,
  } = args;

  if (!config.upload) {
    return null;
  }

  const reportPath = await downloadFromPortal({
    server: config.upload.server,
    apiKey: config.upload.apiKey,
    parameters: {
      organization: config.upload.organization,
      project: config.upload.project,
      withAuditDetails: true,
      ...(!settings.searchCommits && {
        commit: base.sha,
      }),
      ...(typeof settings.searchCommits === 'number' && {
        maxCommits: settings.searchCommits,
      }),
    },
  }).catch((error: unknown) => {
    logWarning(
      `Error when downloading previous report from portal, skipping - ${stringifyError(error)}`,
    );
    return null;
  });

  logInfo(
    `Previous report ${reportPath ? 'found' : 'not found'} in Code PushUp portal`,
  );
  if (reportPath) {
    logDebug(`Previous report downloaded from portal to ${reportPath}`);
  }

  return reportPath;
}

export async function runInBaseBranch<T>(
  base: GitBranch,
  env: RunEnv,
  fn: () => Promise<T>,
): Promise<T> {
  const { git } = env;

  await git.fetch('origin', base.ref, ['--depth=1']);
  await git.checkout(['-f', base.sha]);
  logInfo(`Switched to base branch ${base.ref}`);

  const result = await fn();

  await git.checkout(['-f', '-']);
  logInfo('Switched back to PR/MR branch');

  return result;
}

export async function checkPrintConfig(
  args: BaseReportArgs,
): Promise<EnhancedPersistConfig | null> {
  const { project, ctx, base } = args;

  const operation = project
    ? `Executing print-config for project ${project.name}`
    : 'Executing print-config';
  try {
    const config = await printPersistConfig(ctx);
    logDebug(
      `${operation} verified code-pushup installed in base branch ${base.ref}`,
    );
    return config;
  } catch (error) {
    logDebug(`Error from print-config - ${stringifyError(error)}`);
    logInfo(
      `${operation} failed, assuming code-pushup not installed in base branch ${base.ref} and skipping comparison`,
    );
    return null;
  }
}

export async function printPersistConfig(
  ctx: CommandContext,
): Promise<EnhancedPersistConfig> {
  const json = await runPrintConfig(ctx);
  return parsePersistConfig(json);
}

export function hasDefaultPersistFormats(
  config: EnhancedPersistConfig,
): boolean {
  const formats = config.persist?.format;
  return (
    formats == null ||
    DEFAULT_PERSIST_FORMAT.every(format => formats.includes(format))
  );
}

export function configFromPatterns(
  configPatterns: ConfigPatterns,
  project: ProjectConfig | null,
): ConfigPatterns {
  const { persist, upload } = configPatterns;
  const variables = {
    projectName: project?.name ?? '',
  };
  return {
    persist: {
      outputDir: interpolate(persist.outputDir, variables),
      filename: interpolate(persist.filename, variables),
      format: persist.format,
      skipReports: persist.skipReports,
    },
    ...(upload && {
      upload: {
        server: upload.server,
        apiKey: upload.apiKey,
        organization: interpolate(upload.organization, variables),
        project: interpolate(upload.project, variables),
        ...(upload.timeout != null && { timeout: upload.timeout }),
      },
    }),
  };
}

export async function findNewIssues(
  args: CompareReportsArgs,
): Promise<SourceFileIssue[]> {
  const {
    base,
    currReport,
    prevReport,
    config,
    ctx,
    env: { git },
  } = args;

  const diffFiles = persistedFilesFromConfig(config, {
    directory: ctx.directory,
    isDiff: true,
  });

  await git.fetch('origin', base.ref, ['--depth=1']);
  const reportsDiff = await readFile(diffFiles.json, 'utf8');
  const changedFiles = await listChangedFiles(
    { base: 'FETCH_HEAD', head: 'HEAD' },
    git,
  );

  const issues = filterRelevantIssues({
    currReport: JSON.parse(currReport.content) as Report,
    prevReport: JSON.parse(prevReport.content) as Report,
    reportsDiff: JSON.parse(reportsDiff) as ReportsDiff,
    changedFiles,
  });
  logDebug(
    `Found ${issues.length} relevant issues for ${
      Object.keys(changedFiles).length
    } changed files`,
  );

  return issues;
}

function projectToName(project: ProjectConfig | null): string {
  return project?.name ?? '-';
}
