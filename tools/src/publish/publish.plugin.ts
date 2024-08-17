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
  sourceDir?: string;
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
      sourceDir = projectConfiguration?.targets?.build?.options?.outputPath ??
        process.cwd(),
    } = (opts ?? {}) as CreateNodesOptions;
    const isPublishable = Boolean(projectConfiguration?.targets?.publish);
    if (!isPublishable) {
      return {};
    }

    const { name: projectName } = projectConfiguration;
    return {
      projects: {
        [root]: {
          targets: publishTargets({
            tsconfig,
            publishScript,
            sourceDir,
            projectName,
          }),
        },
      },
    };
  },
];

function publishTargets({
  tsconfig,
  publishScript,
  sourceDir,
  projectName,
}: Required<CreateNodesOptions> & { projectName: string }) {
  return {
    publish: {
      dependsOn: ['build'],
      // @TODO use objToCliArgs
      command: `tsx --tsconfig={args.tsconfig} {args.script} --name=${projectName} --sourceDir=${sourceDir} --registry={args.registry} --nextVersion={args.nextVersion} --tag={args.tag}`,
      options: {
        script: publishScript,
        tsconfig,
      },
    },
  };
}
