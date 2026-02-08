import { type Tree, logger } from '@nx/devkit';
import { createProjectGraphAsync, joinPathFragments } from '@nx/devkit';
import type { ProjectGraphProjectNode } from '@nx/devkit';
import ansis from 'ansis';
import { minimatch } from 'minimatch';
// Note: Internal Nx API - may change between versions
import { findMatchingProjects } from 'nx/src/utils/find-matching-projects';
import { type BaselineConfig } from '../../baseline/baseline.json';
import type { Diagnostic } from '../../baseline/baseline.json';
import { renderTreeDiff } from '../../baseline/diff';
import { projectFilter } from '../../baseline/utils';
import { loadBaselineRc } from './load-baseline-rc';

const shouldApplyBaseline = (
  baseline: BaselineConfig,
  project: ProjectGraphProjectNode,
): boolean => {
  // Check projects filter first (supports Nx patterns)
  if (baseline.projects && baseline.projects.length > 0) {
    // Create a minimal project map for pattern matching
    const projectMap = { [project.name]: project };
    const matchedProjects = findMatchingProjects(baseline.projects, projectMap);
    return matchedProjects.includes(project.name);
  }

  // Check if matcher contains a path pattern that should match project root
  if (baseline.matcher) {
    const matchers = Array.isArray(baseline.matcher)
      ? baseline.matcher
      : [baseline.matcher];
    const hasPathPattern = matchers.some(m => m.includes('/'));

    if (hasPathPattern) {
      // At least one matcher has a path - check if any match the project root
      const projectRoot = project.data.root;
      const matchesProjectRoot = matchers.some(matcher => {
        if (!matcher.includes('/')) {
          return true; // No path in this matcher, don't filter
        }

        // Build the full path that would result from this project + filename
        const fileName = baseline.filePath || matcher.split('/').pop() || '';
        const fullPath = joinPathFragments(projectRoot, fileName);

        // Check if the full path matches the pattern
        return minimatch(fullPath, matcher, { matchBase: true });
      });

      if (!matchesProjectRoot) {
        return false; // Path pattern doesn't match this project
      }
    }
  }

  // Fall back to tags filter
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
  formattedContent?: string;
};

export const syncBaseline = async (tree: Tree) => {
  const graph = await createProjectGraphAsync();
  const baselines = await loadBaselineRc();

  // Track which baseline produced which diagnostics
  const baselineDiagnostics: BaselineDiagnostics[] = [];

  Object.values(graph.nodes)
    .filter(project => projectFilter(project))
    .forEach(project => {
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
            formattedContent?: string;
          } =
            result && typeof result === 'object' && 'diagnostics' in result
              ? result
              : {
                  diagnostics: result as any[],
                  matchedFile: undefined,
                  renamedFrom: undefined,
                  baselineValue: undefined,
                  formattedContent: undefined,
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
              formattedContent: syncResult.formattedContent,
            });
          }
        });
    });

  if (baselineDiagnostics.length === 0) {
    return {};
  }

  // Generate diffs for each file that's out of sync
  const diffSections: string[] = [];

  for (const item of baselineDiagnostics) {
    // Determine the final file path (new filename if renamed)
    const newFilePath = joinPathFragments(
      item.projectRoot,
      item.baseline.filePath || 'tsconfig.json',
    );

    // Determine the old file path (for renamed files)
    const oldFilePath = item.renamedFrom
      ? joinPathFragments(item.projectRoot, item.renamedFrom)
      : newFilePath;

    // Check if we have a baselineValue to show the diff
    if (item.baselineValue) {
      const newContent =
        item.formattedContent || JSON.stringify(item.baselineValue, null, 2);

      // Build title with rename info if applicable
      const displayFileName = item.baseline.filePath || 'tsconfig.json';
      let title = `${ansis.cyan.bold('●')} ${ansis.bold(item.projectName)} - ${displayFileName}`;
      if (item.renamedFrom) {
        const oldFileName =
          item.renamedFrom.split('/').pop() || item.renamedFrom;
        title += ansis.yellow(` (renamed from ${oldFileName})`);
      }

      // Show diff using the OLD file (before rename) or existing file
      const diffSourcePath = tree.exists(oldFilePath)
        ? oldFilePath
        : newFilePath;

      if (tree.exists(diffSourcePath)) {
        const diff = renderTreeDiff(tree, diffSourcePath, newContent, {
          title,
        });

        if (diff) {
          diffSections.push(diff);
        }

        // Apply the changes to the tree
        if (item.renamedFrom && oldFilePath !== newFilePath) {
          // Rename: delete old file and create new one
          if (tree.exists(oldFilePath)) {
            tree.delete(oldFilePath);
          }
        }
        tree.write(newFilePath, newContent);
      } else {
        // File doesn't exist yet - show as new file and create it
        let message = `${title}\n`;
        if (item.renamedFrom) {
          const oldFileName =
            item.renamedFrom.split('/').pop() || item.renamedFrom;
          message += ansis.yellow(`Renamed from ${oldFileName}\n`);
        }
        message += ansis.green(
          `Will create new file with ${item.diagnostics.length} baseline settings`,
        );

        diffSections.push(message);
        tree.write(newFilePath, newContent);
      }
    } else if (item.diagnostics.length > 0) {
      // Fallback: show diagnostic count if no baselineValue
      diffSections.push(
        `${ansis.cyan.bold('●')} ${ansis.bold(item.projectName)} - ${item.matchedFile || item.baseline.filePath}\n` +
          ansis.yellow(`${item.diagnostics.length} change(s) needed`),
      );
    }
  }

  const outOfSyncMessage =
    diffSections.length > 0
      ? diffSections.join('\n\n' + ansis.gray('─'.repeat(60)) + '\n\n')
      : 'Files are out of sync (details unavailable)';

  // Log the diff output for users to see what's out of sync
  if (outOfSyncMessage) {
    logger.info('\n' + outOfSyncMessage);
  }

  return {
    outOfSyncMessage,
  };
};

export default syncBaseline;
