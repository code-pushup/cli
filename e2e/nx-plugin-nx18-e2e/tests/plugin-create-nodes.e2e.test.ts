import {join} from 'node:path';
import {afterEach, expect} from 'vitest';
import {nxShowProjectJson, registerPluginInNxJson,} from '@code-pushup/test-nx-utils';
import {teardownTestFolder} from '@code-pushup/test-setup';
import {executeProcess} from '@code-pushup/utils';

describe('nx-plugin-nx18', () => {
  const project = 'my-lib';
  const envRoot = 'tmp/e2e/nx-plugin-nx18-e2e';
  const baseDir = join(envRoot, '__test__/plugin/create-nodes');

  beforeEach(async () => {
    await executeProcess({
      command: 'npx',
      args: [
        '--yes',
        'create-nx-workspace@18.3.5',
        '__test__/plugin/create-nodes/nxv18',
        '--preset=apps',
        '--appName=my-app',
        '--style=none',
        '--packageManager=npm',
        '--interactive=false',
        '--ci=skip',
      ],
      cwd: envRoot,
    })
    await registerPluginInNxJson(join(envRoot, 'code-pushup.config.ts'), '@code-pushup/nx-plugin');
  });

  afterEach(async () => {
    await teardownTestFolder(baseDir);
  });

  it('should add configuration target dynamically in nx18', async () => {

    const { code, projectJson } = await nxShowProjectJson(envRoot, project);
    expect(code).toBe(0);

    expect(projectJson.targets).toStrictEqual({
      ['code-pushup--configuration']: {
        configurations: {},
        executor: 'nx:run-commands',
        options: {
          command: `nx g @code-pushup/nx-plugin:configuration --skipTarget --targetName="code-pushup" --project="${project}"`,
        },
      },
    });

    expect(projectJson.targets).toMatchSnapshot();
  });

}, 300000);
