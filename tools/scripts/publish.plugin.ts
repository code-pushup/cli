import { CreateNodes, CreateNodesContext, readJsonFile } from '@nx/devkit';
import { dirname, join } from 'node:path';
import { ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';

export const createNodes: CreateNodes = [
  '**/project.json',
  (projectConfigurationFile: string, opts, context: CreateNodesContext) => {
    const root = dirname(projectConfigurationFile);
    const projectConfiguration: ProjectConfiguration = readJsonFile(
      projectConfigurationFile,
    );

    const isPublishable = Boolean(projectConfiguration?.targets?.publish);
    const { name: projectName } = projectConfiguration;

    if (!isPublishable) {
      return {};
    }

    return {
      projects: {
        [root]: {
          targets: publishTargets(projectConfiguration, root),
        },
      },
    };
  },
];

function publishTargets(projectConfig: ProjectConfiguration, root: string) {
  const { name: projectName } = projectConfig;
  const { name: packageName } = readJsonFile<PackageJson>(
    join(root, 'package.json'),
  );
  return {
    publish: {
      command: `node tools/scripts/publish.mjs --name=${projectName} --ver={args.ver} --tag={args.tag}`,
      dependsOn: ['build'],
    },
    'npm-install': {
      command: `npm install -D ${packageName}@e2e`,
    },
    'npm-uninstall': {
      command: `npm uninstall ${packageName}`,
    },
  };
}
