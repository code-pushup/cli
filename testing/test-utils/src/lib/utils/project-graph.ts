import type {
  ProjectGraph,
  ProjectGraphDependency,
  ProjectGraphProjectNode,
} from '@nx/devkit';

/**
 * Converts nodes and dependencies into a ProjectGraph object for testing purposes.
 *
 * @param nodes - Array of ProjectGraphProjectNode representing project nodes.
 * @param dependencies - Optional dependencies for each project in a record format.
 * @returns A ProjectGraph object.
 */
export function toProjectGraph(
  nodes: ProjectGraphProjectNode[],
  dependencies?: Record<string, string[]>,
): ProjectGraph {
  return {
    nodes: Object.fromEntries(
      nodes.map(node => [
        node.name,
        {
          ...node,
          data: {
            targets: {
              lint: {
                options: {
                  lintFilePatterns: `${node.data.root}/**/*.ts`,
                },
              },
            },
            sourceRoot: `${node.data.root}/src`,
            ...node.data,
          },
        },
      ]),
    ),
    dependencies: Object.fromEntries(
      nodes.map(node => [
        node.name,
        dependencies?.[node.name]?.map(
          (target): ProjectGraphDependency => ({
            source: node.name,
            target,
            type: 'static',
          }),
        ) ?? [],
      ]),
    ),
  };
}
