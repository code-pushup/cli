import path from 'node:path';
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
    const configPath = path.join(options.cwd, 'turbo.json');
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
          .map(({ name, directory }) => ({
            name,
            directory,
            bin: `npx turbo run ${options.task} --no-cache --force --`,
          }));
      }
    }
    throw new Error(
      `Package manager with workspace configuration not found in Turborepo, expected one of ${WORKSPACE_HANDLERS.map(
        ({ tool }) => tool,
      ).join('/')}`,
    );
  },

  createRunManyCommand(options, projects) {
    // https://turbo.build/repo/docs/reference/run#--concurrency-number--percentage
    const concurrency: number | null =
      options.parallel === true
        ? null
        : options.parallel === false
          ? 1
          : options.parallel;
    return [
      'npx',
      'turbo',
      'run',
      options.task,
      ...(projects.only?.map(project => `--filter=${project}`) ?? []),
      ...(concurrency == null ? [] : [`--concurrency=${concurrency}`]),
      '--',
    ].join(' ');
  },
};
