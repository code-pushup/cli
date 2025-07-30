import { readFile } from 'node:fs/promises';
import type { CoreConfig } from '@code-pushup/models';
import {
  type ExcludeNullableProps,
  asyncSequential,
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
  Settings,
} from './models.js';
import {
  type ProjectConfig,
  type RunManyCommand,
  listMonorepoProjects,
} from './monorepo/index.js';
import { saveOutputFiles } from './output-files.js';
import {
  type BaseReportArgs,
  type ReportData,
  type RunEnv,
  checkPrintConfig,
  compareReports,
  hasDefaultPersistFormats,
  loadCachedBaseReport,
  printPersistConfig,
  runInBaseBranch,
  runOnProject,
  saveReportFiles,
} from './run-utils.js';

export async function runInMonorepoMode(
  env: RunEnv,
): Promise<MonorepoRunResult> {
  const { api, settings } = env;
  const { logger } = settings;

  logger.info('Running Code PushUp in monorepo mode');

  const { projects, runManyCommand } = await listMonorepoProjects(settings);
  const projectResults = runManyCommand
    ? await runProjectsInBulk(projects, runManyCommand, env)
    : await runProjectsIndividually(projects, env);

  const diffJsonPaths = projectResults
    .map(({ files }) => files.comparison?.json)
    .filter((file): file is string => file != null);

  if (diffJsonPaths.length === 0) {
    return { mode: 'monorepo', projects: projectResults };
  }

  const tmpDiffPath = await runMergeDiffs(
    diffJsonPaths,
    createCommandContext(settings, projects[0]),
  );
  logger.debug(`Merged ${diffJsonPaths.length} diffs into ${tmpDiffPath}`);
  const { md: diffPath } = await saveOutputFiles({
    project: null,
    type: 'comparison',
    files: { md: tmpDiffPath },
    settings,
  });

  const commentId = settings.skipComment
    ? null
    : await commentOnPR(diffPath, api, logger);

  return {
    mode: 'monorepo',
    projects: projectResults,
    files: { comparison: { md: diffPath } },
    ...(commentId != null && { commentId }),
  };
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
  return asyncSequential(projects, project => runOnProject(project, env));
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
  const { logger } = settings;

  logger.info(
    `Running on ${projects.length} projects in bulk (parallel: ${settings.parallel})`,
  );

  const currProjectConfigs = await asyncSequential(projects, async project => {
    const ctx = createCommandContext(settings, project);
    const config = await printPersistConfig(ctx);
    return { project, config, ctx };
  });
  const hasFormats = allProjectsHaveDefaultPersistFormats(currProjectConfigs);
  logger.debug(
    [
      `Loaded ${currProjectConfigs.length} persist configs by running print-config command for each project.`,
      hasFormats
        ? 'Every project has default persist formats.'
        : 'Not all projects have default persist formats.',
    ].join(' '),
  );

  await collectMany(runManyCommand, env, { hasFormats });

  const currProjectReports = await Promise.all(
    currProjectConfigs.map(
      async ({ project, config, ctx }): Promise<ProjectReport> => {
        const reports = await saveOutputFiles({
          project,
          type: 'current',
          files: persistedFilesFromConfig(config, ctx),
          settings,
        });
        return { project, reports, config, ctx };
      },
    ),
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
      const [currReport, prevReport] = await Promise.all([
        readFile(reports.json, 'utf8').then(
          (content): ReportData<'current'> => ({
            content,
            files: reports,
          }),
        ),
        loadCachedBaseReport(args),
      ]);
      return { ...args, config, currReport, prevReport };
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

  const projectComparisons = Object.fromEntries(
    await asyncSequential(projectsToCompare, async args => [
      args.project.name,
      await compareReports(args),
    ]),
  );

  return finalizeProjectReports(currProjectReports, projectComparisons);
}

function finalizeProjectReports(
  projectReports: ProjectReport[],
  projectComparisons?: Record<string, ProjectRunResult>,
): ProjectRunResult[] {
  return projectReports.map(({ project, reports }): ProjectRunResult => {
    const comparison = projectComparisons?.[project.name];
    return {
      name: project.name,
      files: comparison?.files ?? { current: reports },
      ...(comparison?.newIssues && { newIssues: comparison.newIssues }),
    };
  });
}

async function collectPreviousReports(
  base: GitBranch,
  uncachedProjectReports: ExcludeNullableProps<BaseReportArgs>[],
  runManyCommand: RunManyCommand,
  env: RunEnv,
): Promise<Record<string, ReportData<'previous'>>> {
  const { settings } = env;
  const { logger } = settings;

  if (uncachedProjectReports.length === 0) {
    return {};
  }

  return runInBaseBranch(base, env, async () => {
    const uncachedProjectConfigs = await asyncSequential(
      uncachedProjectReports,
      async args => ({
        name: args.project.name,
        ctx: args.ctx,
        config: await checkPrintConfig(args),
      }),
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
      const hasFormats =
        allProjectsHaveDefaultPersistFormats(validProjectConfigs);
      logger.info(
        `Collecting previous reports for ${onlyProjects.length} projects`,
      );
      await collectMany(runManyCommand, env, { hasFormats, onlyProjects });
    }

    const projectFiles = validProjectConfigs.map(args =>
      savePreviousProjectReport({ ...args, settings }),
    );

    return Object.fromEntries(await Promise.all(projectFiles));
  });
}

async function savePreviousProjectReport(args: {
  name: string;
  ctx: CommandContext;
  config: Pick<CoreConfig, 'persist'>;
  settings: Settings;
}): Promise<[string, ReportData<'previous'>]> {
  const { name, ctx, config, settings } = args;
  const files = await saveReportFiles({
    project: { name },
    type: 'previous',
    files: persistedFilesFromConfig(config, ctx),
    settings,
  });
  return [name, files];
}

async function collectMany(
  runManyCommand: RunManyCommand,
  env: RunEnv,
  options: {
    hasFormats: boolean;
    onlyProjects?: string[];
  },
): Promise<void> {
  const { settings } = env;
  const { hasFormats, onlyProjects } = options;

  const command = await runManyCommand(onlyProjects);
  const ctx: CommandContext = {
    ...createCommandContext(settings, null),
    bin: command,
  };

  await runCollect(ctx, { hasFormats });

  const countText = onlyProjects
    ? `${onlyProjects.length} previous`
    : 'all current';
  settings.logger.debug(
    `Collected ${countText} reports using command \`${command}\``,
  );
}

export function allProjectsHaveDefaultPersistFormats(
  projects: { config: Pick<CoreConfig, 'persist'> }[],
): boolean {
  return projects.every(({ config }) => hasDefaultPersistFormats(config));
}
