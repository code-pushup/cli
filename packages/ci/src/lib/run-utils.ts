import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { SimpleGit } from 'simple-git';
import type { CoreConfig, Report, ReportsDiff } from '@code-pushup/models';
import { stringifyError } from '@code-pushup/utils';
import {
  type CommandContext,
  createCommandContext,
  persistedFilesFromConfig,
  runCollect,
  runCompare,
  runPrintConfig,
} from './cli/index.js';
import { parsePersistConfig } from './cli/persist.js';
import { listChangedFiles } from './git.js';
import { type SourceFileIssue, filterRelevantIssues } from './issues.js';
import type {
  GitBranch,
  GitRefs,
  Logger,
  OutputFiles,
  ProjectRunResult,
  ProviderAPIClient,
  Settings,
} from './models.js';
import type { ProjectConfig } from './monorepo/index.js';

export type RunEnv = {
  refs: GitRefs;
  api: ProviderAPIClient;
  settings: Settings;
  git: SimpleGit;
};

export type CompareReportsArgs = {
  project: ProjectConfig | null;
  env: RunEnv;
  base: GitBranch;
  currReport: string;
  prevReport: string;
  config: Pick<CoreConfig, 'persist'>;
};

export type CompareReportsResult = {
  files: OutputFiles;
  newIssues?: SourceFileIssue[];
};

export type BaseReportArgs = {
  project: ProjectConfig | null;
  env: RunEnv;
  base: GitBranch;
  ctx: CommandContext;
};

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

  const config = await printPersistConfig(ctx, settings);
  logger.debug(
    `Loaded persist config from print-config command - ${JSON.stringify(config.persist)}`,
  );

  await runCollect(ctx);
  const reportFiles = persistedFilesFromConfig(config, ctx);
  const currReport = await readFile(reportFiles.json, 'utf8');
  logger.debug(`Collected current report at ${reportFiles.json}`);

  const noDiffOutput = {
    name: project?.name ?? '-',
    files: {
      report: reportFiles,
    },
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
  const { files: diffFiles, newIssues } = await compareReports(compareArgs);

  return {
    ...noDiffOutput,
    files: {
      ...noDiffOutput.files,
      diff: diffFiles,
    },
    ...(newIssues && { newIssues }),
  };
}

export async function compareReports(
  args: CompareReportsArgs,
): Promise<CompareReportsResult> {
  const {
    project,
    env: { settings, git },
    base,
    currReport,
    prevReport,
    config,
  } = args;
  const logger = settings.logger;

  const ctx = createCommandContext(settings, project);

  const reportsDir = path.join(settings.directory, '.code-pushup');
  const currPath = path.join(reportsDir, 'curr-report.json');
  const prevPath = path.join(reportsDir, 'prev-report.json');
  await mkdir(reportsDir, { recursive: true });
  await writeFile(currPath, currReport);
  await writeFile(prevPath, prevReport);
  logger.debug(`Saved reports to ${currPath} and ${prevPath}`);

  await runCompare(
    { before: prevPath, after: currPath, label: project?.name },
    ctx,
  );
  const comparisonFiles = persistedFilesFromConfig(config, {
    directory: ctx.directory,
    isDiff: true,
  });
  logger.info('Compared reports and generated diff files');
  logger.debug(
    `Generated diff files at ${comparisonFiles.json} and ${comparisonFiles.md}`,
  );

  if (!settings.detectNewIssues) {
    return { files: comparisonFiles };
  }

  const newIssues = await findNewIssues({
    base,
    currReport,
    prevReport,
    comparisonFiles,
    logger,
    git,
  });

  return { files: comparisonFiles, newIssues };
}

export async function collectPreviousReport(
  args: BaseReportArgs,
): Promise<string | null> {
  const { ctx, env, base } = args;

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
    const { json: prevReportPath } = persistedFilesFromConfig(config, ctx);
    const prevReport = await readFile(prevReportPath, 'utf8');
    env.settings.logger.debug(`Collected previous report at ${prevReportPath}`);
    return prevReport;
  });
}

export async function loadCachedBaseReport(
  args: BaseReportArgs,
): Promise<string | null> {
  const {
    project,
    env: {
      api,
      settings: { logger },
    },
  } = args;

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

  if (cachedBaseReport) {
    return readFile(cachedBaseReport, 'utf8');
  }
  return null;
}

export async function ensureHeadBranch({ refs, git }: RunEnv): Promise<void> {
  const { head } = refs;
  if (head.sha !== (await git.revparse('HEAD'))) {
    await git.checkout(['-f', head.ref]);
  }
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
    const config = await printPersistConfig(ctx, settings);
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
  settings: Settings,
): Promise<Pick<CoreConfig, 'persist'>> {
  const json = await runPrintConfig({ ...ctx, silent: !settings.debug });
  return parsePersistConfig(json);
}

export async function findNewIssues(args: {
  base: GitBranch;
  currReport: string;
  prevReport: string;
  comparisonFiles: OutputFiles;
  logger: Logger;
  git: SimpleGit;
}): Promise<SourceFileIssue[]> {
  const { base, currReport, prevReport, comparisonFiles, logger, git } = args;

  await git.fetch('origin', base.ref, ['--depth=1']);
  const reportsDiff = await readFile(comparisonFiles.json, 'utf8');
  const changedFiles = await listChangedFiles(
    { base: 'FETCH_HEAD', head: 'HEAD' },
    git,
  );
  const issues = filterRelevantIssues({
    currReport: JSON.parse(currReport) as Report,
    prevReport: JSON.parse(prevReport) as Report,
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
