import { type Tree } from '@nx/devkit';
import { createProjectGraphAsync, joinPathFragments } from '@nx/devkit';
import { diagnosticsToMessage } from '../../baseline.tsconfig';
import { loadBaselineRc } from './load-baseline-rc';

export const syncBaseline = async (tree: Tree) => {
  const graph = await createProjectGraphAsync();
  const baselines = await loadBaselineRc();

  const diagnostics = Object.values(graph.nodes).flatMap(project => {
    const root = project.data.root;

    const scopedTree = {
      ...tree,
      exists: (p: string) => tree.exists(joinPathFragments(root, p)),
      read: (p: string) => tree.read(joinPathFragments(root, p)),
      write: (p: string, c: string) =>
        tree.write(joinPathFragments(root, p), c),
    };

    // Apply all baselines to each project and collect diagnostics
    return baselines.flatMap(baseline =>
      baseline.sync(scopedTree as any).map(d => ({
        ...d,
        path: `${project.name}:${d.path}`,
      })),
    );
  });

  return diagnostics.length
    ? {
        outOfSyncMessage: diagnosticsToMessage(
          diagnostics,
          'tsconfig.lib.json',
        ),
      }
    : {};
};

export default syncBaseline;
