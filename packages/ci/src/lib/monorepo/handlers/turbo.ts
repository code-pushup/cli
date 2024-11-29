import { join } from 'node:path';
import { fileExists, readJsonFile } from '@code-pushup/utils';
import type { MonorepoToolHandler } from '../tools.js';
import { npmHandler } from './npm.js';
import { pnpmHandler } from './pnpm.js';
import { yarnHandler } from './yarn.js';

const WORKSPACE_HANDLERS = [pnpmHandler, yarnHandler, npmHandler];

type TurboConfig = {
  tasks: Record<string, object>;
};

export const turboHandler: MonorepoToolHandler = {
  tool: 'turbo',
  async isConfigured(options) {
    const configPath = join(options.cwd, 'turbo.json');
    return (
      (await fileExists(configPath)) &&
      options.task in (await readJsonFile<TurboConfig>(configPath)).tasks
    );
  },
  async listProjects(options) {
    // eslint-disable-next-line functional/no-loop-statements
    for (const handler of WORKSPACE_HANDLERS) {
      if (await handler.isConfigured(options)) {
        const projects = await handler.listProjects(options);
        return projects
          .filter(({ bin }) => bin.includes(`run ${options.task}`)) // must have package.json script
          .map(({ name }) => ({
            name,
            bin: `npx turbo run ${options.task} -F ${name} --`,
          }));
      }
    }
    throw new Error(
      `Package manager for Turborepo not found, expected one of ${WORKSPACE_HANDLERS.map(
        ({ tool }) => tool,
      ).join('/')}`,
    );
  },
};
