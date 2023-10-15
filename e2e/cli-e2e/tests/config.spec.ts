import { join } from 'path';
import {
  CliArgsObject,
  executeProcess,
  objectToCliArgs,
} from '@code-pushup/utils';

const extensions = ['js', 'mjs', 'ts'] as const;
type Extension = (typeof extensions)[number];

const configFile = (ext: Extension) =>
  join(process.cwd(), `e2e/cli-e2e/mocks/code-pushup.config.${ext}`);

const execCli = (argObj: Partial<CliArgsObject>) =>
  executeProcess({
    command: 'npx',
    args: [
      './dist/packages/cli',
      'collect',
      ...objectToCliArgs({
        verbose: true,
        ...argObj,
      }),
    ],
  });

// TODO: use print-config command once implemented and check stdout
describe('CLI config parsing', () => {
  it.each(extensions)('should load .%s config file', async ext => {
    const { code, stderr } = await execCli({ config: configFile(ext) });
    expect(code).toBe(0);
    expect(stderr).toBe('');
  });
});
