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
    args: objectToCliArgs({
      _: './dist/packages/cli',
      verbose: true,
      ...argObj,
    }),
  });

// TODO: use print-config command once implemented and check stdout
describe('CLI config parsing', () => {
  it.each(extensions)('should load .%s config file', async ext => {
    await execCli({ config: configFile(ext) });
  });
});
