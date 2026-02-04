import { type Tree } from '@nx/devkit';
import { createProjectGraphAsync, joinPathFragments } from '@nx/devkit';
import type { ProjectGraphProjectNode } from '@nx/devkit';
import { type TsBase } from '../../baseline.tsconfig';
import type { Diagnostic } from '../../baseline.tsconfig';
import { createTsconfigFormatter } from '../../formatter';
import { loadBaselineRc } from './load-baseline-rc';

const shouldApplyBaseline = (
  baseline: TsBase,
  project: ProjectGraphProjectNode,
): boolean => {
  if (!baseline.tags || baseline.tags.length === 0) {
    return true; // No filter, apply to all
  }
  const projectTags = project.data.tags || [];
  return baseline.tags.some(tag => projectTags.includes(tag)); // ANY match
};

type BaselineDiagnostics = {
  baseline: TsBase;
  diagnostics: Array<{
    path: string;
    message: string;
    before?: unknown;
    after?: unknown;
  }>;
  matchedFile?: string;
  renamedFrom?: string;
  projectName: string;
};

export const syncBaseline = async (tree: Tree) => {
  const graph = await createProjectGraphAsync();
  const baselines = await loadBaselineRc();

  // Track which baseline produced which diagnostics
  const baselineDiagnostics: BaselineDiagnostics[] = [];

  Object.values(graph.nodes).forEach(project => {
    const root = project.data.root;

    const scopedTree = {
      ...tree,
      exists: (p: string) => tree.exists(joinPathFragments(root, p)),
      read: (p: string) => tree.read(joinPathFragments(root, p)),
      write: (p: string, c: string) =>
        tree.write(joinPathFragments(root, p), c),
      delete: (p: string) => tree.delete(joinPathFragments(root, p)),
    };

    // Apply baselines that match project tags and collect diagnostics
    baselines
      .filter(baseline => shouldApplyBaseline(baseline, project))
      .forEach(baseline => {
        const result = baseline.sync(scopedTree as any);
        const syncResult =
          result && typeof result === 'object' && 'diagnostics' in result
            ? result
            : {
                diagnostics: result as any[],
                matchedFile: undefined,
                renamedFrom: undefined,
              };
        const diagnostics = syncResult.diagnostics.map(d => ({
          ...d,
          path: `${project.name}:${d.path}`,
        }));

        if (diagnostics.length > 0) {
          baselineDiagnostics.push({
            baseline,
            diagnostics,
            matchedFile: syncResult.matchedFile,
            renamedFrom: syncResult.renamedFrom,
            projectName: project.name,
          });
        }
      });
  });

  if (baselineDiagnostics.length === 0) {
    return {};
  }

  // Group by project, then by file
  const groupedByProject = new Map<
    string,
    Map<string, BaselineDiagnostics[]>
  >();

  for (const item of baselineDiagnostics) {
    if (!groupedByProject.has(item.projectName)) {
      groupedByProject.set(item.projectName, new Map());
    }
    const projectFiles = groupedByProject.get(item.projectName)!;
    const fileKey =
      item.matchedFile || item.baseline.filePath || 'tsconfig.json';
    if (!projectFiles.has(fileKey)) {
      projectFiles.set(fileKey, []);
    }
    projectFiles.get(fileKey)!.push(item);
  }

  // Format each project
  const formattedSections: string[] = [];
  for (const [projectName, projectFiles] of groupedByProject) {
    // Get formatter from first baseline (or use default)
    const firstItem = Array.from(projectFiles.values())[0]?.[0];
    const formatter =
      firstItem?.baseline.formatter || createTsconfigFormatter();

    // Build file diagnostics
    const fileDiagnostics: Array<{
      file: string;
      pattern: string;
      diagnostics: Diagnostic[];
      renamedFrom?: string;
    }> = [];

    for (const [filePath, items] of projectFiles) {
      const allDiagnostics = items.flatMap(item => item.diagnostics);
      if (allDiagnostics.length > 0) {
        // Get renamedFrom from first item (all items for same file should have same renamedFrom)
        const renamedFrom = items[0]?.renamedFrom;
        fileDiagnostics.push({
          file: filePath,
          pattern: items[0]?.baseline.filePath || filePath,
          diagnostics: allDiagnostics,
          renamedFrom,
        });
      }
    }

    // Use formatByFiles if available, otherwise fall back to format
    if (formatter.formatByFiles && fileDiagnostics.length > 0) {
      const formatted = formatter.formatByFiles(fileDiagnostics, projectName);
      if (formatted) {
        formattedSections.push(formatted);
      }
    } else {
      // Fall back to old format grouped by baseline type
      const groupedByType = new Map<string, BaselineDiagnostics[]>();
      for (const item of Array.from(projectFiles.values()).flat()) {
        const typeKey = item.baseline.filePath || 'tsconfig.json';
        if (!groupedByType.has(typeKey)) {
          groupedByType.set(typeKey, []);
        }
        groupedByType.get(typeKey)!.push(item);
      }

      for (const [typeKey, items] of groupedByType) {
        if (items.length === 0) continue;
        const allDiagnostics = items.flatMap(item => item.diagnostics);
        const filePath = items[0]?.baseline.filePath || typeKey;
        const formatted = formatter.format(allDiagnostics, filePath);
        if (formatted) {
          formattedSections.push(formatted);
        }
      }
    }
  }

  // Combine sections with dividers
  const outOfSyncMessage = formattedSections.join('\n---\n');

  return {
    outOfSyncMessage,
  };
};

export default syncBaseline;
