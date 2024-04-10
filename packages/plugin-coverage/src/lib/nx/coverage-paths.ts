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
          const coveragePath = await getCoveragePathForTarget(
            target,
            targetConfig,
            name,
          );
          const rootToReportsDir = join(data.root, coveragePath);

          if (verbose) {
            ui().logger.info(`- ${name}: ${target}`);
          }
          return {
            pathToProject: data.root,
            resultsPath: join(rootToReportsDir, 'lcov.info'),
          };
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

export async function getCoveragePathForTarget(
  target: string,
  targetConfig: TargetConfiguration,
  projectName: string,
): Promise<string> {
  const { config } = targetConfig.options as { config: string };

  if (targetConfig.executor?.includes('@nx/vite')) {
    const testConfig = await importEsmModule<VitestCoverageConfig>({
      filepath: config,
    });

    const reportsDirectory = testConfig.test.coverage?.reportsDirectory;
    const reporter = testConfig.test.coverage?.reporter;

    if (reportsDirectory == null) {
      throw new Error(
        `Vitest coverage configuration at ${config} does not include coverage path for target ${target} in ${projectName}. Add the path under coverage > reportsDirectory.`,
      );
    }

    if (!reporter?.includes('lcov')) {
      throw new Error(
        `Vitest coverage configuration at ${config} does not include LCOV report format for target ${target} in ${projectName}. Add 'lcov' format under coverage > reporter.`,
      );
    }

    return reportsDirectory;
  }

  if (targetConfig.executor?.includes('@nx/jest')) {
    const testConfig = await importEsmModule<JestCoverageConfig>({
      filepath: config,
    });

    const coverageDirectory = testConfig.coverageDirectory;

    if (coverageDirectory == null) {
      throw new Error(
        `Jest coverage configuration at ${config} does not include coverage path for target ${target} in ${projectName}. Add the path under coverageDirectory.`,
      );
    }

    if (!testConfig.coverageReporters?.includes('lcov')) {
      throw new Error(
        `Jest coverage configuration at ${config} does not include LCOV report format for target ${target} in ${projectName}. Add 'lcov' format under coverageReporters.`,
      );
    }
    return coverageDirectory;
  }

  throw new Error(
    `Unsupported executor ${targetConfig.executor}. @nx/vite and @nx/jest are currently supported.`,
  );
}
