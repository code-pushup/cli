/* eslint-disable max-lines */
import { readFile } from 'node:fs/promises';
import type { SimpleGit } from 'simple-git';
import type { CoreConfig, Report, ReportsDiff } from '@code-pushup/models';
import {
  removeUndefinedAndEmptyProps,
  stringifyError,
} from '@code-pushup/utils';
import {
  type CommandContext,
  createCommandContext,
  persistedFilesFromConfig,
  runCollect,
  runCompare,
  runPrintConfig,
} from './cli/index.js';
import { parsePersistConfig } from './cli/persist.js';
import { DEFAULT_SETTINGS } from './constants.js';
import { listChangedFiles, normalizeGitRef } from './git.js';
import { type SourceFileIssue, filterRelevantIssues } from './issues.js';
import type {
  GitBranch,
  GitRefs,
  Options,
  OutputFiles,
  ProjectRunResult,
  ProviderAPIClient,
  Settings,
} from './models.js';
import type { ProjectConfig } from './monorepo/index.js';
import { saveOutputFiles } from './output-files.js';

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
  base: GitBranch;
  currReport: ReportData<'current'>;
  prevReport: ReportData<'previous'>;
  config: Pick<CoreConfig, 'persist'>;
};

export type BaseReportArgs = {
  project: ProjectConfig | null;
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
  const inferredVerbose: boolean = Boolean(
    options?.debug === true || options?.silent === false,
  );
  // eslint-disable-next-line functional/immutable-data
  process.env['CP_VERBOSE'] = `${inferredVerbose}`;

  const [head, base] = await Promise.all([
    normalizeGitRef(refs.head, git),
    refs.base && normalizeGitRef(refs.base, git),
  ]);

  return {
    refs: { head, ...(base && { base }) },
    api,
    settings: {
      ...DEFAULT_SETTINGS,
      ...(options && removeUndefinedAndEmptyProps(options)),
    },
    git,
  };
}

export async function runOnProject(
  project: ProjectConfig | null,
  env: RunEnv,
): Promise<ProjectRunResult> {
  const {
    refs: { head, base },
    settings,
  } = env;
  const logger = settings.logger;

  const ctx = createCommandContext(settings, project);

  if (project) {
    logger.info(`Running Code PushUp on monorepo project ${project.name}`);
  }

  const config = await printPersistConfig(ctx);
  logger.debug(
    `Loaded persist config from print-config command - ${JSON.stringify(config.persist)}`,
  );

  await runCollect(ctx);
  const currReport = await saveReportFiles({
    project,
    type: 'current',
    files: persistedFilesFromConfig(config, ctx),
    settings,
  });
  logger.debug(`Collected current report at ${currReport.files.json}`);

  const noDiffOutput = {
    name: projectToName(project),
    files: { current: currReport.files },
  } satisfies ProjectRunResult;

  if (base == null) {
    return noDiffOutput;
  }

  logger.info(
    `PR/MR detected, preparing to compare base branch ${base.ref} to head ${head.ref}`,
  );

  const prevReport = await collectPreviousReport({ project, env, base, ctx });
  if (!prevReport) {
    return noDiffOutput;
  }

  const compareArgs = { project, env, base, config, currReport, prevReport };
  return compareReports(compareArgs);
}

export async function compareReports(
  args: CompareReportsArgs,
): Promise<ProjectRunResult> {
  const {
    project,
    env: { settings },
    currReport,
    prevReport,
    config,
  } = args;
  const logger = settings.logger;

  const ctx = createCommandContext(settings, project);

  await runCompare(
    {
      before: prevReport.files.json,
      after: currReport.files.json,
      label: project?.name,
    },
    ctx,
  );
  const diffFiles = persistedFilesFromConfig(config, {
    directory: ctx.directory,
    isDiff: true,
  });
  logger.info('Compared reports and generated diff files');
  logger.debug(`Generated diff files at ${diffFiles.json} and ${diffFiles.md}`);

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
    ...(settings.detectNewIssues && {
      newIssues: await findNewIssues({ ...args, diffFiles }),
    }),
  };
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
  const { logger } = settings;

  const cachedBaseReport = await loadCachedBaseReport(args);
  if (cachedBaseReport) {
    return cachedBaseReport;
  }

  return runInBaseBranch(base, env, async () => {
    const config = await checkPrintConfig(args);
    if (!config) {
      return null;
    }

    await runCollect(ctx);
    const report = await saveReportFiles({
      project,
      type: 'previous',
      files: persistedFilesFromConfig(config, ctx),
      settings,
    });
    logger.debug(`Collected previous report at ${report.files.json}`);
    return report;
  });
}

export async function loadCachedBaseReport(
  args: BaseReportArgs,
): Promise<ReportData<'previous'> | null> {
  const {
    project,
    env: { api, settings },
  } = args;
  const { logger } = settings;

  const cachedBaseReport = await api
    .downloadReportArtifact?.(project?.name)
    .catch((error: unknown) => {
      logger.warn(
        `Error when downloading previous report artifact, skipping - ${stringifyError(error)}`,
      );
    });
  if (api.downloadReportArtifact != null) {
    logger.info(
      `Previous report artifact ${cachedBaseReport ? 'found' : 'not found'}`,
    );
    if (cachedBaseReport) {
      logger.debug(
        `Previous report artifact downloaded to ${cachedBaseReport}`,
      );
    }
  }

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

export async function runInBaseBranch<T>(
  base: GitBranch,
  env: RunEnv,
  fn: () => Promise<T>,
): Promise<T> {
  const {
    git,
    settings: { logger },
  } = env;

  await git.fetch('origin', base.ref, ['--depth=1']);
  await git.checkout(['-f', base.sha]);
  logger.info(`Switched to base branch ${base.ref}`);

  const result = await fn();

  await git.checkout(['-f', '-']);
  logger.info('Switched back to PR/MR branch');

  return result;
}

export async function checkPrintConfig(
  args: BaseReportArgs,
): Promise<Pick<CoreConfig, 'persist'> | null> {
  const {
    project,
    ctx,
    base,
    env: { settings },
  } = args;
  const { logger } = settings;

  const operation = project
    ? `Executing print-config for project ${project.name}`
    : 'Executing print-config';
  try {
    const config = await printPersistConfig(ctx);
    logger.debug(
      `${operation} verified code-pushup installed in base branch ${base.ref}`,
    );
    return config;
  } catch (error) {
    logger.debug(`Error from print-config - ${stringifyError(error)}`);
    logger.info(
      `${operation} failed, assuming code-pushup not installed in base branch ${base.ref} and skipping comparison`,
    );
    return null;
  }
}

export async function printPersistConfig(
  ctx: CommandContext,
): Promise<Pick<CoreConfig, 'persist'>> {
  const json = await runPrintConfig(ctx);
  return parsePersistConfig(json);
}

export async function findNewIssues(
  args: CompareReportsArgs & { diffFiles: OutputFiles },
): Promise<SourceFileIssue[]> {
  const {
    base,
    currReport,
    prevReport,
    diffFiles,
    env: {
      git,
      settings: { logger },
    },
  } = args;

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
  logger.debug(
    `Found ${issues.length} relevant issues for ${
      Object.keys(changedFiles).length
    } changed files`,
  );

  return issues;
}

function projectToName(project: ProjectConfig | null): string {
  return project?.name ?? '-';
}
