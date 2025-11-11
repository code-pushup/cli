import type { CreateNodes, CreateNodesContext } from '@nx/devkit';
import { dirname } from 'node:path';
import { objectToCliArgs } from '@code-pushup/utils';
import { TOOLS_TSCONFIG_PATH } from '../constants.js';
import { KILL_PROCESS_BIN, LIST_PROCESS_BIN } from './constants.js';

type CreateNodesOptions = {
  tsconfig?: string;
  listProcessBin?: string;
  killProcessBin?: string;
  verbose?: boolean;
};

export const createNodes: CreateNodes = [
  '**/project.json',
  (
    projectConfigurationFile: string,
    opts: undefined | unknown,
    context: CreateNodesContext,
  ) => {
    const root = dirname(projectConfigurationFile);

    if (root !== '.') {
      return {};
    }

    const {
      tsconfig = TOOLS_TSCONFIG_PATH,
      listProcessBin = LIST_PROCESS_BIN,
      killProcessBin = KILL_PROCESS_BIN,
      verbose = false,
    } = (opts ?? {}) as CreateNodesOptions;

    return {
      projects: {
        [root]: {
          targets: {
            'clean-npmrc': {
              command: `tsx --tsconfig={args.tsconfig} tools/src/debug/bin/clean-npmrc.ts ${objectToCliArgs(
                {
                  verbose: '{args.verbose}',
                  userconfig: '{args.userconfig}',
                  entryMatch: '{args.entryMatch}',
                },
              ).join(' ')}`,
              options: {
                tsconfig,
                verbose,
              },
            },
            'list-process': {
              command: `tsx --tsconfig={args.tsconfig} ${listProcessBin} ${objectToCliArgs(
                {
                  verbose: '{args.verbose}',
                  slice: '{args.slice}',
                  pid: '{args.pid}',
                  commandMatch: '{args.commandMatch}',
                },
              ).join(' ')}`,
              options: {
                tsconfig,
                slice: 9,
              },
            },
            'kill-process': {
              command: `tsx --tsconfig={args.tsconfig} ${killProcessBin} ${objectToCliArgs(
                {
                  verbose: '{args.verbose}',
                  force: '{args.force}',
                  pid: '{args.pid}',
                  commandMatch: '{args.commandMatch}',
                },
              ).join(' ')}`,
              options: {
                tsconfig,
              },
            },
          },
        },
      },
    };
  },
];
