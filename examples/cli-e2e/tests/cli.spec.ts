import { execSync } from 'child_process';
import { join } from 'path';
import { CliArgsObject, objectToCliArgs } from '@code-pushup/utils';

const configFile = (ext: 'ts' | 'js' | 'mjs') =>
  join(process.cwd(), `examples/cli-e2e/mocks/code-pushup.config.${ext}`);

const execCli = async (argObj: CliArgsObject) => {
  await execSync(
    'npx ' +
      objectToCliArgs({
        _: './dist/packages/cli',
        verbose: true,
        ...argObj
      }).join(' ')
  );
};

describe('cli', () => {
  it('should load .js config file', async () => {
    const argv = await execCli({ configPath: configFile('js') });
  });

  it('should load .mjs config file', async () => {
    const argv = await execCli({ configPath: configFile('mjs') });
  });

  it('should load .ts config file', async () => {
    const argv = await execCli({ configPath: configFile('ts') });
  });
});
