import type {
  ProjectGraph,
  ProjectGraphDependency,
  ProjectGraphProjectNode,
} from '@nx/devkit';

export function filterProjectGraph(
  projectGraph: ProjectGraph,
  exclude: string[] = [],
): ProjectGraph {
  const filteredNodes: Record<string, ProjectGraphProjectNode> = Object.entries(
    projectGraph.nodes,
  ).reduce(
    (acc, [projectName, projectNode]) =>
      exclude.includes(projectName)
        ? acc
        : { ...acc, [projectName]: projectNode },
    {},
  );
  const filteredDependencies: Record<string, ProjectGraphDependency[]> =
    Object.entries(projectGraph.dependencies).reduce(
      (acc, [key, deps]) =>
        exclude.includes(key) ? acc : { ...acc, [key]: deps },
      {},
    );
  return {
    nodes: filteredNodes,
    dependencies: filteredDependencies,
    version: projectGraph.version,
  };
}
