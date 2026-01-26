import { type Tree } from '@nx/devkit';
import { createProjectGraphAsync, joinPathFragments } from '@nx/devkit';
import { tsconfigLibBase } from '../baseline/tsconfig-lib.baseline';
import { diagnosticsToMessage } from './diagnostics-to-message';

export const syncBaseline = async (tree: Tree) => {
  const graph = await createProjectGraphAsync();

  const diagnostics = Object.values(graph.nodes).flatMap(project => {
    const root = project.data.root;

    const scopedTree = {
      ...tree,
      exists: (p: string) => tree.exists(joinPathFragments(root, p)),
      read: (p: string) => tree.read(joinPathFragments(root, p)),
      write: (p: string, c: string) =>
        tree.write(joinPathFragments(root, p), c),
    };

    return tsconfigLibBase.sync(scopedTree as any).map(d => ({
      ...d,
      path: `${project.name}:${d.path}`,
    }));
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
