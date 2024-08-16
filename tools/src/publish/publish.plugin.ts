import {
  type CreateNodes,
  type CreateNodesContext,
  readJsonFile,
} from '@nx/devkit';
import { dirname, join } from 'node:path';
import { type ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';

type CreateNodesOptions = {
  tsconfig?: string;
  publishScript?: string;
};
export const createNodes: CreateNodes = [
  '**/project.json',
  (
    projectConfigurationFile: string,
    opts: undefined | unknown,
    context: CreateNodesContext,
  ) => {
    const root = dirname(projectConfigurationFile);
    const projectConfiguration: ProjectConfiguration = readJsonFile(
      projectConfigurationFile,
    );
    const {
      tsconfig = 'tools/tsconfig.tools.json',
      publishScript = 'tools/src/publish/scripts/publish-package.ts',
    } = (opts ?? {}) as CreateNodesOptions;
    const isPublishable = Boolean(projectConfiguration?.targets?.publish);
    if (!isPublishable) {
      return {};
    }

    return {
      projects: {
        [root]: {
          targets: publishTargets(projectConfiguration, {
            tsconfig,
            publishScript,
          }),
        },
      },
    };
  },
];

function publishTargets(
  projectConfig: ProjectConfiguration,
  { tsconfig, publishScript }: Required<CreateNodesOptions>,
) {
  const { name: projectName } = projectConfig;
  return {
    publish: {
      dependsOn: ['build'],
      command: `tsx --tsconfig={args.tsconfig} {args.script} --name=${projectName} --registry={args.registry} --nextVersion={args.nextVersion} --tag={args.tag}`,
      options: {
        script: publishScript,
        tsconfig,
      },
    },
  };
}
