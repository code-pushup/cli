import {
  type CreateNodesV2,
  type ProjectConfiguration,
  createNodesFromFiles,
} from '@nx/devkit';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { combineGlobPatterns } from 'nx/src/utils/globs';
import { getProjectConfig } from './project-config';

const PROJECT_JSON_FILE_GLOB = '**/project.json';
const PACKAGE_JSON_FILE_GLOB = '**/package.json';
const GLOB_PATTERN = combineGlobPatterns(
  PROJECT_JSON_FILE_GLOB,
  PACKAGE_JSON_FILE_GLOB,
);

export const createNodesV2: CreateNodesV2<any> = [
  GLOB_PATTERN,
  async (configFiles, options, context) => {
    console.log('hello');
    return await createNodesFromFiles(
      async (globMatchingFile, internalOptions) => {
        // Unexpected token 'g', "getProject"... is not valid JSON
        // Project lib-a-e2e is an environment project but has no implicit dependencies.
        const projectConfiguration: ProjectConfiguration = await readFile(
          join(process.cwd(), globMatchingFile),
          'utf8',
        ).then(JSON.parse);
        console.log(
          'getProjectConfig',
          await getProjectConfig(globMatchingFile),
        );
        console.log('projectConfiguration', projectConfiguration);
        if (
          !('name' in projectConfiguration) ||
          typeof projectConfiguration.name !== 'string'
        ) {
          throw new Error('Project name is required');
        }

        const projectRoot = dirname(globMatchingFile);
        if (projectRoot.includes('dummy')) {
          console.log('dummy');
        }
        const { targets, namedInputs = {} } = {
          targets: {
            'code-pushup': {
              command: "node echo 'hello'",
              options: {
                'persist.filename': 'code-pushup.json',
              },
            },
          },
        };
        return {
          projects: {
            [projectRoot]: {
              namedInputs,
              targets,
            },
          },
        };
      },
      configFiles,
      options,
      context,
    );
  },
];
