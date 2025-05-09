import type {
  CoverageTree,
  CoverageTreeMissingLOC,
  CoverageTreeNode,
} from '@code-pushup/models';
import { splitFilePath } from './file-system.js';
import { formatGitPath } from './git/git.js';

type FileCoverage = {
  path: string;
  total: number;
  hits: number;
  missing: CoverageTreeMissingLOC[];
};

// TODO: calculate folder coverage
const COVERAGE_PLACEHOLDER = -1;

export function filesCoverageToTree(
  files: FileCoverage[],
  gitRoot: string,
  title?: string,
): CoverageTree {
  const normalizedFiles = files.map(file => ({
    ...file,
    path: formatGitPath(file.path, gitRoot),
  }));

  const root = normalizedFiles.reduce<CoverageTreeNode>(
    (acc: CoverageTreeNode, { path: filePath, ...coverage }) => {
      const { folders, file } = splitFilePath(filePath);
      return addNode(acc, folders, file, coverage);
    },
    { name: '.', values: { coverage: COVERAGE_PLACEHOLDER } },
  );

  return {
    type: 'coverage',
    ...(title && { title }),
    root,
  };
}

function addNode(
  root: CoverageTreeNode,
  folders: string[],
  file: string,
  coverage: Omit<FileCoverage, 'path'>,
): CoverageTreeNode {
  const folder = folders[0];

  if (folder) {
    if (root.children?.some(({ name }) => name === folder)) {
      return {
        ...root,
        children: root.children.map(node =>
          node.name === folder
            ? addNode(node, folders.slice(1), file, coverage)
            : node,
        ),
      };
    }
    return {
      ...root,
      children: [
        ...(root.children ?? []),
        addNode(
          { name: folder, values: { coverage: COVERAGE_PLACEHOLDER } },
          folders.slice(1),
          file,
          coverage,
        ),
      ],
    };
  }

  return {
    ...root,
    children: [
      ...(root.children ?? []),
      {
        name: file,
        values: {
          coverage: calculateCoverage(coverage),
          missing: coverage.missing,
        },
      },
    ],
  };
}

function calculateCoverage({
  hits,
  total,
}: Pick<FileCoverage, 'hits' | 'total'>): number {
  if (total === 0) {
    return 1;
  }
  return hits / total;
}
