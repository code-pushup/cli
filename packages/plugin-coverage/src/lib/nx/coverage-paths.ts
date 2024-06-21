/// <reference types="vitest" />
import type { ProjectGraphProjectNode, TargetConfiguration } from '@nx/devkit';
import chalk from 'chalk';
import { join } from 'node:path';
import { importEsmModule, ui } from '@code-pushup/utils';
import { CoverageResult } from '../config';

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
      chalk.bold('💡 Gathering coverage from the following nx projects:'),
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
          const targetConfig = data.targets?.[target] as TargetConfiguration;
          const coveragePaths = await getCoveragePathsForTarget(
            targetConfig,
            data.root,
            `${target} in ${name}`,
          );

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
  targetConfig: TargetConfiguration,
  pathToRoot: string,
  targetContext: string,
): Promise<CoverageResult> {
  const { config } = targetConfig.options as { config: string };

  if (targetConfig.executor?.includes('@nx/vite')) {
    return await getCoveragePathForVitest(config, pathToRoot, targetContext);
  }

  if (targetConfig.executor?.includes('@nx/jest')) {
    return await getCoveragePathForJest(config, pathToRoot, targetContext);
  }

  throw new Error(
    `Unsupported executor ${targetConfig.executor}. @nx/vite and @nx/jest are currently supported.`,
  );
}

export async function getCoveragePathForVitest(
  pathToConfig: string,
  pathToRoot: string,
  context: string,
) {
  const vitestConfig = await importEsmModule<VitestCoverageConfig>({
    filepath: pathToConfig,
    format: 'esm',
  });

  const reportsDirectory = vitestConfig.test.coverage?.reportsDirectory;
  const reporter = vitestConfig.test.coverage?.reporter;

  if (reportsDirectory == null) {
    throw new Error(
      `Vitest coverage configuration at ${pathToConfig} does not include coverage path for target ${context}. Add the path under coverage > reportsDirectory.`,
    );
  }

  if (!reporter?.includes('lcov')) {
    throw new Error(
      `Vitest coverage configuration at ${pathToConfig} does not include LCOV report format for target ${context}. Add 'lcov' format under coverage > reporter.`,
    );
  }

  return {
    pathToProject: pathToRoot,
    resultsPath: join(pathToRoot, reportsDirectory, 'lcov.info'),
  };
}

export async function getCoveragePathForJest(
  pathToConfig: string,
  pathToRoot: string,
  context: string,
) {
  const testConfig = await importEsmModule<JestCoverageConfig>({
    filepath: pathToConfig,
    format: 'cjs',
  });

  const coverageDirectory = testConfig.coverageDirectory;

  if (coverageDirectory == null) {
    throw new Error(
      `Jest coverage configuration at ${pathToConfig} does not include coverage path for target ${context}. Add the path under coverageDirectory.`,
    );
  }

  if (!testConfig.coverageReporters?.includes('lcov')) {
    throw new Error(
      `Jest coverage configuration at ${pathToConfig} does not include LCOV report format for target ${context}. Add 'lcov' format under coverageReporters.`,
    );
  }
  return join(pathToRoot, coverageDirectory, 'lcov.info');
}
