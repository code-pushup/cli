import type { ProjectGraphProjectNode, TargetConfiguration } from '@nx/devkit';
import chalk from 'chalk';
import { join } from 'node:path';
import { ui } from '@code-pushup/utils';
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

  const coverageResults = targets.map(target => {
    const relevantNodes = Object.values(nodes).filter(graph =>
      hasNxTarget(graph, target),
    );

    return relevantNodes.map<CoverageResult>(({ name, data }) => {
      const targetConfig = data.targets?.[target] as TargetConfiguration;
      const coveragePath = getCoveragePathForTarget(target, targetConfig, name);
      const rootToReportsDir = join(data.root, coveragePath);

      if (verbose) {
        ui().logger.info(`- ${name}: ${target}`);
      }
      return {
        pathToProject: data.root,
        resultsPath: join(rootToReportsDir, 'lcov.info'),
      };
    });
  });

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

function getCoveragePathForTarget(
  target: string,
  targetConfig: TargetConfiguration,
  projectName: string,
): string {
  if (targetConfig.executor?.includes('@nx/vite')) {
    const { reportsDirectory } = targetConfig.options as {
      reportsDirectory?: string;
    };

    if (reportsDirectory == null) {
      throw new Error(
        `Coverage configuration not found for target ${target} in ${projectName}. Define your Vitest coverage directory in the reportsDirectory option.`,
      );
    }

    return reportsDirectory;
  }

  if (targetConfig.executor?.includes('@nx/jest')) {
    const { coverageDirectory } = targetConfig.options as {
      coverageDirectory?: string;
    };

    if (coverageDirectory == null) {
      throw new Error(
        `Coverage configuration not found for target ${target} in ${projectName}. Define your Jest coverage directory in the coverageDirectory option.`,
      );
    }
    return coverageDirectory;
  }

  throw new Error(
    `Unsupported executor ${targetConfig.executor}. @nx/vite and @nx/jest are currently supported.`,
  );
}
