import fs from 'node:fs/promises';
import path from 'node:path';
import { type SimpleGit, simpleGit } from 'simple-git';
import type { Report, ReportsDiff } from '@code-pushup/models';
import { stringifyError } from '@code-pushup/utils';
import {
  type CommandContext,
  type PersistedCliFiles,
  createCommandContext,
  runCollect,
  runCompare,
  runMergeDiffs,
  runPrintConfig,
} from './cli';
import { commentOnPR } from './comment';
import { DEFAULT_SETTINGS } from './constants';
import { listChangedFiles } from './git';
import { type SourceFileIssue, filterRelevantIssues } from './issues';
import type {
  GitBranch,
  GitRefs,
  Logger,
  Options,
  ProjectRunResult,
  ProviderAPIClient,
  RunResult,
  Settings,
} from './models';
import { type ProjectConfig, listMonorepoProjects } from './monorepo';

/**
 * Runs Code PushUp in CI environment.
 * @param refs Git branches (head and optional base)
 * @param api API client for given provider
 * @param options Additional options (e.g. monorepo mode)
 * @param git instance of simple-git - useful for testing
 * @returns result of run (standalone or monorepo)
 */
// eslint-disable-next-line max-lines-per-function
export async function runInCI(
  refs: GitRefs,
  api: ProviderAPIClient,
  options?: Options,
  git: SimpleGit = simpleGit(),
): Promise<RunResult> {
  const settings: Settings = { ...DEFAULT_SETTINGS, ...options };
  const logger = settings.logger;

  if (settings.monorepo) {
    logger.info('Running Code PushUp in monorepo mode');
    const projects = await listMonorepoProjects(settings);
    const projectResults = await projects.reduce<Promise<ProjectRunResult[]>>(
      async (acc, project) => [
        ...(await acc),
        await runOnProject({ project, settings, refs, api, git }),
      ],
      Promise.resolve([]),
    );
    const diffJsonPaths = projectResults
      .map(({ artifacts: { diff } }) =>
        diff?.files.find(file => file.endsWith('.json')),
      )
      .filter((file): file is string => file != null);
    if (diffJsonPaths.length > 0) {
      const { mdFilePath, artifactData: diffArtifact } = await runMergeDiffs(
        diffJsonPaths,
        createCommandContext(settings, projects[0]),
      );
      logger.debug(`Merged ${diffJsonPaths.length} diffs into ${mdFilePath}`);
      const commentId = await commentOnPR(mdFilePath, api, logger);
      return {
        mode: 'monorepo',
        projects: projectResults,
        commentId,
        diffArtifact,
      };
    }
    return { mode: 'monorepo', projects: projectResults };
  }

  logger.info('Running Code PushUp in standalone project mode');
  const { artifacts, newIssues } = await runOnProject({
    project: null,
    settings,
    api,
    refs,
    git,
  });
  const commentMdPath = artifacts.diff?.files.find(file =>
    file.endsWith('.md'),
  );
  if (commentMdPath) {
    const commentId = await commentOnPR(commentMdPath, api, logger);
    return {
      mode: 'standalone',
      artifacts,
      commentId,
      newIssues,
    };
  }
  return { mode: 'standalone', artifacts, newIssues };
}

type RunOnProjectArgs = {
  project: ProjectConfig | null;
  refs: GitRefs;
  api: ProviderAPIClient;
  settings: Settings;
  git: SimpleGit;
};

// eslint-disable-next-line max-lines-per-function
async function runOnProject(args: RunOnProjectArgs): Promise<ProjectRunResult> {
  const {
    project,
    refs: { head, base },
    settings,
    git,
  } = args;
  const logger = settings.logger;

  const ctx = createCommandContext(settings, project);

  if (project) {
    logger.info(`Running Code PushUp on monorepo project ${project.name}`);
  }

  const { jsonFilePath: currReportPath, artifactData: reportArtifact } =
    await runCollect(ctx);
  const currReport = await fs.readFile(currReportPath, 'utf8');
  logger.debug(`Collected current report at ${currReportPath}`);

  const noDiffOutput = {
    name: project?.name ?? '-',
    artifacts: {
      report: reportArtifact,
    },
  } satisfies ProjectRunResult;

  if (base == null) {
    return noDiffOutput;
  }

  logger.info(
    `PR/MR detected, preparing to compare base branch ${base.ref} to head ${head.ref}`,
  );

  const prevReport = await collectPreviousReport({ ...args, base, ctx });
  if (!prevReport) {
    return noDiffOutput;
  }

  const reportsDir = path.join(settings.directory, '.code-pushup');
  const currPath = path.join(reportsDir, 'curr-report.json');
  const prevPath = path.join(reportsDir, 'prev-report.json');
  await fs.writeFile(currPath, currReport);
  await fs.writeFile(prevPath, prevReport);
  logger.debug(`Saved reports to ${currPath} and ${prevPath}`);

  const comparisonFiles = await runCompare(
    { before: prevPath, after: currPath, label: project?.name },
    ctx,
  );
  logger.info('Compared reports and generated diff files');
  logger.debug(
    `Generated diff files at ${comparisonFiles.jsonFilePath} and ${comparisonFiles.mdFilePath}`,
  );

  const diffOutput = {
    ...noDiffOutput,
    artifacts: {
      ...noDiffOutput.artifacts,
      diff: comparisonFiles.artifactData,
    },
  } satisfies ProjectRunResult;

  if (!settings.detectNewIssues) {
    return diffOutput;
  }

  const newIssues = await findNewIssues({
    base,
    currReport,
    prevReport,
    comparisonFiles,
    logger,
    git,
  });

  return { ...diffOutput, newIssues };
}

type CollectPreviousReportArgs = RunOnProjectArgs & {
  base: GitBranch;
  ctx: CommandContext;
};

async function collectPreviousReport(
  args: CollectPreviousReportArgs,
): Promise<string | null> {
  const { project, base, api, settings, ctx, git } = args;
  const logger = settings.logger;

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
  } else {
    await git.fetch('origin', base.ref, ['--depth=1']);
    await git.checkout(['-f', base.ref]);
    logger.info(`Switched to base branch ${base.ref}`);

    try {
      await runPrintConfig({ ...ctx, silent: !settings.debug });
      logger.debug(
        `Executing print-config verified code-pushup installed in base branch ${base.ref}`,
      );
    } catch (error) {
      logger.debug(`Error from print-config - ${stringifyError(error)}`);
      logger.info(
        `Executing print-config failed, assuming code-pushup not installed in base branch ${base.ref} and skipping comparison`,
      );
      return null;
    }

    const { jsonFilePath: prevReportPath } = await runCollect(ctx);
    const prevReport = await fs.readFile(prevReportPath, 'utf8');
    logger.debug(`Collected previous report at ${prevReportPath}`);

    await git.checkout(['-f', '-']);
    logger.info('Switched back to PR/MR branch');

    return prevReport;
  }
}

async function findNewIssues(args: {
  base: GitBranch;
  currReport: string;
  prevReport: string;
  comparisonFiles: PersistedCliFiles;
  logger: Logger;
  git: SimpleGit;
}): Promise<SourceFileIssue[]> {
  const { base, currReport, prevReport, comparisonFiles, logger, git } = args;

  await git.fetch('origin', base.ref, ['--depth=1']);
  const reportsDiff = await fs.readFile(comparisonFiles.jsonFilePath, 'utf8');
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
