import { type Tree } from '@nx/devkit';
import { createProjectGraphAsync, joinPathFragments } from '@nx/devkit';
import type { ProjectGraphProjectNode } from '@nx/devkit';
import { type BaselineConfig } from '../../baseline/baseline.json';
import type { Diagnostic } from '../../baseline/baseline.json';
import { createTsconfigFormatter } from '../../baseline/formatter';
import { loadBaselineRc } from './load-baseline-rc';

const shouldApplyBaseline = (
  baseline: BaselineConfig,
  project: ProjectGraphProjectNode,
): boolean => {
  if (!baseline.tags || baseline.tags.length === 0) {
    return true; // No filter, apply to all
  }
  const projectTags = project.data.tags || [];
  return baseline.tags.some(tag => projectTags.includes(tag)); // ANY match
};

type BaselineDiagnostics = {
  baseline: BaselineConfig;
  diagnostics: Array<{
    path: string;
    message: string;
    before?: unknown;
    after?: unknown;
  }>;
  matchedFile?: string;
  renamedFrom?: string;
  projectName: string;
  projectRoot: string;
  baselineValue?: Record<string, unknown>;
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
      children: (p: string) => {
        const fullPath = p === '.' ? root : joinPathFragments(root, p);
        return tree.children(fullPath);
      },
    };

    // Apply baselines that match project tags and collect diagnostics
    baselines
      .filter(baseline => shouldApplyBaseline(baseline, project))
      .forEach(baseline => {
        const result = baseline.sync(scopedTree as any);
        const syncResult: {
          diagnostics: Diagnostic[];
          matchedFile?: string;
          renamedFrom?: string;
          baselineValue?: Record<string, unknown>;
        } =
          result && typeof result === 'object' && 'diagnostics' in result
            ? result
            : {
                diagnostics: result as any[],
                matchedFile: undefined,
                renamedFrom: undefined,
                baselineValue: undefined,
              };
        const diagnostics = syncResult.diagnostics.map(d => ({
          ...d,
          path: `${project.name}:${d.path}`,
        }));

        // Always include if there are diagnostics OR if baselineValue exists (to show baseline structure)
        if (diagnostics.length > 0 || syncResult.baselineValue) {
          baselineDiagnostics.push({
            baseline,
            diagnostics,
            matchedFile: syncResult.matchedFile,
            renamedFrom: syncResult.renamedFrom,
            projectName: project.name,
            projectRoot: root,
            baselineValue: syncResult.baselineValue,
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
    const projectRoot = firstItem?.projectRoot || '';

    // Build file diagnostics
    const fileDiagnostics: Array<{
      file: string;
      pattern: string;
      diagnostics: Diagnostic[];
      renamedFrom?: string;
      baselineValue?: Record<string, unknown>;
    }> = [];

    for (const [filePath, items] of projectFiles) {
      const allDiagnostics = items.flatMap(item => item.diagnostics);
      const baselineValue = items[0]?.baselineValue;
      // Include if there are diagnostics OR if there's a baselineValue to show
      if (allDiagnostics.length > 0 || baselineValue) {
        // Get renamedFrom from first item (all items for same file should have same renamedFrom)
        const renamedFrom = items[0]?.renamedFrom;
        const baseline = items[0]?.baseline;
        // file should be the final output filename (baseline.filePath)
        // pattern should be the original matcher pattern(s)
        const fileName = baseline?.filePath || filePath;
        const matcher = baseline?.matcher;
        const patternName = matcher
          ? Array.isArray(matcher)
            ? matcher.join(' | ')
            : matcher
          : fileName;
        fileDiagnostics.push({
          file: fileName,
          pattern: patternName,
          diagnostics: allDiagnostics,
          renamedFrom,
          baselineValue,
        });
      }
    }

    // Use formatByFiles if available, otherwise fall back to format
    if (formatter.formatByFiles && fileDiagnostics.length > 0) {
      const formatted = formatter.formatByFiles(
        fileDiagnostics,
        projectName,
        projectRoot,
      );
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
