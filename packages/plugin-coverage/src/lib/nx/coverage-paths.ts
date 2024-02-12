import type { ProjectGraphProjectNode } from '@nx/devkit';
import { join } from 'node:path';
import { CoverageResult } from '../config';

/**
 *
 * @param coverageFolder root folder containing all coverage results
 * @param targets nx targets to be used for measuring coverage, test by default
 * @returns An array of coverage result information for the coverage plugin.
 */
export async function getNxCoveragePaths(
  targets: string[] = ['test'],
): Promise<CoverageResult[]> {
  const { createProjectGraphAsync } = await import('@nx/devkit');
  const { nodes } = await createProjectGraphAsync({ exitOnError: false });

  const coverageResults = targets.map(target => {
    const relevantNodes = Object.values(nodes).filter(graph =>
      hasNxTarget(graph, target),
    );

    return relevantNodes
      .map(node => node.data)
      .map<CoverageResult>(projectConfig => {
        const { reportsDirectory } = projectConfig.targets?.[target]
          ?.options as {
          reportsDirectory: string;
        };

        const rootToReportsDir = join(projectConfig.root, reportsDirectory);

        return {
          pathToProject: projectConfig.root,
          resultsPath: join(rootToReportsDir, 'lcov.info'),
        };
      });
  });

  return coverageResults.flat();
}

function hasNxTarget(
  project: ProjectGraphProjectNode,
  target: string,
): boolean {
  return project.data.targets != null && target in project.data.targets;
}
