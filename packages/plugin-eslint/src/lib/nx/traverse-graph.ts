import type { ProjectGraph } from '@nx/devkit';

export function findAllDependencies(
  entry: string,
  projectGraph: ProjectGraph,
): ReadonlySet<string> {
  const results = new Set<string>();
  const queue = [entry];

  // eslint-disable-next-line functional/no-loop-statements
  while (queue.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, functional/immutable-data
    const source = queue.shift()!;
    const dependencies = projectGraph.dependencies[source];

    // eslint-disable-next-line functional/no-loop-statements
    for (const { target } of dependencies ?? []) {
      // skip duplicates (cycle in graph)
      if (!results.has(target) && target !== entry) {
        results.add(target);
        // eslint-disable-next-line functional/immutable-data
        queue.push(target);
      }
    }
  }

  return results;
}
