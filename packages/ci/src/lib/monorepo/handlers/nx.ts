import {
  executeProcess,
  interpolate,
  stringifyError,
  toArray,
} from '@code-pushup/utils';
import type { MonorepoToolHandler } from '../tools.js';

export const nxHandler: MonorepoToolHandler = {
  tool: 'nx',

  async listProjects({ cwd, task, nxProjectsFilter }) {
    const { code, stderr } = await executeProcess({
      command: 'npx',
      args: ['nx', 'report'],
      cwd,
      ignoreExitCode: true,
    });
    if (code !== 0) {
      const suffix = stderr ? ` - ${stderr}` : '';
      throw new Error(`'nx report' failed with exit code ${code}${suffix}`);
    }

    const { stdout } = await executeProcess({
      command: 'npx',
      args: [
        'nx',
        'show',
        'projects',
        ...toArray(nxProjectsFilter).map(arg => interpolate(arg, { task })),
        '--json',
      ],
      cwd,
    });
    const projects = parseProjects(stdout);
    return projects.toSorted().map(project => ({
      name: project,
      bin: `npx nx run ${project}:${task} --`,
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
