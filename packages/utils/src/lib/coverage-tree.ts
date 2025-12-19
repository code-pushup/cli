import type {
  CoverageTree,
  CoverageTreeMissingLOC,
  CoverageTreeNode,
} from '@code-pushup/models';
import { splitFilePath } from './file-system.js';
import { formatGitPath } from './git/git.js';

export type FileCoverage = {
  path: string;
  total: number;
  covered: number;
  missing: CoverageTreeMissingLOC[];
};

type CoverageStats = Pick<FileCoverage, 'covered' | 'total'>;

type FileTree = FolderNode | FileNode;

type FileNode = FileCoverage & {
  name: string;
};

type FolderNode = {
  name: string;
  children: FileTree[];
};

export function filesCoverageToTree(
  files: FileCoverage[],
  gitRoot: string,
  title?: string,
): CoverageTree {
  const normalizedFiles = files.map(file => ({
    ...file,
    path: formatGitPath(file.path, gitRoot),
  }));

  const filesTree = normalizedFiles.reduce<FileTree>(
    (acc, coverage) => {
      const { folders, file } = splitFilePath(coverage.path);
      return addNode(acc, folders, file, coverage);
    },
    { name: '.', children: [] },
  );

  const coverageTree = calculateTreeCoverage(filesTree);
  const root = sortCoverageTree(coverageTree);

  return {
    type: 'coverage',
    ...(title && { title }),
    root,
  };
}

function addNode(
  root: FileTree,
  folders: string[],
  file: string,
  coverage: FileCoverage,
): FileTree {
  const folder = folders[0];
  const rootChildren = 'children' in root ? root.children : [];

  if (folder) {
    if (rootChildren.some(({ name }) => name === folder)) {
      return {
        ...root,
        children: rootChildren.map(node =>
          node.name === folder
            ? addNode(node, folders.slice(1), file, coverage)
            : node,
        ),
      };
    }
    return {
      ...root,
      children: [
        ...rootChildren,
        addNode(
          { name: folder, children: [] },
          folders.slice(1),
          file,
          coverage,
        ),
      ],
    };
  }

  return {
    ...root,
    children: [...rootChildren, { ...coverage, name: file }],
  };
}

function calculateTreeCoverage(root: FileTree): CoverageTreeNode {
  if ('children' in root) {
    const stats = aggregateChildCoverage(root.children);
    const coverage = calculateCoverage(stats);
    return {
      name: root.name,
      values: { coverage },
      children: root.children.map(calculateTreeCoverage),
    };
  }

  return {
    name: root.name,
    values: {
      coverage: calculateCoverage(root),
      missing: root.missing,
    },
  };
}

function calculateCoverage({ covered, total }: CoverageStats): number {
  if (total === 0) {
    return 1;
  }
  return covered / total;
}

function aggregateChildCoverage(
  nodes: FileTree[],
  cache = new Map<FolderNode, CoverageStats>(),
): CoverageStats {
  return nodes.reduce<CoverageStats>(
    (acc, node) => {
      const stats = getNodeCoverageStats(node, cache);
      return {
        covered: acc.covered + stats.covered,
        total: acc.total + stats.total,
      };
    },
    { covered: 0, total: 0 },
  );
}

function getNodeCoverageStats(
  node: FileTree,
  cache: Map<FolderNode, CoverageStats>,
): CoverageStats {
  if (!('children' in node)) {
    return node;
  }
  const cached = cache.get(node);
  if (cached) {
    return cached;
  }
  const stats = aggregateChildCoverage(node.children, cache);
  cache.set(node, stats);
  return stats;
}

function sortCoverageTree(root: CoverageTreeNode): CoverageTreeNode {
  if (!root.children?.length) {
    return root;
  }
  return {
    ...root,
    children: root.children
      .map(sortCoverageTree)
      .toSorted(
        (a, b) =>
          Number(Boolean(b.children?.length)) -
            Number(Boolean(a.children?.length)) || a.name.localeCompare(b.name),
      ),
  };
}

export function aggregateCoverageStats(files: CoverageStats[]): CoverageStats {
  return files.reduce<CoverageStats>(
    (acc, file) => ({
      covered: acc.covered + file.covered,
      total: acc.total + file.total,
    }),
    { covered: 0, total: 0 },
  );
}
