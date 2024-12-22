import path from 'node:path';
import {
  executeProcess,
  fileExists,
  stringifyError,
  toArray,
} from '@code-pushup/utils';
import type { MonorepoToolHandler } from '../tools.js';

export const nxHandler: MonorepoToolHandler = {
  tool: 'nx',

  async isConfigured(options) {
    return (
      (await fileExists(path.join(options.cwd, 'nx.json'))) &&
      (
        await executeProcess({
          command: 'npx',
          args: ['nx', 'report'],
          cwd: options.cwd,
          observer: options.observer,
          ignoreExitCode: true,
        })
      ).code === 0
    );
  },

  async listProjects(options) {
    const { stdout } = await executeProcess({
      command: 'npx',
      args: [
        'nx',
        'show',
        'projects',
        ...toArray(options.nxProjectsFilter).map(arg =>
          arg.replaceAll('{task}', options.task),
        ),
        '--json',
      ],
      cwd: options.cwd,
      observer: options.observer,
    });
    const projects = parseProjects(stdout);
    return projects.toSorted().map(project => ({
      name: project,
      bin: `npx nx run ${project}:${options.task} --`,
    }));
  },

  createRunManyCommand(options, projects) {
    const projectNames: string[] =
      projects.only ?? projects.all.map(({ name }) => name);
    return [
      'npx',
      'nx',
      'run-many',
      `--targets=${options.task}`,
      `--parallel=${options.parallel}`,
      `--projects=${projectNames.join(',')}`,
      '--',
    ].join(' ');
  },
};

function parseProjects(stdout: string): string[] {
  // eslint-disable-next-line functional/no-let
  let json: unknown;
  try {
    json = JSON.parse(stdout);
  } catch (error) {
    throw new Error(
      `Invalid non-JSON output from 'nx show projects' - ${stringifyError(
        error,
      )}`,
    );
  }

  if (
    Array.isArray(json) &&
    json.every((item): item is string => typeof item === 'string')
  ) {
    return json;
  }
  throw new Error(
    `Invalid JSON output from 'nx show projects', expected array of strings, received ${JSON.stringify(
      json,
    )}`,
  );
}
