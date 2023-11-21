// @TODO move logic into testing library
import { join } from 'path';
import {
  CliArgsObject,
  ProcessConfig,
  executeProcess,
  objectToCliArgs,
} from '@code-pushup/utils';

export const extensions = ['js', 'mjs', 'ts'] as const;
export type Extension = (typeof extensions)[number];

export const configFile = (ext: Extension = 'ts') =>
  join(process.cwd(), `e2e/cli-e2e/mocks/code-pushup.config.${ext}`);

export const execCli = (
  command: string,
  argObj: Partial<CliArgsObject>,
  processOptions?: Omit<ProcessConfig, 'args' | 'command' | 'observer'>,
) =>
  executeProcess({
    command: 'code-pushup',
    args: [
      command,
      ...objectToCliArgs({
        verbose: true,
        progress: false,
        config: configFile(),
        ...argObj,
      }),
    ],
    ...processOptions,
  });
