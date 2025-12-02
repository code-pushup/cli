/* eslint-disable max-lines */
import { readFile } from 'node:fs/promises';
import {
  type ExcludeNullableProps,
  asyncSequential,
  hasNoNullableProps,
} from '@code-pushup/utils';
import {
  type CommandContext,
  type EnhancedPersistConfig,
  createCommandContext,
  persistedFilesFromConfig,
  runCollect,
  runCompare,
  runMergeDiffs,
} from './cli/index.js';
import { commentOnPR } from './comment.js';
import { logDebug, logInfo } from './log.js';
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
  type CompareReportsArgs,
  type ReportData,
  type RunEnv,
  checkPrintConfig,
  configFromPatterns,
  findNewIssues,
  hasDefaultPersistFormats,
  loadCachedBaseReport,
  prepareReportFilesToCompare,
  printPersistConfig,
  runInBaseBranch,
  runOnProject,
  saveDiffFiles,
  saveReportFiles,
} from './run-utils.js';

export async function runInMonorepoMode(
  env: RunEnv,
): Promise<MonorepoRunResult> {
  const { api, settings } = env;

  logInfo('Running Code PushUp in monorepo mode');

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
  logDebug(`Merged ${diffJsonPaths.length} diffs into ${tmpDiffPath}`);
  const { md: diffPath } = await saveOutputFiles({
    project: null,
    type: 'comparison',
    files: { md: tmpDiffPath },
    settings,
  });

  const commentId = settings.skipComment
    ? null
    : await commentOnPR(diffPath, api, settings);

  return {
    mode: 'monorepo',
    projects: projectResults,
    files: { comparison: { md: diffPath } },
    ...(commentId != null && { commentId }),
  };
}

type ProjectEnv = {
  project: ProjectConfig;
  config: EnhancedPersistConfig;
  ctx: CommandContext;
};

type ProjectReport = ProjectEnv & {
  reports: OutputFiles;
};

function runProjectsIndividually(
  projects: ProjectConfig[],
  env: RunEnv,
): Promise<ProjectRunResult[]> {
  logInfo(`Running on ${projects.length} projects individually`);
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

  logInfo(
    `Running on ${projects.length} projects in bulk (parallel: ${settings.parallel})`,
  );

  const { projectEnvs, hasFormats } = await loadProjectEnvs(projects, settings);

  await collectMany(runManyCommand, env, { hasFormats });

  const currProjectReports = await Promise.all(
    projectEnvs.map(
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

async function loadProjectEnvs(
  projects: ProjectConfig[],
  settings: Settings,
): Promise<{
  projectEnvs: ProjectEnv[];
  hasFormats: boolean;
}> {
  const { configPatterns } = settings;

  const projectEnvs: ProjectEnv[] = configPatterns
    ? projects.map(
        (project): ProjectEnv => ({
          project,
          config: configFromPatterns(configPatterns, project),
          ctx: createCommandContext(settings, project),
        }),
      )
    : await asyncSequential(projects, async (project): Promise<ProjectEnv> => {
        const ctx = createCommandContext(settings, project);
        const config = await printPersistConfig(ctx);
        return { project, config, ctx };
      });

  const hasFormats = allProjectsHaveDefaultPersistFormats(projectEnvs);

  logDebug(
    [
      configPatterns
        ? `Parsed ${projectEnvs.length} persist and upload configs by interpolating configPatterns option for each project.`
        : `Loaded ${projectEnvs.length} persist and upload configs by running print-config command for each project.`,
      hasFormats
        ? 'Every project has default persist formats.'
        : 'Not all projects have default persist formats.',
    ].join(' '),
  );

  return { projectEnvs, hasFormats };
}

async function compareProjectsInBulk(
  currProjectReports: ProjectReport[],
  base: GitBranch,
  runManyCommand: RunManyCommand,
  env: RunEnv,
): Promise<ProjectRunResult[]> {
  const projectReportsWithCache = await Promise.all(
    currProjectReports.map(async ({ project, ctx, reports, config }) => {
      const args = { project, config, base, ctx, env };
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
  logInfo(
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
    .filter(hasNoNullableProps) satisfies CompareReportsArgs[];

  const projectComparisons = await compareManyProjects(
    projectsToCompare,
    runManyCommand,
    env,
  );

  return finalizeProjectReports(currProjectReports, projectComparisons);
}

async function compareManyProjects(
  projectsToCompare: ExcludeNullableProps<CompareReportsArgs>[],
  runManyCommand: RunManyCommand,
  env: RunEnv,
): Promise<Record<string, ProjectRunResult>> {
  await Promise.all(projectsToCompare.map(prepareReportFilesToCompare));

  await compareMany(runManyCommand, env, {
    hasFormats: allProjectsHaveDefaultPersistFormats(projectsToCompare),
  });

  const projectsNewIssues = env.settings.detectNewIssues
    ? Object.fromEntries(
        await asyncSequential(projectsToCompare, async args => [
          args.project.name,
          await findNewIssues(args),
        ]),
      )
    : {};

  return Object.fromEntries(
    await Promise.all(
      projectsToCompare.map(async args => [
        args.project.name,
        await saveDiffFiles(args, projectsNewIssues[args.project.name]),
      ]),
    ),
  );
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
  const { configPatterns } = settings;

  if (uncachedProjectReports.length === 0) {
    return {};
  }

  return runInBaseBranch(base, env, async () => {
    const uncachedProjectConfigs = configPatterns
      ? uncachedProjectReports.map(({ project, ctx }) => {
          const config = configFromPatterns(configPatterns, project);
          return { project, ctx, config };
        })
      : await asyncSequential(uncachedProjectReports, async args => ({
          project: args.project,
          ctx: args.ctx,
          config: await checkPrintConfig(args),
        }));

    const validProjectConfigs =
      uncachedProjectConfigs.filter(hasNoNullableProps);
    const onlyProjects = validProjectConfigs.map(({ project }) => project.name);
    const invalidProjects: string[] = uncachedProjectConfigs
      .map(({ project }) => project.name)
      .filter(name => !onlyProjects.includes(name));
    if (invalidProjects.length > 0) {
      logDebug(
        `Printing config failed for ${invalidProjects.length} projects - ${invalidProjects.join(', ')}`,
      );
      logInfo(
        `Skipping ${invalidProjects.length} projects which aren't configured in base branch ${base.ref}`,
      );
    }

    if (onlyProjects.length > 0) {
      const hasFormats =
        allProjectsHaveDefaultPersistFormats(validProjectConfigs);
      logInfo(
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
  project: ProjectConfig;
  ctx: CommandContext;
  config: EnhancedPersistConfig;
  settings: Settings;
}): Promise<[string, ReportData<'previous'>]> {
  const { project, ctx, config, settings } = args;
  const files = await saveReportFiles({
    project,
    type: 'previous',
    files: persistedFilesFromConfig(config, ctx),
    settings,
  });
  return [project.name, files];
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
  logDebug(`Collected ${countText} reports using command \`${command}\``);
}

async function compareMany(
  runManyCommand: RunManyCommand,
  env: RunEnv,
  options: {
    hasFormats: boolean;
  },
): Promise<void> {
  const { settings } = env;
  const { hasFormats } = options;

  const ctx: CommandContext = {
    ...createCommandContext(settings, null),
    bin: await runManyCommand(),
  };

  await runCompare(ctx, { hasFormats });

  logDebug('Compared all project reports');
}

export function allProjectsHaveDefaultPersistFormats(
  projects: { config: EnhancedPersistConfig }[],
): boolean {
  return projects.every(({ config }) => hasDefaultPersistFormats(config));
}
