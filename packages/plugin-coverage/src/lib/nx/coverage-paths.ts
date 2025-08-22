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
import { importModule, ui } from '@code-pushup/utils';
import type { CoverageResult } from '../config.js';

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

  const { createProjectGraphAsync } = await import('@nx/devkit');
  const { nodes } = await createProjectGraphAsync({ exitOnError: false });

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
      reporter?: string[];
      reportsDirectory?: string;
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
  const {
    default: { normalizeViteConfigFilePathWithTree },
  } = await import('@nx/vite');
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

  const vitestConfigModule = await importModule<
    VitestCoverageConfig & { default?: unknown }
  >({
    filepath: config,
    format: 'esm',
  });

  const vitestConfig = await extractVitestConfig(
    vitestConfigModule,
    target,
    project.name || 'unknown',
  );

  // Ensure vitestConfig.test.coverage exists
  if (!vitestConfig.test?.coverage) {
    ui().logger.warning(
      `No coverage configuration found for ${project.name}:${target}, providing defaults`,
    );
    vitestConfig.test = {
      ...vitestConfig.test,
      coverage: {
        reporter: ['text', 'lcov'],
        reportsDirectory: `../../coverage/${project.name}/${target.replace('-test', '-tests')}`,
      },
    };
  }

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

async function extractVitestConfig(
  vitestConfigModule: VitestCoverageConfig & { default?: unknown },
  target: string,
  projectName: string,
): Promise<VitestCoverageConfig> {
  if (typeof vitestConfigModule.default === 'function') {
    try {
      const result = vitestConfigModule.default();
      if (result && typeof result === 'object') {
        // If coverage is missing, provide a minimal default configuration
        if (!result.test?.coverage) {
          ui().logger.warning(
            `Vitest config for ${projectName}:${target} is missing coverage configuration, using defaults`,
          );
          result.test = {
            ...result.test,
            coverage: {
              reporter: ['text', 'lcov'],
              reportsDirectory: `../../coverage/${projectName}/${target.replace('-test', '-tests')}`,
            },
          };
        }
        return result as VitestCoverageConfig;
      }
      throw new Error('Function export did not return valid configuration');
    } catch (error) {
      throw new Error(
        `Could not execute Vitest config function for target ${target} in project ${projectName}: ${error}`,
      );
    }
  }

  // If it's not a function, check if it has the required structure
  if (vitestConfigModule && typeof vitestConfigModule === 'object') {
    if (!vitestConfigModule.test?.coverage) {
      ui().logger.warning(
        `Vitest config for ${projectName}:${target} is missing coverage configuration, using defaults`,
      );
      vitestConfigModule.test = {
        ...vitestConfigModule.test,
        coverage: {
          reporter: ['text', 'lcov'],
          reportsDirectory: `../../coverage/${projectName}/${target.replace('-test', '-tests')}`,
        },
      };
    }
    return vitestConfigModule;
  }

  return vitestConfigModule;
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
