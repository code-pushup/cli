/* eslint-disable max-lines */
import fs from 'node:fs/promises';
import path from 'node:path';
import { type SimpleGit, simpleGit } from 'simple-git';
import {
  type CoreConfig,
  DEFAULT_PERSIST_OUTPUT_DIR,
  type Report,
  type ReportsDiff,
} from '@code-pushup/models';
import {
  type ExcludeNullableProps,
  hasNoNullableProps,
  stringifyError,
} from '@code-pushup/utils';
import {
  type CommandContext,
  createCommandContext,
  persistedFilesFromConfig,
  runCollect,
  runCompare,
  runMergeDiffs,
  runPrintConfig,
} from './cli/index.js';
import { parsePersistConfig } from './cli/persist.js';
import { commentOnPR } from './comment.js';
import { DEFAULT_SETTINGS } from './constants.js';
import { listChangedFiles } from './git.js';
import { type SourceFileIssue, filterRelevantIssues } from './issues.js';
import type {
  GitBranch,
  GitRefs,
  Logger,
  Options,
  OutputFiles,
  ProjectRunResult,
  ProviderAPIClient,
  RunResult,
  Settings,
} from './models.js';
import { type ProjectConfig, listMonorepoProjects } from './monorepo/index.js';
import type { MonorepoProjects } from './monorepo/list-projects.js';

/**
 * Runs Code PushUp in CI environment.
 * @param refs Git branches (head and optional base)
 * @param api API client for given provider
 * @param options Additional options (e.g. monorepo mode)
 * @param git instance of simple-git - useful for testing
 * @returns result of run (standalone or monorepo)
 */
export async function runInCI(
  refs: GitRefs,
  api: ProviderAPIClient,
  options?: Options,
  git: SimpleGit = simpleGit(),
): Promise<RunResult> {
  const settings: Settings = {
    ...DEFAULT_SETTINGS,
    ...options,
  };

  const env: RunEnv = { refs, api, settings, git };

  if (settings.monorepo) {
    return runInMonorepoMode(env);
  }

  return runInStandaloneMode(env);
}

type RunEnv = {
  refs: GitRefs;
  api: ProviderAPIClient;
  settings: Settings;
  git: SimpleGit;
};

async function runInStandaloneMode(env: RunEnv): Promise<RunResult> {
  const {
    api,
    settings: { logger },
  } = env;

  logger.info('Running Code PushUp in standalone project mode');

  const { files, newIssues } = await runOnProject(null, env);

  const commentMdPath = files.diff?.md;
  if (commentMdPath) {
    const commentId = await commentOnPR(commentMdPath, api, logger);
    return {
      mode: 'standalone',
      files,
      commentId,
      newIssues,
    };
  }
  return { mode: 'standalone', files, newIssues };
}

async function runInMonorepoMode(env: RunEnv): Promise<RunResult> {
  const { api, settings } = env;
  const { logger, directory } = settings;

  logger.info('Running Code PushUp in monorepo mode');

  const { projects, runManyCommand } = await listMonorepoProjects(settings);
  const projectResults = runManyCommand
    ? await runProjectsInBulk(projects, runManyCommand, env)
    : await runProjectsIndividually(projects, env);

  const diffJsonPaths = projectResults
    .map(({ files }) => files.diff?.json)
    .filter((file): file is string => file != null);
  if (diffJsonPaths.length > 0) {
    const tmpDiffPath = await runMergeDiffs(
      diffJsonPaths,
      createCommandContext(settings, projects[0]),
    );
    logger.debug(`Merged ${diffJsonPaths.length} diffs into ${tmpDiffPath}`);
    const diffPath = path.join(
      directory,
      DEFAULT_PERSIST_OUTPUT_DIR,
      path.basename(tmpDiffPath),
    );
    if (tmpDiffPath !== diffPath) {
      await fs.copyFile(tmpDiffPath, diffPath);
      logger.debug(`Copied ${tmpDiffPath} to ${diffPath}`);
    }
    const commentId = await commentOnPR(tmpDiffPath, api, logger);
    return {
      mode: 'monorepo',
      projects: projectResults,
      commentId,
      diffPath,
    };
  }

  return { mode: 'monorepo', projects: projectResults };
}

function runProjectsIndividually(
  projects: ProjectConfig[],
  env: RunEnv,
): Promise<ProjectRunResult[]> {
  env.settings.logger.info(
    `Running on ${projects.length} projects individually`,
  );
  return projects.reduce<Promise<ProjectRunResult[]>>(
    async (acc, project) => [...(await acc), await runOnProject(project, env)],
    Promise.resolve([]),
  );
}

// eslint-disable-next-line max-lines-per-function
async function runProjectsInBulk(
  projects: ProjectConfig[],
  runManyCommand: NonNullable<MonorepoProjects['runManyCommand']>,
  env: RunEnv,
): Promise<ProjectRunResult[]> {
  const {
    refs: { base },
    settings,
  } = env;
  const logger = settings.logger;

  logger.info(
    `Running on ${projects.length} projects in bulk (parallel: ${settings.parallel})`,
  );

  await collectMany(runManyCommand, env);

  const currProjectReports = await Promise.all(
    projects.map(async project => {
      const ctx = createCommandContext(settings, project);
      const config = await printPersistConfig(ctx, settings);
      const reports = persistedFilesFromConfig(config, ctx);
      return { project, reports, config, ctx };
    }),
  );
  logger.debug(
    `Loaded ${currProjectReports.length} persist configs by running print-config command for each project`,
  );

  if (base == null) {
    return currProjectReports.map(
      ({ project, reports }): ProjectRunResult => ({
        name: project.name,
        files: { report: reports },
      }),
    );
  }

  const projectReportsWithCache = await Promise.all(
    currProjectReports.map(async ({ project, ctx, reports, config }) => {
      const args = { project, base, ctx, env };
      return {
        ...args,
        config,
        currReport: await fs.readFile(reports.json, 'utf8'),
        prevReport: await loadCachedBaseReport(args),
      };
    }),
  );
  const uncachedProjectReports = projectReportsWithCache.filter(
    ({ prevReport }) => !prevReport,
  );
  logger.info(
    `${projects.length - uncachedProjectReports.length} out of ${projects.length} projects loaded previous report from artifact cache`,
  );

  const collectedPrevReports = await collectPreviousReports(
    base,
    uncachedProjectReports,
    runManyCommand,
    env,
  );

  const projectsToCompare = projectReportsWithCache
    .map(args => ({
      ...args,
      prevReport: args.prevReport || collectedPrevReports[args.project.name],
    }))
    .filter(hasNoNullableProps);

  const projectComparisons = await projectsToCompare.reduce<
    Promise<Record<string, CompareReportsResult>>
  >(
    async (acc, args) => ({
      ...(await acc),
      [args.project.name]: await compareReports(args),
    }),
    Promise.resolve({}),
  );

  return currProjectReports.map(({ project, reports }): ProjectRunResult => {
    const comparison = projectComparisons[project.name];
    return {
      name: project.name,
      files: {
        report: reports,
        ...(comparison && { diff: comparison.files }),
      },
      ...(comparison?.newIssues && { newIssues: comparison.newIssues }),
    };
  });
}

async function collectPreviousReports(
  base: GitBranch,
  uncachedProjectReports: ExcludeNullableProps<BaseReportArgs>[],
  runManyCommand: NonNullable<MonorepoProjects['runManyCommand']>,
  env: RunEnv,
): Promise<Record<string, string>> {
  const {
    settings: { logger },
  } = env;

  if (uncachedProjectReports.length === 0) {
    return {};
  }

  return runInBaseBranch(base, env, async () => {
    const uncachedProjectConfigs = await Promise.all(
      uncachedProjectReports.map(async args => ({
        name: args.project.name,
        ctx: args.ctx,
        config: await checkPrintConfig(args),
      })),
    );

    const validProjectConfigs =
      uncachedProjectConfigs.filter(hasNoNullableProps);
    const onlyProjects = validProjectConfigs.map(({ name }) => name);
    const invalidProjects = uncachedProjectConfigs
      .map(({ name }) => name)
      .filter(name => !onlyProjects.includes(name));
    if (invalidProjects.length > 0) {
      logger.debug(
        `Printing config failed for ${invalidProjects.length} projects - ${invalidProjects.join(', ')}`,
      );
      logger.info(
        `Skipping ${invalidProjects.length} projects which aren't configured in base branch ${base.ref}`,
      );
    }

    if (onlyProjects.length > 0) {
      logger.info(
        `Collecting previous reports for ${onlyProjects.length} projects`,
      );
      await collectMany(runManyCommand, env, onlyProjects);
    }

    const projectFiles = validProjectConfigs.map(
      async ({ name, ctx, config }) =>
        [
          name,
          await fs.readFile(persistedFilesFromConfig(config, ctx).json, 'utf8'),
        ] as const,
    );

    return Object.fromEntries(await Promise.all(projectFiles));
  });
}

async function collectMany(
  runManyCommand: NonNullable<MonorepoProjects['runManyCommand']>,
  env: RunEnv,
  onlyProjects?: string[],
): Promise<void> {
  const { settings } = env;
  const command = await runManyCommand(onlyProjects);
  const ctx: CommandContext = {
    ...createCommandContext(settings, null),
    bin: command,
  };

  await runCollect(ctx);

  const countText = onlyProjects
    ? `${onlyProjects.length} previous`
    : 'all current';
  settings.logger.debug(
    `Collected ${countText} reports using command \`${command}\``,
  );
}

async function runOnProject(
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
  const currReport = await fs.readFile(reportFiles.json, 'utf8');
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

type CompareReportsArgs = {
  project: ProjectConfig | null;
  env: RunEnv;
  base: GitBranch;
  currReport: string;
  prevReport: string;
  config: Pick<CoreConfig, 'persist'>;
};

type CompareReportsResult = {
  files: OutputFiles;
  newIssues?: SourceFileIssue[];
};

async function compareReports(
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
  await fs.mkdir(reportsDir, { recursive: true });
  await fs.writeFile(currPath, currReport);
  await fs.writeFile(prevPath, prevReport);
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

type BaseReportArgs = {
  project: ProjectConfig | null;
  env: RunEnv;
  base: GitBranch;
  ctx: CommandContext;
};

async function collectPreviousReport(
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
    const prevReport = await fs.readFile(prevReportPath, 'utf8');
    env.settings.logger.debug(`Collected previous report at ${prevReportPath}`);
    return prevReport;
  });
}

async function loadCachedBaseReport(
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
    return fs.readFile(cachedBaseReport, 'utf8');
  }
  return null;
}

async function runInBaseBranch<T>(
  base: GitBranch,
  env: RunEnv,
  fn: () => Promise<T>,
): Promise<T> {
  const {
    git,
    settings: { logger },
  } = env;

  await git.fetch('origin', base.ref, ['--depth=1']);
  await git.checkout(['-f', base.ref]);
  logger.info(`Switched to base branch ${base.ref}`);

  const result = await fn();

  await git.checkout(['-f', '-']);
  logger.info('Switched back to PR/MR branch');

  return result;
}

async function checkPrintConfig(
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

async function printPersistConfig(
  ctx: CommandContext,
  settings: Settings,
): Promise<Pick<CoreConfig, 'persist'>> {
  const json = await runPrintConfig({ ...ctx, silent: !settings.debug });
  return parsePersistConfig(json);
}

async function findNewIssues(args: {
  base: GitBranch;
  currReport: string;
  prevReport: string;
  comparisonFiles: OutputFiles;
  logger: Logger;
  git: SimpleGit;
}): Promise<SourceFileIssue[]> {
  const { base, currReport, prevReport, comparisonFiles, logger, git } = args;

  await git.fetch('origin', base.ref, ['--depth=1']);
  const reportsDiff = await fs.readFile(comparisonFiles.json, 'utf8');
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
