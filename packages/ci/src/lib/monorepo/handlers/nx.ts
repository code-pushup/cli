import { join } from 'node:path';
import { executeProcess, fileExists, stringifyError } from '@code-pushup/utils';
import type { MonorepoToolHandler } from '../tools';

export const nxHandler: MonorepoToolHandler = {
  tool: 'nx',
  async isConfigured(options) {
    return (
      (await fileExists(join(options.cwd, 'nx.json'))) &&
      (
        await executeProcess({
          ...options,
          command: 'npx',
          args: ['nx', 'report'],
        })
      ).code === 0
    );
  },
  async listProjects(options) {
    const { stdout } = await executeProcess({
      ...options,
      command: 'npx',
      args: [
        'nx',
        'show',
        'projects',
        `--with-target=${options.task}`,
        '--json',
      ],
    });
    const projects = parseProjects(stdout);
    return projects.map(project => ({
      name: project,
      bin: `npx nx run ${project}:${options.task} --`,
    }));
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
