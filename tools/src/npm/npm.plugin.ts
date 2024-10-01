import {
  type CreateNodes,
  type CreateNodesContext,
  readJsonFile,
} from '@nx/devkit';
import { dirname, join } from 'node:path';
import type { ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';
import { NPM_CHECK_SCRIPT } from './constants';

type CreateNodesOptions = {
  tsconfig?: string;
  npmCheckScript?: string;
  verbose?: boolean;
  publishableTags?: string;
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
      join(process.cwd(), projectConfigurationFile),
    );
    const {
      publishableTags = 'publishable',
      tsconfig = 'tools/tsconfig.tools.json',
      npmCheckScript = NPM_CHECK_SCRIPT,
      verbose = false,
    } = (opts ?? {}) as CreateNodesOptions;

    const isPublishable = (projectConfiguration?.tags ?? []).some(target =>
      publishableTags.includes(target),
    );
    if (!isPublishable) {
      return {};
    }

    return {
      projects: {
        [root]: {
          targets: npmTargets({ root, tsconfig, npmCheckScript, verbose }),
        },
      },
    };
  },
];

function npmTargets({
  root,
  tsconfig,
  npmCheckScript,
  verbose,
}: Required<Omit<CreateNodesOptions, 'publishableTags'>> & {
  root: string;
}) {
  const { name: packageName } = readJsonFile(join(root, 'package.json'));
  return {
    'npm-check': {
      command: `tsx --tsconfig={args.tsconfig} {args.script} --pkgRange=${packageName}@{args.pkgVersion} --registry={args.registry} --verbose=${verbose}`,
      options: {
        script: npmCheckScript,
        tsconfig,
      },
    },
    'npm-install': {
      dependsOn: [
        { project: 'dependencies', targets: 'npm-install', params: 'forward' },
      ],
      command: `npm install -D ${packageName}@{args.pkgVersion} --prefix={args.prefix} --userconfig={args.userconfig}`,
    },
    'npm-uninstall': {
      command: `npm uninstall ${packageName} --prefix={args.prefix} --userconfig={args.userconfig}`,
    },
    'npm-install-e2e': {
      dependsOn: [
        {
          target: 'publish-e2e',
          projects: 'self',
          params: 'forward',
        },
        {
          target: 'npm-install-e2e',
          projects: 'dependencies',
          params: 'forward',
        },
        {
          target: 'publish-e2e',
          projects: 'dependencies',
          params: 'forward',
        },
      ],
      command: `npm install -D --no-fund ${packageName}@{args.pkgVersion} --prefix={args.prefix} --userconfig={args.userconfig}`,
    },
  };
}
