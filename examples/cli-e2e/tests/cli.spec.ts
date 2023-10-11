import {
  CliArgsObject,
  executeProcess,
  objectToCliArgs,
} from '@code-pushup/utils';
import { join } from 'path';

const configFile = (ext: 'ts' | 'js' | 'mjs') =>
  join(process.cwd(), `examples/cli-e2e/mocks/code-pushup.config.${ext}`);

const execCli = (argObj: Partial<CliArgsObject>) =>
  executeProcess({
    command: 'node',
    args: objectToCliArgs({
      _: './dist/packages/cli/index.js',
      verbose: true,
      ...argObj,
    }),
  });

describe('cli', () => {
  it('should load .js config file', async () => {
    await execCli({ configPath: configFile('js') });
  });

  it('should load .mjs config file', async () => {
    await execCli({ configPath: configFile('mjs') });
  });

  it('should load .ts config file', async () => {
    await execCli({ configPath: configFile('ts') });
  });
});
