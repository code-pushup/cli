import {
  type ProjectConfiguration,
  type TargetConfiguration,
  type Tree,
  createProjectGraphAsync,
  formatFiles,
  readJson,
  updateJson,
} from '@nx/devkit';
import * as path from 'node:path';
import {
  GENERATE_DOCS_TARGET_NAME,
  PATCH_TS_TARGET_NAME,
} from '../../plugin/constants.js';
import { DEFAULT_ZOD2MD_CONFIG_FILE_NAME } from '../configuration/constants.js';
import {
  type PluginDefinition,
  addZod2MdTransformToTsConfig,
  getFirstExistingTsConfig,
} from '../configuration/tsconfig.js';

const missingTsconfig = 'missing-tsconfig' as const;
const missingTarget = 'missing-target' as const;
const missingBuildDeps = 'missing-build-depends-on' as const;
const missingTsPlugin = 'missing-ts-plugin' as const;
type SyncIssueDataMap = {
  [missingTsconfig]: undefined;
  [missingTarget]: {
    target: string;
  };
  [missingBuildDeps]: {
    missing: readonly string[];
  };
  [missingTsPlugin]: undefined;
};
type SyncIssue = {
  [K in keyof SyncIssueDataMap]: {
    type: K;
    projectRoot: string;
    data: SyncIssueDataMap[K];
  };
}[keyof SyncIssueDataMap];
const REQUIRED_BUILD_DEPENDS_ON = [
  GENERATE_DOCS_TARGET_NAME,
  PATCH_TS_TARGET_NAME,
] as const;
const zod2mdConfigPath = (projectRoot: string) =>
  path.join(projectRoot, DEFAULT_ZOD2MD_CONFIG_FILE_NAME);
function isDependencyPresent(
  dependsOn: TargetConfiguration['dependsOn'] | undefined,
  targetName: string,
): boolean {
  if (!dependsOn) {
    return false;
  }
  const deps = Array.isArray(dependsOn) ? dependsOn : [dependsOn];
  return deps.some(dep => {
    if (typeof dep === 'string') {
      return dep === targetName || dep.endsWith(`:${targetName}`);
    }
    if (typeof dep === 'object' && dep != null && 'target' in dep) {
      return dep.target === targetName;
    }
    return false;
  });
}
const getMissingDependsOn = (
  dependsOn: TargetConfiguration['dependsOn'] | undefined,
  required: readonly string[],
): readonly string[] =>
  required.filter(target => !isDependencyPresent(dependsOn, target));
function hasZod2MdPlugin(
  tree: Tree,
  tsconfigPath: string | undefined,
): boolean {
  if (!tsconfigPath || !tree.exists(tsconfigPath)) {
    return false;
  }
  const tscJson = readJson<{
    compilerOptions?: {
      plugins?: PluginDefinition[];
    };
  }>(tree, tsconfigPath);
  const plugins = (tscJson.compilerOptions?.plugins ??
    []) as PluginDefinition[];
  return plugins.some(
    plugin => plugin.transform === './tools/zod2md-jsdocs/dist',
  );
}
function collectIssues({
  tree,
  projectRoot,
  tsconfigPath,
  hasGenerateDocsTarget,
  missingDependsOn,
  hasPlugin,
}: {
  tree: Tree;
  projectRoot: string;
  tsconfigPath: string | undefined;
  hasGenerateDocsTarget: boolean;
  missingDependsOn: readonly string[];
  hasPlugin: boolean;
}): readonly SyncIssue[] {
  return [
    ...(!tsconfigPath || !tree.exists(tsconfigPath)
      ? [{ type: missingTsconfig, projectRoot, data: undefined }]
      : []),
    ...(hasGenerateDocsTarget
      ? []
      : [
          {
            type: missingTarget,
            projectRoot,
            data: { target: GENERATE_DOCS_TARGET_NAME },
          },
        ]),
    ...(missingDependsOn.length > 0
      ? [
          {
            type: missingBuildDeps,
            projectRoot,
            data: { missing: missingDependsOn },
          },
        ]
      : []),
    ...(tsconfigPath && !hasPlugin
      ? [{ type: missingTsPlugin, projectRoot, data: undefined }]
      : []),
  ];
}
function analyzeProject(
  tree: Tree,
  project: ProjectConfiguration & {
    name: string;
    root: string;
  },
  projectGraphTargets?: ProjectConfiguration['targets'],
): {
  issues: readonly SyncIssue[];
  tsconfigPath: string | undefined;
  missingDependsOn: readonly string[];
} {
  const tsconfigPath = getFirstExistingTsConfig(tree, project.root);
  const missingDependsOn = getMissingDependsOn(
    project.targets?.build?.dependsOn,
    REQUIRED_BUILD_DEPENDS_ON,
  );
  const hasPlugin = hasZod2MdPlugin(tree, tsconfigPath);
  const hasGenerateDocsTarget =
    projectGraphTargets?.[GENERATE_DOCS_TARGET_NAME] !== undefined;
  return {
    issues: collectIssues({
      tree,
      projectRoot: project.root,
      tsconfigPath,
      hasGenerateDocsTarget,
      missingDependsOn,
      hasPlugin,
    }),
    tsconfigPath,
    missingDependsOn,
  };
}
function normalizeDependsOn(
  existingDependsOn: TargetConfiguration['dependsOn'] | undefined,
  missingTargets: readonly string[],
): TargetConfiguration['dependsOn'] {
  const existing = existingDependsOn
    ? Array.isArray(existingDependsOn)
      ? existingDependsOn
      : [existingDependsOn]
    : [];
  const missing = missingTargets.filter(
    target => !isDependencyPresent(existingDependsOn, target),
  );
  return [...existing, ...missing];
}
function applyFixes(
  tree: Tree,
  projectRoot: string,
  tsconfigPath: string | undefined,
  missingDependsOn: readonly string[],
) {
  if (tsconfigPath) {
    addZod2MdTransformToTsConfig(tree, projectRoot, {
      projectName: path.basename(projectRoot),
      baseUrl: `https://github.com/code-pushup/cli/blob/main/${projectRoot}`,
    });
  }
  if (missingDependsOn.length > 0) {
    updateJson(tree, `${projectRoot}/project.json`, projectJson => {
      const build = projectJson.targets?.build ?? {};
      const existingDependsOn = build.dependsOn;
      const normalizedDependsOn = normalizeDependsOn(
        existingDependsOn,
        missingDependsOn,
      );
      return {
        ...projectJson,
        targets: {
          ...projectJson.targets,
          build: {
            ...build,
            dependsOn: normalizedDependsOn,
          },
        },
      };
    });
  }
}
function formatIssueGroups(
  grouped: Record<SyncIssue['type'], readonly SyncIssue[]>,
): readonly (string | null)[] {
  return [
    grouped[missingTsconfig]?.length
      ? `Missing tsconfig in:\n${grouped[missingTsconfig]
          .map(i => `  - ${i.projectRoot}`)
          .join('\n')}`
      : null,
    grouped[missingTarget]?.length
      ? `Missing "${GENERATE_DOCS_TARGET_NAME}" target in:\n${grouped[
          missingTarget
        ]
          .map(i => `  - ${i.projectRoot}`)
          .join('\n')}`
      : null,
    grouped[missingBuildDeps]?.length
      ? `Missing build.dependsOn entries:\n${grouped[missingBuildDeps]
          .map(
            i =>
              `  - ${i.projectRoot}: ${(
                i.data as {
                  missing: string[];
                }
              ).missing.join(', ')}`,
          )
          .join('\n')}`
      : null,
    grouped[missingTsPlugin]?.length
      ? `Missing Zod2Md TypeScript plugin configuration in:\n${grouped[
          missingTsPlugin
        ]
          .map(i => `  - ${i.projectRoot}`)
          .join('\n')}`
      : null,
  ];
}

export function formatIssues(issues: readonly SyncIssue[]): string | undefined {
  if (issues.length === 0) {
    return undefined;
  }
  const grouped: Record<SyncIssue['type'], readonly SyncIssue[]> =
    issues.reduce<Record<SyncIssue['type'], readonly SyncIssue[]>>(
      (acc, issue) => ({
        ...acc,
        [issue.type]: [...(acc[issue.type] ?? []), issue],
      }),
      {
        [missingTsconfig]: [],
        [missingTarget]: [],
        [missingBuildDeps]: [],
        [missingTsPlugin]: [],
      },
    );
  return formatIssueGroups(grouped).filter(Boolean).join('\n\n');
}
export async function syncZod2mdSetupGenerator(tree: Tree, _?: unknown) {
  const graph = await createProjectGraphAsync();
  const results = Object.values(graph.nodes)
    .filter(node => tree.exists(zod2mdConfigPath(node.data.root)))
    .map(node => ({
      root: node.data.root,
      analysis: analyzeProject(
        tree,
        {
          ...node.data,
          name: node.name,
          root: node.data.root,
        },
        node.data.targets,
      ),
    }));
  const changesBefore = tree.listChanges().length;
  results.forEach(({ root, analysis }) =>
    applyFixes(tree, root, analysis.tsconfigPath, analysis.missingDependsOn),
  );
  const changesAfter = tree.listChanges().length;
  const allIssues = results.flatMap(r => r.analysis.issues);
  if (changesAfter > changesBefore) {
    await formatFiles(tree);
  }
  return {
    outOfSyncMessage: formatIssues(allIssues),
  };
}
export default syncZod2mdSetupGenerator;
