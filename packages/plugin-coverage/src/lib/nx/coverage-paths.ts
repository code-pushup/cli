/// <reference types="vitest" />
import type {
  ProjectConfiguration,
  ProjectGraphProjectNode,
  Tree,
} from '@nx/devkit';
import type { JestExecutorOptions } from '@nx/jest/src/executors/jest/schema';
import type { VitestExecutorOptions } from '@nx/vite/executors';
import { bold } from 'ansis';
import path from 'node:path';
import { importModule, stringifyError, ui } from '@code-pushup/utils';
import type { CoverageResult } from '../config.js';

/**
 * Resolves the cached project graph for the current Nx workspace.
 * First tries to read cache and if not possible, go for the async creation.
 */
async function resolveCachedProjectGraph() {
  const { readCachedProjectGraph, createProjectGraphAsync } = await import(
    '@nx/devkit'
  );
  try {
    return readCachedProjectGraph();
  } catch (error) {
    ui().logger.info(
      `Could not read cached project graph, falling back to async creation.
      ${stringifyError(error)}`,
    );
    return await createProjectGraphAsync({ exitOnError: false });
  }
}

/**
 * @param targets nx targets to be used for measuring coverage, test by default
 * @returns An array of coverage result information for the coverage plugin.
 */
export async function getNxCoveragePaths(
  targets: string[] = ['test'],
  verbose?: boolean,
): Promise<CoverageResult[]> {
  if (verbose) {
    ui().logger.info(
      bold('💡 Gathering coverage from the following nx projects:'),
    );
  }

  const { nodes } = await resolveCachedProjectGraph();

  const coverageResults = await Promise.all(
    targets.map(async target => {
      const relevantNodes = Object.values(nodes).filter(graph =>
        hasNxTarget(graph, target),
      );

      return await Promise.all(
        relevantNodes.map<Promise<CoverageResult>>(async ({ name, data }) => {
          const coveragePaths = await getCoveragePathsForTarget(data, target);
          if (verbose) {
            ui().logger.info(`- ${name}: ${target}`);
          }
          return coveragePaths;
        }),
      );
    }),
  );

  if (verbose) {
    ui().logger.info('\n');
  }

  return coverageResults.flat();
}

function hasNxTarget(
  project: ProjectGraphProjectNode,
  target: string,
): boolean {
  return project.data.targets != null && target in project.data.targets;
}

export type VitestCoverageConfig = {
  test: {
    coverage?: {
      enabled?: boolean;
      provider?: string;
      reporter?: string[];
      reportsDirectory?: string;
      include?: string[];
      exclude?: string[];
    };
  };
};

export type JestCoverageConfig = {
  coverageDirectory?: string;
  coverageReporters?: string[];
};

export async function getCoveragePathsForTarget(
  project: ProjectConfiguration,
  target: string,
): Promise<CoverageResult> {
  const targetConfig = project.targets?.[target];

  if (!targetConfig) {
    throw new Error(
      `No configuration found for target ${target} in project ${project.name}`,
    );
  }

  if (targetConfig.executor?.includes('@nx/vite')) {
    return getCoveragePathForVitest(
      targetConfig.options as VitestExecutorOptions,
      project,
      target,
    );
  }

  if (targetConfig.executor?.includes('@nx/jest')) {
    return getCoveragePathForJest(
      targetConfig.options as JestExecutorOptions,
      project,
      target,
    );
  }

  throw new Error(
    `Unsupported executor ${targetConfig.executor}. Only @nx/vite and @nx/jest are currently supported.`,
  );
}

export async function getCoveragePathForVitest(
  options: VitestExecutorOptions,
  project: ProjectConfiguration,
  target: string,
) {
  const { normalizeViteConfigFilePathWithTree } = await import('@nx/vite');
  const config = normalizeViteConfigFilePathWithTree(
    // HACK: only tree.exists is called, so injecting existSync from node:fs instead
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    { exists: (await import('node:fs')).existsSync } as Tree,
    project.root,
    options.configFile,
  );
  if (!config) {
    throw new Error(
      `Could not find Vitest config file for target ${target} in project ${project.name}`,
    );
  }

  const vitestConfig = await importModule<VitestCoverageConfig>({
    filepath: config,
    format: 'esm',
  });

  const reportsDirectory =
    options.reportsDirectory ?? vitestConfig.test.coverage?.reportsDirectory;
  const reporter = vitestConfig.test.coverage?.reporter;

  if (reportsDirectory == null) {
    throw new Error(
      `Vitest coverage configuration at ${config} does not include coverage path for target ${target} in project ${project.name}. Add the path under coverage > reportsDirectory.`,
    );
  }

  if (!reporter?.some(format => format === 'lcov' || format === 'lcovonly')) {
    throw new Error(
      `Vitest coverage configuration at ${config} does not include LCOV report format for target ${target} in project ${project.name}. Add 'lcov' format under coverage > reporter.`,
    );
  }

  if (path.isAbsolute(reportsDirectory)) {
    return path.join(reportsDirectory, 'lcov.info');
  }
  return {
    pathToProject: project.root,
    resultsPath: path.join(project.root, reportsDirectory, 'lcov.info'),
  };
}

export async function getCoveragePathForJest(
  options: JestExecutorOptions,
  project: ProjectConfiguration,
  target: string,
) {
  const { jestConfig } = options;

  const testConfig = await importModule<JestCoverageConfig>({
    filepath: jestConfig,
  });
  const { coverageDirectory, coverageReporters } = {
    ...testConfig,
    ...options,
  };

  if (coverageDirectory == null) {
    throw new Error(
      `Jest coverage configuration at ${jestConfig} does not include coverage path for target ${target} in ${project.name}. Add the path under coverageDirectory.`,
    );
  }

  if (!coverageReporters?.includes('lcov') && !('preset' in testConfig)) {
    throw new Error(
      `Jest coverage configuration at ${jestConfig} does not include LCOV report format for target ${target} in ${project.name}. Add 'lcov' format under coverageReporters.`,
    );
  }

  if (path.isAbsolute(coverageDirectory)) {
    return path.join(coverageDirectory, 'lcov.info');
  }
  return path.join(project.root, coverageDirectory, 'lcov.info');
}
