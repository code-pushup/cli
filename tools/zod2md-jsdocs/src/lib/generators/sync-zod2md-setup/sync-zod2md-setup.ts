import {
  type ProjectConfiguration,
  type TargetConfiguration,
  type Tree,
  createProjectGraphAsync,
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
  addZod2MdTransformToTsConfig,
  getFirstExistingTsConfig,
} from '../configuration/tsconfig.js';

const missingTsconfig = 'missing-tsconfig' as const;
const missingTarget = 'missing-target' as const;
const missingBuildDeps = 'missing-build-depends-on' as const;
type SyncIssueDataMap = {
  [missingTsconfig]: undefined;
  [missingTarget]: { target: string };
  [missingBuildDeps]: { missing: readonly string[] };
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

const getMissingDependsOn = (
  dependsOn: TargetConfiguration['dependsOn'] | undefined,
  required: readonly string[],
): readonly string[] => {
  const existing = dependsOn ?? [];
  return required.filter(t => !existing.includes(t));
};

function analyzeProject(
  tree: Tree,
  project: ProjectConfiguration & { name: string; root: string },
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

  const issues: readonly SyncIssue[] = [
    ...(!tsconfigPath || !tree.exists(tsconfigPath)
      ? [
          {
            type: missingTsconfig,
            projectRoot: project.root,
            data: undefined,
          },
        ]
      : ([] as SyncIssue[])),

    ...(project.targets?.[GENERATE_DOCS_TARGET_NAME]
      ? []
      : [
          {
            type: missingTarget,
            projectRoot: project.root,
            data: { target: GENERATE_DOCS_TARGET_NAME },
          },
        ]),

    ...(missingDependsOn.length > 0
      ? [
          {
            type: missingBuildDeps,
            projectRoot: project.root,
            data: { missing: missingDependsOn },
          },
        ]
      : []),
  ];

  return {
    issues,
    tsconfigPath,
    missingDependsOn,
  };
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
      return {
        ...projectJson,
        targets: {
          ...projectJson.targets,
          build: {
            ...build,
            dependsOn: [
              ...new Set([...(build.dependsOn ?? []), ...missingDependsOn]),
            ],
          },
        },
      };
    });
  }
}

function formatIssues(issues: readonly SyncIssue[]): string | undefined {
  if (issues.length === 0) {
    return undefined;
  }

  const grouped = issues.reduce<
    Record<SyncIssue['type'], readonly SyncIssue[]>
  >(
    (acc, issue) => ({
      ...acc,
      [issue.type]: [...(acc[issue.type] ?? []), issue],
    }),
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    {} as Record<SyncIssue['type'], readonly SyncIssue[]>,
  );

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
              `  - ${i.projectRoot}: ${(i.data as { missing: string[] }).missing.join(', ')}`,
          )
          .join('\n')}`
      : null,
  ]
    .filter(Boolean)
    .join('\n\n');
}

export async function syncZod2mdSetupGenerator(tree: Tree, _?: unknown) {
  const graph = await createProjectGraphAsync();
  const results = Object.values(graph.nodes)
    .filter(node => tree.exists(zod2mdConfigPath(node.data.root)))
    .map(node => {
      const projectJson = readJson<ProjectConfiguration>(
        tree,
        `${node.data.root}/project.json`,
      );

      return {
        root: node.data.root,
        analysis: analyzeProject(tree, {
          ...projectJson,
          name: node.name,
          root: node.data.root,
        }),
      };
    });

  results.forEach(({ root, analysis }) =>
    applyFixes(tree, root, analysis.tsconfigPath, analysis.missingDependsOn),
  );

  const allIssues = results.flatMap(r => r.analysis.issues);

  return {
    outOfSyncMessage: formatIssues(allIssues),
  };
}

export default syncZod2mdSetupGenerator;
