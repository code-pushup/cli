import { join } from 'path';
import {
  CliArgsObject,
  executeProcess,
  objectToCliArgs,
} from '@code-pushup/utils';

const configFile = (ext: 'ts' | 'js' | 'mjs') =>
  join(process.cwd(), `e2e/cli-e2e/mocks/code-pushup.config.${ext}`);

const execCli = (argObj: Partial<CliArgsObject>) =>
  executeProcess({
    command: 'node',
    args: objectToCliArgs({
      _: './dist/packages/cli/index.js',
      verbose: true,
      ...argObj,
    }),
  });

describe('CLI config parsing', () => {
  it('should load .js config file', async () => {
    await execCli({ config: configFile('js') });
  });

  it('should load .mjs config file', async () => {
    await execCli({ config: configFile('mjs') });
  });

  it('should load .ts config file', async () => {
    await execCli({ config: configFile('ts') });
  });
});
