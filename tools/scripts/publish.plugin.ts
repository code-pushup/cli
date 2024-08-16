import { CreateNodes, CreateNodesContext, readJsonFile } from '@nx/devkit';
import { dirname, join } from 'node:path';
import { ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';
import { PackageJson } from 'nx/src/utils/package-json';

export const createNodes: CreateNodes = [
  '**/project.json',
  (projectConfigurationFile: string, opts, context: CreateNodesContext) => {
    const root = dirname(projectConfigurationFile);
    const projectConfiguration: ProjectConfiguration = readJsonFile(
      projectConfigurationFile,
    );

    const isPublishable = Boolean(projectConfiguration?.targets?.publish);

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
  const { name: packageName } = readJsonFile(join(root, 'package.json'));
  return {
    publish: {
      dependsOn: ['build'],
      command: `node tools/scripts/publish.mjs --name=${projectName} --registry={args.registry} --nextVersion={args.nextVersion} --tag={args.tag}`,
    },
    'npm-check': {
      command: `node ./tools/scripts/check-package-range.mjs --pkgVersion=${packageName}@{args.pkgVersion} --registry={args.registry}`,
    },
    'npm-install': {
      command: `npm install -D ${packageName}@{args.pkgVersion}`,
    },
    'npm-uninstall': {
      command: `npm uninstall ${packageName}`,
    },
  };
}
