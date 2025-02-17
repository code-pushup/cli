import { copyFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  type CoreConfig,
  DEFAULT_PERSIST_OUTPUT_DIR,
} from '@code-pushup/models';
import {
  type ExcludeNullableProps,
  hasNoNullableProps,
} from '@code-pushup/utils';
import {
  type CommandContext,
  createCommandContext,
  persistedFilesFromConfig,
  runCollect,
  runMergeDiffs,
} from './cli/index.js';
import { commentOnPR } from './comment.js';
import type {
  GitBranch,
  MonorepoRunResult,
  OutputFiles,
  ProjectRunResult,
} from './models.js';
import {
  type ProjectConfig,
  type RunManyCommand,
  listMonorepoProjects,
} from './monorepo/index.js';
import {
  type BaseReportArgs,
  type CompareReportsResult,
  type RunEnv,
  checkPrintConfig,
  compareReports,
  ensureHeadBranch,
  loadCachedBaseReport,
  printPersistConfig,
  runInBaseBranch,
  runOnProject,
} from './run-utils.js';

export async function runInMonorepoMode(
  env: RunEnv,
): Promise<MonorepoRunResult> {
  const { api, settings } = env;
  const { logger, directory } = settings;

  logger.info('Running Code PushUp in monorepo mode');

  await ensureHeadBranch(env);

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
      await copyFile(tmpDiffPath, diffPath);
      logger.debug(`Copied ${tmpDiffPath} to ${diffPath}`);
    }
    const commentId = settings.skipComment
      ? null
      : await commentOnPR(tmpDiffPath, api, logger);
    return {
      mode: 'monorepo',
      projects: projectResults,
      diffPath,
      ...(commentId != null && { commentId }),
    };
  }

  return { mode: 'monorepo', projects: projectResults };
}

type ProjectReport = {
  project: ProjectConfig;
  reports: OutputFiles;
  config: Pick<CoreConfig, 'persist'>;
  ctx: CommandContext;
};

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

async function runProjectsInBulk(
  projects: ProjectConfig[],
  runManyCommand: RunManyCommand,
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
    projects.map(async (project): Promise<ProjectReport> => {
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
    return finalizeProjectReports(currProjectReports);
  }

  return compareProjectsInBulk(currProjectReports, base, runManyCommand, env);
}

async function compareProjectsInBulk(
  currProjectReports: ProjectReport[],
  base: GitBranch,
  runManyCommand: RunManyCommand,
  env: RunEnv,
): Promise<ProjectRunResult[]> {
  const projectReportsWithCache = await Promise.all(
    currProjectReports.map(async ({ project, ctx, reports, config }) => {
      const args = { project, base, ctx, env };
      return {
        ...args,
        config,
        currReport: await readFile(reports.json, 'utf8'),
        prevReport: await loadCachedBaseReport(args),
      };
    }),
  );
  const uncachedProjectReports = projectReportsWithCache.filter(
    ({ prevReport }) => !prevReport,
  );
  env.settings.logger.info(
    `${currProjectReports.length - uncachedProjectReports.length} out of ${currProjectReports.length} projects loaded previous report from artifact cache`,
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

  return finalizeProjectReports(currProjectReports, projectComparisons);
}

function finalizeProjectReports(
  projectReports: ProjectReport[],
  projectComparisons?: Record<string, CompareReportsResult>,
): ProjectRunResult[] {
  return projectReports.map(({ project, reports }): ProjectRunResult => {
    const comparison = projectComparisons?.[project.name];
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
  runManyCommand: RunManyCommand,
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
          await readFile(persistedFilesFromConfig(config, ctx).json, 'utf8'),
        ] as const,
    );

    return Object.fromEntries(await Promise.all(projectFiles));
  });
}

async function collectMany(
  runManyCommand: RunManyCommand,
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
